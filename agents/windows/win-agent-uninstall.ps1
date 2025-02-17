#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"
$InstallDir = "$env:ProgramFiles\WinAgent"

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

    Write-Host "Uninstallation completed successfully." -ForegroundColor Green
}
catch {
    Write-Host "Uninstallation failed: $_" -ForegroundColor Red
    exit 1
}