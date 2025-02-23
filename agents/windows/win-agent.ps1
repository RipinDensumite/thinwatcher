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
$dialogPath = Join-Path $directoryPath 'dialog-gui.ps1'

# Declare $isGUIOpen at the script level to maintain its state across function calls
$script:isGUIOpen = $false
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

function Send-Heartbeat {
    try {
        $sessions = Get-SessionData
        $activeUsers = $sessions | 
        Where-Object { $_.State -eq "Active" } | 
        Select-Object -ExpandProperty User

        # Check if there are any active sessions
        if ($activeUsers.Count -gt 0) {
            if (-not $script:isGUIOpen) {
                Start-Process -FilePath "powershell.exe" -ArgumentList "-File $dialogPath"
                $script:isGUIOpen = $true
            }
            Write-Output 1
       
        }
        else {
            $script:isGUIOpen = $false
            Write-Output 0
        }

        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
        }

        Invoke-RestMethod -Uri "$BACKEND_URL/api/status" -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Depth 4)
    }
    catch {
        Write-Warning "Status update failed: $($_.Exception.Message)"
    }
}

function Check-Termination {
    try {
        $command = Invoke-RestMethod -Uri "$BACKEND_URL/api/terminate/$CLIENT_ID"
        if ($command.action -eq 'logoff') {
            & logoff $command.sessionId
        }
    }
    catch {
        Write-Warning "Termination check failed: $($_.Exception.Message)"
    }
}

# Main loop
while ($true) {
    Send-Heartbeat
    Check-Termination
    Start-Sleep -Seconds $HEARTBEAT_INTERVAL
}