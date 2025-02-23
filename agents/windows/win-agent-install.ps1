#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"
$InstallDir = "$env:ProgramFiles\WinAgent"
$AgentScript = "win-agent.ps1"
$GuiDialog = "dialog-gui.ps1"
$ConfigFile = "$InstallDir\config.txt"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

try {
    # Create installation directory
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory | Out-Null
    }

    #Config file
    Write-Host "Please provide the following configuration values or CTRL + C to cancel the installation" -ForegroundColor Cyan

    $BACKEND_URL = Read-Host "Backend URL (e.g., https://backend-url.com)"
    $HEARTBEAT_INTERVAL = Read-Host "Heartbeat Interval in seconds (e.g., 5)"
    $CLIENT_ID = Read-Host "Client ID (e.g., THINCLIENT-02)"

    # Validate Heartbeat Interval
    if (-not ($HEARTBEAT_INTERVAL -match '^\d+$')) {
        Write-Host "Heartbeat Interval must be a number. Exiting." -ForegroundColor Red
        exit 1
    }

    # Create config file
    $configContent = @"
BACKEND_URL=$BACKEND_URL
HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
CLIENT_ID=$CLIENT_ID
"@

    Set-Content -Path $ConfigFile -Value $configContent
    Write-Host "Configuration file created at $ConfigFile" -ForegroundColor Green

    # Copy agent script
    Copy-Item -Path $AgentScript -Destination $InstallDir -Force
    Copy-Item -Path $GuiDialog -Destination $InstallDir -Force

    # Create scheduled task
    $TaskAction = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$InstallDir\$AgentScript`""

    $TaskTrigger = New-ScheduledTaskTrigger -AtStartup
    $TaskSettings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)

    $TaskPrincipal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    Register-ScheduledTask `
        -TaskName $ServiceName `
        -Action $TaskAction `
        -Trigger $TaskTrigger `
        -Settings $TaskSettings `
        -Principal $TaskPrincipal | Out-Null

    # Start the task immediately without requiring reboot
    Start-ScheduledTask -TaskName $ServiceName

    Write-Host "Installation completed. Agent is now running and will persist through reboots." -ForegroundColor Green
}
catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    exit 1
}