# win-agent-uninstall.ps1
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

try {
    # Stop and remove scheduled task
    if (Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false | Out-Null
    }
    
    # Stop running agent processes forcefully
    $agentProcesses = Get-Process | Where-Object { $_.Path -like "*win-agent.ps1*" }
    foreach ($proc in $agentProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        catch {
            Write-Warning "Could not stop process $($proc.Id): $_"
        }
    }

    # Change working directory to prevent lock
    Set-Location C:\Windows\Temp

    # Wait for processes to release locks
    Start-Sleep -Seconds 2

    # Remove ThinWatcher folder completely
    if (Test-Path "$env:ProgramFiles\ThinWatcher") {
        Remove-Item -Path "$env:ProgramFiles\ThinWatcher" -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Verify deletion and retry if necessary
    Start-Sleep -Seconds 1
    if (Test-Path "$env:ProgramFiles\ThinWatcher") {
        Remove-Item -Path "$env:ProgramFiles\ThinWatcher" -Recurse -Force
    }

    Write-Host "Uninstallation completed successfully." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "Uninstallation failed: $_" -ForegroundColor Red
    exit 1
}