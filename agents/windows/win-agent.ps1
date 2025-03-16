$directoryPath = $PSScriptRoot
$configFile = "$directoryPath\config.txt"

function Read-Config {
    if (-not (Test-Path $configFile)) {
        Write-Error "Configuration file not found: $configFile"
        exit 1
    }
    
    $config = @{}
    Get-Content $configFile | Where-Object { $_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$' } | ForEach-Object {
        $config[$matches[1].Trim()] = $matches[2].Trim()
    }
    
    return $config
}

# Read configuration once at startup
$config = Read-Config

# Assign configuration values
$CLIENT_ID = $config["CLIENT_ID"]
$BACKEND_URL = $config["BACKEND_URL"]
$HEARTBEAT_INTERVAL = [int]$config["HEARTBEAT_INTERVAL"]
$ENABLE_DIALOG = if ($config.ContainsKey("ENABLE_DIALOG")) { [bool]::Parse($config["ENABLE_DIALOG"]) } else { $false }

# Validate required configuration
if (-not $CLIENT_ID -or -not $BACKEND_URL -or -not $HEARTBEAT_INTERVAL) {
    Write-Error "Missing required configuration values. Please check config.txt"
    exit 1
}

# Constants
$OS_TYPE = "Windows"
$dialogPath = "$directoryPath\dialog-gui.ps1"
$logPath = "$directoryPath\agent_log.txt"
$selectedUserPath = "$directoryPath\selected_user.txt"
$vbsPath = "$directoryPath\launcher.vbs"
$lastHeartbeatTime = [DateTime]::MinValue
$lastTerminationCheckTime = [DateTime]::MinValue
$lastActiveSession = $false

# More efficient state mapping using hashtable
$stateMap = @{
    "Activ" = "Active"
    "Conn"  = "Connected"
    "Disc"  = "Disconnected"
    "Liste" = "Listen"
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

function Get-SessionData {
    $sessionList = @()
    $raw = query session
    
    # Extract column positions from header
    $headerLine = $raw[0]
    $sessionNamePos = $headerLine.IndexOf("SESSIONNAME")
    $userPos = $headerLine.IndexOf("USERNAME")
    $idPos = $headerLine.IndexOf("ID")
    $statePos = $headerLine.IndexOf("STATE")
    
    # Process data rows
    for ($i = 1; $i -lt $raw.Count; $i++) {
        $line = $raw[$i].PadRight(80)
        
        $id = $line.Substring($idPos, 10).Trim()
        # Skip if ID is not numeric
        if ($id -notmatch '^\d+$') { continue }
        
        $user = $line.Substring($userPos, $idPos - $userPos).Trim()
        if (-not $user) { $user = "SYSTEM" }
        
        $state = $line.Substring($statePos, 10).Trim()
        if ($stateMap.ContainsKey($state)) { $state = $stateMap[$state] }
        
        $sessionList += [PSCustomObject]@{
            ID = $id
            User = $user
            State = $state
        }
    }
    
    return $sessionList
}

function Start-DialogInUserContext {
    param (
        [string]$sessionId,
        [string]$username
    )
    
    Write-Log "Launching dialog in session $sessionId for user $username"
    
    try {
        $psLaunchCmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Normal -File `"$dialogPath`""
        $vbsContent = "Set objShell = CreateObject(`"WScript.Shell`")`nobjShell.Run `"$psLaunchCmd`", 1, False"
        Set-Content -Path $vbsPath -Value $vbsContent -Force
        
        & psexec -i $sessionId -d -s cscript.exe "$vbsPath" | Out-Null
        Remove-Item -Path $vbsPath -Force -ErrorAction SilentlyContinue
        return $true
    }
    catch {
        Write-Log "Dialog launch failed: $($_.Exception.Message)"
        return $false
    }
}

function Send-Heartbeat {
    $currentTime = Get-Date
    if (($currentTime - $lastHeartbeatTime).TotalSeconds -lt $HEARTBEAT_INTERVAL) {
        return
    }
    
    try {
        # Get session data once
        $sessions = Get-SessionData
        $activeSessions = $sessions | Where-Object { $_.State -eq "Active" }
        $activeUsers = $activeSessions | Select-Object -ExpandProperty User
        
        # Handle dialog if enabled and active session detected
        if ($ENABLE_DIALOG -and $activeSessions.Count -gt 0 -and -not $lastActiveSession) {
            Write-Log "Active session(s) detected: $($activeUsers -join ', ')"
            
            foreach ($session in $activeSessions) {
                if ($session.User -ne "SYSTEM") {
                    if (Start-DialogInUserContext -sessionId $session.ID -username $session.User) {
                        break
                    }
                }
            }
            
            $script:lastActiveSession = $true
        }
        elseif ($activeSessions.Count -eq 0) {
            $script:lastActiveSession = $false
        }

        # Prepare heartbeat data
        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
        }
        
        # Check for selected user
        if (Test-Path $selectedUserPath) {
            $body.selectedUser = (Get-Content $selectedUserPath -Raw).Trim()
            Remove-Item $selectedUserPath -Force
        }

        # Send heartbeat
        $jsonBody = ($body | ConvertTo-Json -Depth 2 -Compress)
        Invoke-RestMethod -Uri "$BACKEND_URL/api/status" -Method Post `
            -ContentType "application/json" `
            -Body $jsonBody `
            -TimeoutSec 5 `
            -ErrorAction SilentlyContinue
            
        $script:lastHeartbeatTime = $currentTime
    }
    catch {
        Write-Log "Status update failed: $($_.Exception.Message)"
    }
}

function Get-Termination {
    $currentTime = Get-Date
    if (($currentTime - $lastTerminationCheckTime).TotalSeconds -lt 5) {
        return
    }
    
    try {
        $command = Invoke-RestMethod -Uri "$BACKEND_URL/api/terminate/$CLIENT_ID" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($command.action -eq 'logoff') {
            Write-Log "Logoff command for session $($command.sessionId)"
            & logoff $command.sessionId
        }
        $script:lastTerminationCheckTime = $currentTime
    }
    catch {
        # Silently handle failed termination checks
    }
}

# Ensure PsExec is available - run only once at startup
function Get-PsExec {
    $psExecPath = "$env:SystemRoot\System32\PsExec.exe"
    
    if (Test-Path $psExecPath) { return $true }
    
    Write-Log "PsExec not found. Downloading Sysinternals Suite..."
    
    try {
        $tempZip = "$env:TEMP\SysinternalsSuite.zip"
        $tempDir = "$env:TEMP\SysinternalsSuite"
        
        # Download and extract
        Invoke-WebRequest -Uri "https://download.sysinternals.com/files/SysinternalsSuite.zip" -OutFile $tempZip
        if (-not (Test-Path $tempDir)) { New-Item -Path $tempDir -ItemType Directory -Force | Out-Null }
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

# Main script
Write-Log "Win-Agent starting..."

# Log minimal configuration info
Write-Log "Configuration: Backend: $BACKEND_URL, Interval: $HEARTBEAT_INTERVAL, Dialog: $ENABLE_DIALOG"

# Ensure PsExec is available if dialog is enabled
if ($ENABLE_DIALOG) {
    Get-PsExec | Out-Null
}

# Main loop with efficient sleep timing
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
while ($true) {
    $stopwatch.Restart()
    
    Send-Heartbeat
    Get-Termination
    
    # Sleep for remaining time in the interval
    $elapsed = $stopwatch.ElapsedMilliseconds
    $sleepTime = [Math]::Max(1, ($HEARTBEAT_INTERVAL * 1000) - $elapsed)
    Start-Sleep -Milliseconds $sleepTime
}