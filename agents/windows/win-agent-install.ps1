#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"
$InstallDir = "$env:ProgramFiles\WinAgent"
$AgentScript = "win-agent.ps1"
$GuiDialog = "dialog-gui.ps1"
$ConfigFile = "$InstallDir\config.txt"
$GitHubRepoBaseUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

# Install PsExec if necessary
function Ensure-PsExec {
    $psExecPath = "$env:SystemRoot\System32\PsExec.exe"
    
    if (-not (Test-Path $psExecPath)) {
        
        $tempZip = "$env:TEMP\SysinternalsSuite.zip"
        $tempDir = "$env:TEMP\SysinternalsSuite"
        
        try {
            # Download Sysinternals Suite
            Invoke-WebRequest -Uri "https://download.sysinternals.com/files/SysinternalsSuite.zip" -OutFile $tempZip
            
            # Create temp directory
            if (-not (Test-Path $tempDir)) {
                New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
            }
            
            # Extract zip file
            Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
            
            # Copy PsExec to System32
            Copy-Item -Path "$tempDir\PsExec.exe" -Destination $psExecPath -Force
            
            # Clean up
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
            
            return $true
        }
        catch {
            return $false
        }
    }
    
    return $true
}

# Function to test backend connection
function Test-BackendConnection {
    param (
        [string]$url
    )
    try {
        Write-Host "Testing backend connection: $url" -ForegroundColor Cyan
        $response = Invoke-WebRequest -Uri "$url/api/ctest" -Method Get -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend connection successful." -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "Backend returned an unexpected status code: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Failed to connect to the backend: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check if thin client name is available
function Test-ThinClientName {
    param (
        [string]$url,
        [string]$clientId
    )
    try {
        Write-Host "Checking thin client name availability: $clientId" -ForegroundColor Cyan
        $response = Invoke-WebRequest -Uri "$url/api/check-client/$clientId" -Method Get -UseBasicParsing -ErrorAction Stop
        $responseData = $response.Content | ConvertFrom-Json

        if ($response.StatusCode -eq 200 -and $responseData.exists -eq $false) {
            Write-Host "Thin client name is available." -ForegroundColor Green
            return $true
        }
        elseif ($response.StatusCode -eq 200 -and $responseData.exists -eq $true) {
            Write-Host "Thin client name is already taken." -ForegroundColor Yellow
            return $false
        }
        else {
            Write-Host "Backend returned an unexpected status code: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Failed to check thin client name: $_" -ForegroundColor Red
        return $false
    }
}

try {
    # Create installation directory
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory | Out-Null
    }

    # Download necessary scripts from GitHub
    Write-Host "Downloading $AgentScript and $GuiDialog from GitHub..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "$GitHubRepoBaseUrl/$AgentScript" -OutFile "$InstallDir\$AgentScript"
    Invoke-WebRequest -Uri "$GitHubRepoBaseUrl/$GuiDialog" -OutFile "$InstallDir\$GuiDialog"

    # Config file
    Write-Host "Please provide the following configuration values or CTRL + C to cancel the installation" -ForegroundColor Cyan

    $BACKEND_URL = Read-Host "Backend URL (e.g., https://backend-url.com)"
    $HEARTBEAT_INTERVAL = Read-Host "Heartbeat Interval in seconds (e.g., 5)"
    $CLIENT_ID = Read-Host "Client ID (e.g., THINCLIENT-02)"

    # Validate Heartbeat Interval
    if (-not ($HEARTBEAT_INTERVAL -match '^\d+$')) {
        Write-Host "Heartbeat Interval must be a number. Exiting." -ForegroundColor Red
        exit 1
    }

    # Test backend connection
    if (-not (Test-BackendConnection -url $BACKEND_URL)) {
        Write-Host "Backend connection validation failed. Exiting." -ForegroundColor Red
        exit 1
    }

    # Check thin client name availability
    if (-not (Test-ThinClientName -url $BACKEND_URL -clientId $CLIENT_ID)) {
        Write-Host "Thin client name is already taken or unavailable. Exiting." -ForegroundColor Red
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

    if (-not (Ensure-PsExec)) {
        Write-Host "ERROR: Could not ensure PsExec is available. GUI functionality may not work."
    }

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