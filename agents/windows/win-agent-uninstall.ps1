#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"
$InstallDir = "$env:ProgramFiles\WinAgent"
$ConfigFile = "$InstallDir\config.txt"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

try {
    # Read the config file to get the CLIENT_ID and BACKEND_URL
    if (Test-Path $ConfigFile) {
        $config = @{}
        Get-Content $ConfigFile | ForEach-Object {
            if ($_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $config[$key] = $value
            }
        }
        $CLIENT_ID = $config["CLIENT_ID"]
        $BACKEND_URL = $config["BACKEND_URL"]
    }
    else {
        Write-Host "Config file not found. Proceeding with uninstallation without notifying the backend." -ForegroundColor Yellow
    }

    # Stop and remove scheduled task
    if (Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false | Out-Null
    }

    # Stop running agent processes more gracefully
    $agentProcesses = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%win-agent.ps1%'"
    foreach ($proc in $agentProcesses) {
        try {
            $process = Get-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue
            if ($process) {
                # Try graceful stop first
                $process.CloseMainWindow() | Out-Null
                # Wait up to 5 seconds for process to exit
                if (!$process.WaitForExit(5000)) {
                    # Force kill if still running
                    Stop-Process -Id $proc.ProcessId -Force
                }
            }
        }
        catch {
            Write-Warning "Could not gracefully stop process $($proc.ProcessId): $_"
        }
    }

    # Wait a moment to ensure processes are fully stopped
    Start-Sleep -Seconds 2

    # Remove installation directory
    if (Test-Path $InstallDir) {
        Remove-Item -Path $InstallDir -Recurse -Force
    }

    # Notify the backend server to remove the client
    if ($CLIENT_ID -and $BACKEND_URL) {
        try {
            $url = "$BACKEND_URL/api/clients/$CLIENT_ID"
            Invoke-RestMethod -Uri $url -Method Delete
            Write-Host "Notified backend server to remove client $CLIENT_ID." -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to notify backend server: $_"
        }
    }

    Write-Host "Uninstallation completed successfully." -ForegroundColor Green
}
catch {
    Write-Host "Uninstallation failed: $_" -ForegroundColor Red
    exit 1
}