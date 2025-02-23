#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$InstallDir = "$env:ProgramFiles\WinAgent"
$ConfigFile = "$InstallDir\config.txt"

function Restart-ScheduleTask {
    # Restart the scheduled task to apply changes
    $ServiceName = "WinAgent"

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

    Start-ScheduledTask -TaskName $ServiceName
}

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

try {
    # Check if config file exists
    if (-not (Test-Path $ConfigFile)) {
        Write-Host "Configuration file not found. Please ensure the agent is installed correctly." -ForegroundColor Red
        exit 1
    }

    # Prompt for new configuration values
    Write-Host "Please provide the following configuration values or CTRL + C to cancel the reconfiguration" -ForegroundColor Cyan

    $BACKEND_URL = Read-Host "Backend URL (e.g., https://backend-url.com)"
    $HEARTBEAT_INTERVAL = Read-Host "Heartbeat Interval in seconds (e.g., 5)"
    $CLIENT_ID = Read-Host "Client ID (e.g., THINCLIENT-02)"

    # Validate Heartbeat Interval
    if (-not ($HEARTBEAT_INTERVAL -match '^\d+$')) {
        Write-Host "Heartbeat Interval must be a number. Exiting." -ForegroundColor Red
        exit 1
    }

    # Create new config content
    $configContent = @"
BACKEND_URL=$BACKEND_URL
HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
CLIENT_ID=$CLIENT_ID
"@

    # Write new config content to file
    Set-Content -Path $ConfigFile -Value $configContent
    Write-Host "Configuration file updated at $ConfigFile" -ForegroundColor Green

    Restart-ScheduleTask

    Write-Host "Reconfiguration completed. Agent is now running with the updated configuration." -ForegroundColor Green
}
catch {
    Write-Host "Reconfiguration failed: $_" -ForegroundColor Red
    exit 1
}