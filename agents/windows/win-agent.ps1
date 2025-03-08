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
$guiProcessId = $null
$lastHeartbeatTime = [DateTime]::MinValue
$lastTerminationCheckTime = [DateTime]::MinValue

# Optimize by only loading this assembly once
Add-Type -AssemblyName System.Windows.Forms

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
        [int]$processId
    )
    
    if (-not $processId) { return $false }
    
    try {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        return ($process -ne $null)
    }
    catch {
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
        $activeUsers = $sessions | 
        Where-Object { $_.State -eq "Active" } | 
        Select-Object -ExpandProperty User

        # Manage GUI dialog efficiently
        if ($activeUsers.Count -gt 0) {
            if (-not (Is-ProcessRunning -processId $guiProcessId)) {
                $guiProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-File $dialogPath" -PassThru
                $guiProcessId = $guiProcess.Id
            }
        }
        else {
            if (Is-ProcessRunning -processId $guiProcessId) {
                Stop-Process -Id $guiProcessId -Force -ErrorAction SilentlyContinue
                $guiProcessId = $null
            }
        }

        # Prepare heartbeat data
        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
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
        Write-Warning "Status update failed: $($_.Exception.Message)"
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
            & logoff $command.sessionId
        }
        $lastTerminationCheckTime = $currentTime
    }
    catch {
        Write-Warning "Termination check failed: $($_.Exception.Message)"
    }
}

# Use a more efficient main loop with non-blocking sleep
# Main loop
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