$directoryPath = $PSScriptRoot
$configFile = "$directoryPath\config.txt"

function Read-Config {
    $config = @{}
    if (Test-Path $configFile) {
        Get-Content $configFile | Foreach-Object {
            if ($_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $config[$key] = $value
            }
        }
    }
    else {
        Write-Error "Configuration file not found: $configFile"
        exit 1
    }
    return $config
}

# Read configuration only once at startup
$config = Read-Config

# Assign configuration values to variables
$CLIENT_ID = $config["CLIENT_ID"]
$BACKEND_URL = $config["BACKEND_URL"]
$HEARTBEAT_INTERVAL = [int]$config["HEARTBEAT_INTERVAL"]

# Validate required configuration
if (-not $CLIENT_ID -or -not $BACKEND_URL -or -not $HEARTBEAT_INTERVAL) {
    Write-Error "Missing required configuration values. Please check config.txt"
    exit 1
}

# Output configuration values for verification
Write-Host "Configuration loaded:"
Write-Host "Backend URL: $BACKEND_URL"
Write-Host "Heartbeat Interval: $HEARTBEAT_INTERVAL seconds"
Write-Host "Client ID: $CLIENT_ID"

$OS_TYPE = "Windows"
$dialogPath = "$directoryPath\dialog-gui.ps1"
$lastHeartbeatTime = [DateTime]::MinValue
$lastTerminationCheckTime = [DateTime]::MinValue
$lastActiveSession = $false
$activeGuiProcess = $null

# Set up logging
$logPath = "$directoryPath\agent_log.txt"
function Write-Log {
    param(
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

function Get-SessionData {
    $raw = query session
    $sessionList = @()

    # State normalization mapping
    $stateMap = @{
        "Activ" = "Active"
        "Conn"  = "Connected"
        "Disc"  = "Disconnected"
        "Liste" = "Listen"
    }

    # Process header to find column positions
    $headerLine = $raw | Select-Object -First 1
    $columns = @()

    $columnOrder = @("SESSIONNAME", "USERNAME", "ID", "STATE")
    foreach ($col in $columnOrder) {
        $index = $headerLine.IndexOf($col)
        if ($index -ne -1) {
            $columns += @{
                Name  = $col
                Start = $index
                End   = $index + $col.Length
            }
        }
    }

    # Process session lines
    $raw | Select-Object -Skip 1 | ForEach-Object {
        $line = $_.PadRight(80)
        $session = [PSCustomObject]@{
            ID    = $null
            User  = "SYSTEM"
            State = $null
        }

        foreach ($col in $columns) {
            $value = $line.Substring($col.Start, $col.End - $col.Start).Trim()
            
            switch ($col.Name) {
                "USERNAME" { 
                    if ($value) { $session.User = $value } 
                }
                "ID" { 
                    $session.ID = $value 
                }
                "STATE" { 
                    if ($stateMap.ContainsKey($value)) {
                        $session.State = $stateMap[$value]
                    }
                    else {
                        $session.State = $value
                    }
                }
            }
        }

        if ($session.ID -match '^\d+$') {
            $sessionList += $session
        }
    }

    return $sessionList
}

function Is-ProcessRunning {
    param (
        [System.Diagnostics.Process]$process
    )
    
    if (-not $process) { return $false }
    
    try {
        if ($process.HasExited) {
            return $false
        }
        return $true
    }
    catch {
        return $false
    }
}

function Launch-DialogInUserContext {
    param (
        [string]$sessionId,
        [string]$username
    )
    
    Write-Log "Attempting to launch dialog in session $sessionId for user $username"
    
    try {
        # Create a temporary VBS script that will launch our PowerShell dialog
        $vbsPath = "$directoryPath\launcher.vbs"
        $psLaunchCmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Normal -File `"$dialogPath`""
        
        $vbsContent = @"
Set objShell = CreateObject("WScript.Shell")
objShell.Run "$psLaunchCmd", 1, False
"@
        
        Set-Content -Path $vbsPath -Value $vbsContent -Force
        
        # Use PsExec to run the VBS script in the user's context
        $result = & psexec -i $sessionId -d -s cscript.exe "$vbsPath" 2>&1
        
        # Remove the temporary VBS script
        Remove-Item -Path $vbsPath -Force -ErrorAction SilentlyContinue
        
        Write-Log "Dialog launch attempt result: $result"
        return $true
    }
    catch {
        Write-Log "Failed to launch dialog in user context: $($_.Exception.Message)"
        return $false
    }
}

function Send-Heartbeat {
    # Throttle heartbeat requests to avoid overwhelming the backend
    $currentTime = Get-Date
    $heartbeatInterval = [TimeSpan]::FromSeconds($HEARTBEAT_INTERVAL)
    $timeSinceLastHeartbeat = $currentTime - $lastHeartbeatTime
    
    if ($timeSinceLastHeartbeat.TotalSeconds -lt $HEARTBEAT_INTERVAL) {
        return
    }
    
    try {
        # Get session data once - reuse for both GUI check and heartbeat
        $sessions = Get-SessionData
        $activeSessions = $sessions | Where-Object { $_.State -eq "Active" }
        $activeUsers = $activeSessions | Select-Object -ExpandProperty User
        
        # Manage GUI dialog for active sessions
        if ($activeSessions.Count -gt 0 -and -not $lastActiveSession) {
            Write-Log "Detected new active session(s): $($activeUsers -join ', ')"
            
            foreach ($session in $activeSessions) {
                if ($session.User -ne "SYSTEM") {
                    # Launch dialog in user session
                    $dialogLaunched = Launch-DialogInUserContext -sessionId $session.ID -username $session.User
                    if ($dialogLaunched) {
                        Write-Log "Dialog successfully launched for user $($session.User)"
                        break
                    }
                }
            }
            
            $lastActiveSession = $true
        }
        elseif ($activeSessions.Count -eq 0) {
            $lastActiveSession = $false
        }

        # Prepare heartbeat data
        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
        }
        
        # Check if a user was selected (from the dialog)
        $selectedUserPath = "$directoryPath\selected_user.txt"
        if (Test-Path $selectedUserPath) {
            $selectedUser = Get-Content $selectedUserPath -Raw
            if ($selectedUser) {
                $body.selectedUser = $selectedUser.Trim()
                Write-Log "Including selected user in heartbeat: $($body.selectedUser)"
                # Remove the file after reading to prevent reusing the selection
                Remove-Item $selectedUserPath -Force
            }
        }

        # Send heartbeat in a non-blocking way
        $jsonBody = ($body | ConvertTo-Json -Depth 4)
        $task = Invoke-RestMethod -Uri "$BACKEND_URL/api/status" -Method Post `
            -ContentType "application/json" `
            -Body $jsonBody `
            -TimeoutSec 5 `
            -ErrorAction SilentlyContinue
            
        $lastHeartbeatTime = $currentTime
    }
    catch {
        Write-Log "Status update failed: $($_.Exception.Message)"
    }
}

function Check-Termination {
    # Throttle termination checks - don't need to check as often as heartbeat
    $currentTime = Get-Date
    $timeSinceLastCheck = $currentTime - $lastTerminationCheckTime
    
    # Check termination less frequently (e.g., every 5 seconds) to reduce API calls
    if ($timeSinceLastCheck.TotalSeconds -lt 5) {
        return
    }
    
    try {
        $command = Invoke-RestMethod -Uri "$BACKEND_URL/api/terminate/$CLIENT_ID" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($command.action -eq 'logoff') {
            Write-Log "Received logoff command for session $($command.sessionId)"
            & logoff $command.sessionId
        }
        $lastTerminationCheckTime = $currentTime
    }
    catch {
        Write-Log "Termination check failed: $($_.Exception.Message)"
    }
}

# Install PsExec if necessary
function Ensure-PsExec {
    $psExecPath = "$env:SystemRoot\System32\PsExec.exe"
    
    if (-not (Test-Path $psExecPath)) {
        Write-Log "PsExec not found. Attempting to download Sysinternals Suite..."
        
        $tempZip = "$env:TEMP\SysinternalsSuite.zip"
        $tempDir = "$env:TEMP\SysinternalsSuite"
        
        try {
            # Download Sysinternals Suite
            Invoke-WebRequest -Uri "https://download.sysinternals.com/files/SysinternalsSuite.zip" -OutFile $tempZip
            
            # Create temp directory
            if (-not (Test-Path $tempDir)) {
                New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
            }
            
            # Extract zip file
            Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
            
            # Copy PsExec to System32
            Copy-Item -Path "$tempDir\PsExec.exe" -Destination $psExecPath -Force
            
            # Clean up
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
            
            Write-Log "PsExec installed successfully."
            return $true
        }
        catch {
            Write-Log "Failed to install PsExec: $($_.Exception.Message)"
            return $false
        }
    }
    
    return $true
}

# Main script
Write-Log "Win-Agent starting..."

# Ensure PsExec is available
if (-not (Ensure-PsExec)) {
    Write-Log "ERROR: Could not ensure PsExec is available. GUI functionality may not work."
}

# Use a more efficient main loop with non-blocking sleep
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
while ($true) {
    # Reset stopwatch at beginning of each loop
    $stopwatch.Reset()
    $stopwatch.Start()
    
    # Perform operations
    Send-Heartbeat
    Check-Termination
    
    # Calculate how long operations took
    $processingTime = $stopwatch.ElapsedMilliseconds
    
    # Calculate sleep time to maintain interval
    $sleepTime = [Math]::Max(1, ($HEARTBEAT_INTERVAL * 1000) - $processingTime)
    Start-Sleep -Milliseconds $sleepTime
}