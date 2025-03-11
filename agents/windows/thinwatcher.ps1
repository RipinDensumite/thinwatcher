# ThinWatcher Installation Script
# This script installs the ThinWatcher agent and creates a global command

# Ensure running as administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator" -ForegroundColor Red
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

$ErrorActionPreference = "Stop"

# Configuration
$InstallDir = "$env:ProgramFiles\ThinWatcher"
$BinDir = "$InstallDir\bin"
$ScriptsDir = "$InstallDir\scripts"
$LauncherScript = "$BinDir\thinwatcher.ps1"
$GitHubRepoBaseUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows"
$Version = "0.0.0"
$LauncherScriptPath = "$env:TEMP\thinwatcher-launcher.ps1"

# Required scripts to download
$RequiredScripts = @(
    "win-agent.ps1",
    "dialog-gui.ps1",
    "win-agent-install.ps1",
    "win-agent-uninstall.ps1",
    "win-agent-reconfig.ps1"
)

function Write-Status {
    param (
        [string]$Message,
        [string]$Type = "Info" # Info, Success, Warning, Error
    )
    
    $color = switch ($Type) {
        "Info" { "Cyan" }
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Clean up function
function Clear-ErrorInstallation {
    $ServiceName = "WinAgent"
    
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

        Write-Host "Clean up completed successfully." -ForegroundColor Green
        exit 0
    }
    catch {
        Write-Host "Clean up failed: $_" -ForegroundColor Red
        exit 1
    }
}

function New-ThinWatcherLauncher {
    # Create the launcher script content with fixed string formatting
    $launcherContent = @'
#!/usr/bin/env pwsh
param (
    [Parameter(Position = 0)]
    [string]$Command = "menu",
    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = "Stop"
$ScriptsDir = "SCRIPTS_DIR_PLACEHOLDER"
$InstallDir = "INSTALL_DIR_PLACEHOLDER"
$Version = "VERSION_PLACEHOLDER"

function Show-Header {
    $headerWidth = 60
    Write-Host ("=" * $headerWidth) -ForegroundColor Blue
    Write-Host "ThinWatcher Agent Manager v$Version" -ForegroundColor Cyan
    Write-Host ("=" * $headerWidth) -ForegroundColor Blue
}

function Show-Menu {
    Show-Header
    
    # Get WinAgent status
    $isWinAgentExist = Test-WinAgentInstallation
    $isWinAgentRunning = Test-ScheduledTask
    
    # Write-Host "Status: $isWinAgentExist | $isWinAgentRunning" -ForegroundColor Yellow
    Write-Host "Status: $isWinAgentRunning" -ForegroundColor Yellow
    Write-Host
    Write-Host "Available Commands:" -ForegroundColor White
    Write-Host "  1. install    - Install ThinWatcher Agent"
    # Write-Host "  2. update     - Update ThinWatcher Agent"
    Write-Host "  2. uninstall  - Uninstall ThinWatcher"
    Write-Host "  3. reconfig   - Reconfigure ThinWatcher Agent"
    Write-Host "  4. start      - Start ThinWatcher Agent"
    Write-Host "  5. stop       - Stop ThinWatcher Agent"
    #Write-Host "  6. version    - Show ThinWatcher version"
    Write-Host "  6. exit       - Exit"
    Write-Host
    
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" { Install-Agent }
        # "2" { Update-Agent }
        "2" { Uninstall-Agent }
        "3" { Reconfig-Agent }
        "4" { Start-Agent }
        "5" { Stop-Agent }
        #"6" { Show-Version }
        "6" { return }
        default {
            Write-Host "Invalid choice. Please select a valid option (1-7)." -ForegroundColor Red
            Pause
            Show-Menu
        }
    }
}

function Test-WinAgentInstallation {
    # Check if the win-agent.ps1 script exists in the scripts directory
    if (Test-Path "$ScriptsDir\win-agent.ps1") {
        return "Installed"
    }
    else {
        return "Not Installed"
    }
}

function Test-ScheduledTask {
    $task = Get-ScheduledTask -TaskName "WinAgent" -ErrorAction SilentlyContinue
    
    if ($task) {
        $taskState = $task.State
        if ($taskState -eq "Running") {
            return "Running"
        }
        else {
            return "Stopped"
        }
    }
    else {
        return "Not Configured"
    }
}

function Install-Agent {
    Show-Header
    Write-Host "Installing ThinWatcher Agent..." -ForegroundColor Cyan
    
    try {
        if ([bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match "S-1-5-32-544")) {
            & "$ScriptsDir\win-agent-install.ps1"
        }
        else {
            Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptsDir\win-agent-install.ps1`"" -Verb RunAs -Wait
        }
        Write-Host "Installation process completed." -ForegroundColor Green
    }
    catch {
        Write-Host "Installation failed: $_" -ForegroundColor Red
    }
    
    Pause
    Show-Menu
}

# function Update-Agent {
#     Show-Header
#     Write-Host "Updating ThinWatcher Agent..." -ForegroundColor Cyan
    
#     try {
#         if (Test-WinAgentInstallation -eq "Not Installed") {
#             Write-Host "Agent not installed. Please install it first." -ForegroundColor Yellow
#             Pause
#             Show-Menu
#             return
#         }
        
#         # Uninstall and reinstall
#         Uninstall-Agent -noMenu
#         Install-Agent
#     }
#     catch {
#         Write-Host "Update failed: $_" -ForegroundColor Red
#     }
    
#     if (-not $noMenu) {
#         Pause
#         Show-Menu
#     }
# }

function Uninstall-Agent {
    param([switch]$noMenu)
    
    if (-not $noMenu) { Show-Header }
    Write-Host "Uninstalling ThinWatcher Agent..." -ForegroundColor Cyan
    
    try {
        if ([bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match "S-1-5-32-544")) {
            & "$ScriptsDir\win-agent-uninstall.ps1"
        }
        else {
            Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptsDir\win-agent-uninstall.ps1`"" -Verb RunAs -Wait
        }
        Write-Host "Uninstallation completed." -ForegroundColor Green
        exit 0
    }
    catch {
        Write-Host "Uninstallation failed: $_" -ForegroundColor Red
    }
    
    if (-not $noMenu) {
        Pause
        Show-Menu
    }
}

function Reconfig-Agent {
    Show-Header
    Write-Host "Reconfiguring ThinWatcher Agent..." -ForegroundColor Cyan
    
    try {
        if (Test-WinAgentInstallation -eq "Not Installed") {
            Write-Host "Agent not installed. Please install it first." -ForegroundColor Yellow
            Pause
            Show-Menu
            return
        }
        
        if ([bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match "S-1-5-32-544")) {
            & "$ScriptsDir\win-agent-reconfig.ps1"
        }
        else {
            Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptsDir\win-agent-reconfig.ps1`"" -Verb RunAs -Wait
        }
        Write-Host "Reconfiguration completed." -ForegroundColor Green
    }
    catch {
        Write-Host "Reconfiguration failed: $_" -ForegroundColor Red
    }
    
    Pause
    Show-Menu
}

function Start-Agent {
    Show-Header
    Write-Host "Starting ThinWatcher Agent..." -ForegroundColor Cyan
    
    try {
        # Check if the agent is installed
        $installationStatus = Test-WinAgentInstallation
        if ($installationStatus -eq "Not Installed") {
            Write-Host "Agent not installed. Please install it first." -ForegroundColor Yellow
            Pause
            Show-Menu
            return
        }
        
        # Check if the scheduled task exists
        $task = Get-ScheduledTask -TaskName "WinAgent" -ErrorAction SilentlyContinue
        if ($task) {
            Start-ScheduledTask -TaskName "WinAgent"
            Write-Host "Agent started successfully." -ForegroundColor Green
        }
        else {
            Write-Host "WinAgent task not found. Please reinstall the agent." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Failed to start agent: $_" -ForegroundColor Red
    }
    
    Pause
    Show-Menu
}

function Stop-Agent {
    Show-Header
    Write-Host "Stopping ThinWatcher Agent..." -ForegroundColor Cyan
    
    try {
        $task = Get-ScheduledTask -TaskName "WinAgent" -ErrorAction SilentlyContinue
        if ($task) {
            Stop-ScheduledTask -TaskName "WinAgent"
            Write-Host "Agent stopped successfully." -ForegroundColor Green
        }
        else {
            Write-Host "WinAgent task not found." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Failed to stop agent: $_" -ForegroundColor Red
    }
    
    Pause
    Show-Menu
}

function Show-Version {
    Show-Header
    Write-Host "ThinWatcher Agent Manager v$Version" -ForegroundColor Cyan
    Write-Host "Installation Directory: $InstallDir" -ForegroundColor White
    
    # Check agent version by checking its files' dates
    if (Test-Path "$ScriptsDir\win-agent.ps1") {
        $fileInfo = Get-Item "$ScriptsDir\win-agent.ps1"
        $lastModified = $fileInfo.LastWriteTime
        Write-Host "Agent Last Updated: $lastModified" -ForegroundColor White
    }
    
    Pause
    Show-Menu
}

function Pause {
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Process commands
switch ($Command.ToLower()) {
    "menu" { Show-Menu }
    "install" { Install-Agent }
    # "update" { Update-Agent }
    "uninstall" { Uninstall-Agent }
    "reconfig" { Reconfig-Agent }
    "start" { Start-Agent }
    "stop" { Stop-Agent }
    "version" { Show-Version }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Available commands: menu, install, update, uninstall, reconfig, start, stop, version" -ForegroundColor Yellow
    }
}
'@

    # Replace placeholders with actual values
    $launcherContent = $launcherContent.Replace("SCRIPTS_DIR_PLACEHOLDER", $ScriptsDir)
    $launcherContent = $launcherContent.Replace("INSTALL_DIR_PLACEHOLDER", $InstallDir)
    $launcherContent = $launcherContent.Replace("VERSION_PLACEHOLDER", $Version)
    
    Set-Content -Path $LauncherScriptPath -Value $launcherContent
}

function New-PowerShellModule {
    # Create the module to expose the ThinWatcher command
    $modulesPath = "$env:ProgramFiles\WindowsPowerShell\Modules\ThinWatcher"
    $modulePath = "$modulesPath\ThinWatcher.psm1"
    $manifestPath = "$modulesPath\ThinWatcher.psd1"
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $modulesPath)) {
        New-Item -Path $modulesPath -ItemType Directory -Force | Out-Null
    }
    
    # Create the module file - FIXED to call the CMD file instead of PS1 directly
    $moduleContent = @"
function Invoke-ThinWatcher {
    param(
        [Parameter(Position = 0, ValueFromRemainingArguments = `$true)]
        [string[]]`$Arguments
    )
    
    # Call the CMD file instead of PS1 directly
    & "$BinDir\thinwatcher.cmd" @Arguments
}

New-Alias -Name thinwatcher -Value Invoke-ThinWatcher -Force -Scope Global

Export-ModuleMember -Function Invoke-ThinWatcher -Alias thinwatcher
"@
    
    Set-Content -Path $modulePath -Value $moduleContent
    
    # Create the module manifest
    New-ModuleManifest -Path $manifestPath `
        -ModuleVersion $Version `
        -Author "ThinWatcher" `
        -CompanyName "ThinWatcher" `
        -Description "ThinWatcher Agent Manager" `
        -PowerShellVersion "5.1" `
        -RootModule "ThinWatcher.psm1" `
        -FunctionsToExport @('Invoke-ThinWatcher') `
        -AliasesToExport @('thinwatcher')
}

function New-ShortcutFile {
    # Create a .cmd file in the bin directory for direct invocation
    $cmdFile = "$BinDir\thinwatcher.cmd"
    
    $cmdContent = @"
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$LauncherScript" %*
"@
    
    Set-Content -Path $cmdFile -Value $cmdContent
}

function Add-ToPath {
    $binPath = $BinDir
    $envPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    
    if ($envPath -notlike "*$binPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$envPath;$binPath", "Machine")
        Write-Status "Added ThinWatcher to system PATH" -Type "Success"
    }
}

# Main installation process
try {
    Write-Status "Starting ThinWatcher installation..." -Type "Info"
    
    # Create directories
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
    }
    
    if (-not (Test-Path $BinDir)) {
        New-Item -Path $BinDir -ItemType Directory -Force | Out-Null
    }
    
    if (-not (Test-Path $ScriptsDir)) {
        New-Item -Path $ScriptsDir -ItemType Directory -Force | Out-Null
    }
    
    # Create the launcher script
    Write-Status "Creating launcher script..." -Type "Info"
    New-ThinWatcherLauncher
    
    # Copy the launcher to the bin directory
    Copy-Item -Path $LauncherScriptPath -Destination $LauncherScript -Force
    
    # Download required scripts
    Write-Status "Downloading required scripts..." -Type "Info"
    foreach ($script in $RequiredScripts) {
        Write-Status "Downloading $script..." -Type "Info"
        $scriptUrl = "$GitHubRepoBaseUrl/$script"
        $scriptPath = "$ScriptsDir\$script"
        
        try {
            Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath -ErrorAction Stop
            Write-Status "Downloaded $script successfully" -Type "Success"
        }
        catch {
            Write-Status "Failed to download $script : $_" -Type "Error"
            throw "Download failed for $script"
        }
    }
    
    # Create PowerShell module for system-wide access
    Write-Status "Creating PowerShell module..." -Type "Info"
    New-PowerShellModule
    
    # Create CMD shortcut
    Write-Status "Creating command shortcut..." -Type "Info"
    New-ShortcutFile
    
    # Add to PATH
    Write-Status "Adding ThinWatcher to system PATH..." -Type "Info"
    Add-ToPath
    
    # Clean up
    Remove-Item -Path $LauncherScriptPath -Force -ErrorAction SilentlyContinue
    
    Write-Status "ThinWatcher has been installed successfully!" -Type "Success"
    Write-Status "You can now run 'thinwatcher' from any PowerShell or Command Prompt window." -Type "Success"
    
    # Offer to launch ThinWatcher now
    $launch = Read-Host "Would you like to launch ThinWatcher now? (y/n)"
    if ($launch -eq 'y') {
        # Launch with execution policy bypass
        powershell.exe -ExecutionPolicy Bypass -File $LauncherScript
    }
}
catch {
    Clear-ErrorInstallation

    Write-Status "Installation failed: $_" -Type "Error"
    exit 1
}