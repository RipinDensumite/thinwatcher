#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

$scriptDirectory = $PSScriptRoot
$configFile = Join-Path -Path $scriptDirectory -ChildPath "config.txt"
$logPath = Join-Path -Path $scriptDirectory -ChildPath "agent_log.txt"

# Set up logging
function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

function Read-Config {
    if (-not (Test-Path $configFile)) {
        Write-Error "Configuration file not found: $configFile"
        exit 1
    }

    $config = @{}
    Get-Content $configFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $config[$key] = $value
        }
    }
    return $config
}

# Read configuration
Write-Log "Reading configuration..."
$config = Read-Config

# Assign configuration values to variables
$CLIENT_ID = $config["CLIENT_ID"]
$BACKEND_URL = $config["BACKEND_URL"]
$HEARTBEAT_INTERVAL = [int]$config["HEARTBEAT_INTERVAL"]
$OS_TYPE = "Windows"

# Validate required configuration
if (-not $CLIENT_ID -or -not $BACKEND_URL -or -not $HEARTBEAT_INTERVAL) {
    Write-Log "ERROR: Missing required configuration values. Please check config.txt"
    exit 1
}

# Output configuration values for verification
Write-Log "Configuration loaded:"
Write-Log "Backend URL: $BACKEND_URL"
Write-Log "Heartbeat Interval: $HEARTBEAT_INTERVAL seconds"
Write-Log "Client ID: $CLIENT_ID"

# Initialize state variables
$lastHeartbeatTime = [DateTime]::MinValue
$lastTerminationCheckTime = [DateTime]::MinValue

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

function Send-Heartbeat {
    # Throttle heartbeat requests
    $currentTime = Get-Date
    if (($currentTime - $lastHeartbeatTime).TotalSeconds -lt $HEARTBEAT_INTERVAL) {
        return
    }
    
    try {
        # Get session data once - reuse for heartbeat
        $sessions = Get-SessionData
        $activeSessions = $sessions | Where-Object { $_.State -eq "Active" }
        $activeUsers = $activeSessions | Select-Object -ExpandProperty User
        
        # Prepare heartbeat data
        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
        }
        
        # Send heartbeat
        $jsonBody = ($body | ConvertTo-Json -Depth 4)
        $params = @{
            Uri         = "$BACKEND_URL/api/status"
            Method      = "Post"
            ContentType = "application/json"
            Body        = $jsonBody
            TimeoutSec  = 5
            ErrorAction = "Stop"
        }
        
        Invoke-RestMethod @params
        $script:lastHeartbeatTime = $currentTime
        Write-Log "Heartbeat sent successfully"
    }
    catch {
        Write-Log "Status update failed: $($_.Exception.Message)"
    }
}

function Get-Termination {
    # Throttle termination checks - don't need to check as often as heartbeat
    $currentTime = Get-Date
    if (($currentTime - $lastTerminationCheckTime).TotalSeconds -lt 5) {
        return
    }
    
    try {
        $params = @{
            Uri         = "$BACKEND_URL/api/terminate/$CLIENT_ID"
            TimeoutSec  = 3
            ErrorAction = "SilentlyContinue"
        }
        
        $command = Invoke-RestMethod @params
        if ($command.action -eq 'logoff') {
            Write-Log "Received logoff command for session $($command.sessionId)"
            & logoff $command.sessionId
        }
        $script:lastTerminationCheckTime = $currentTime
    }
    catch {
        # Only log if it's not a 404 (which is normal when no termination is pending)
        if ($_.Exception.Response.StatusCode.value__ -ne 404) {
            Write-Log "Termination check failed: $($_.Exception.Message)"
        }
    }
}

# Main script
Write-Log "Win-Agent starting..."

# Main loop with efficient sleep
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
while ($true) {
    # Reset stopwatch at beginning of each loop
    $stopwatch.Reset()
    $stopwatch.Start()
    
    # Perform operations
    Send-Heartbeat
    Get-Termination
    
    # Calculate sleep time to maintain interval
    $processingTime = $stopwatch.ElapsedMilliseconds
    $sleepTime = [Math]::Max(1, ($HEARTBEAT_INTERVAL * 1000) - $processingTime)
    Start-Sleep -Milliseconds $sleepTime
}