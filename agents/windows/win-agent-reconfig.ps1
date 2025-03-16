# win-agent-reconfig.ps1
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WinAgent"
$InstallDir = "$env:ProgramFiles\ThinWatcher\scripts"
$ConfigFile = "$InstallDir\config.txt"

# Self-elevate if not running as admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
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
        [string]$clientId,
        [string]$currentClientId
    )
    
    # If the client ID hasn't changed, no need to check availability
    if ($clientId -eq $currentClientId) {
        Write-Host "Client ID unchanged, keeping existing ID: $clientId" -ForegroundColor Green
        return $true
    }
    
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
    # Check if agent is installed
    if (-not (Test-Path $ConfigFile)) {
        Write-Host "ThinWatcher agent is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
    
    # Read the current configuration
    $config = @{}
    Get-Content $ConfigFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $config[$key] = $value
        }
    }
    
    $currentBackendUrl = $config["BACKEND_URL"]
    $currentHeartbeatInterval = $config["HEARTBEAT_INTERVAL"]
    $currentClientId = $config["CLIENT_ID"]
    
    # Display current configuration
    Write-Host "Current Configuration:" -ForegroundColor Cyan
    Write-Host "Backend URL: $currentBackendUrl" -ForegroundColor White
    Write-Host "Heartbeat Interval: $currentHeartbeatInterval seconds" -ForegroundColor White
    Write-Host "Client ID: $currentClientId" -ForegroundColor White
    $currentEnableDialog = if ($config.ContainsKey("ENABLE_DIALOG")) { $config["ENABLE_DIALOG"] } else { "false" }
    Write-Host "Dialog Enabled: $currentEnableDialog" -ForegroundColor White
    Write-Host ""
    
    # Ask for new configuration
    Write-Host "Enter new configuration values (press Enter to keep current value):" -ForegroundColor Cyan
    $tempBackendUrl = Read-Host "Backend URL [$currentBackendUrl]"
    $tempHeartbeatInterval = Read-Host "Heartbeat Interval in seconds [$currentHeartbeatInterval]"
    $tempClientId = Read-Host "Client ID [$currentClientId]"
    $tempEnableDialog = Read-Host "Enable Dialog (true/false) [$currentEnableDialog]"
    
    # Use current values if no new values provided
    $BACKEND_URL = if ([string]::IsNullOrWhiteSpace($tempBackendUrl)) { $currentBackendUrl } else { $tempBackendUrl }
    $HEARTBEAT_INTERVAL = if ([string]::IsNullOrWhiteSpace($tempHeartbeatInterval)) { $currentHeartbeatInterval } else { $tempHeartbeatInterval }
    $CLIENT_ID = if ([string]::IsNullOrWhiteSpace($tempClientId)) { $currentClientId } else { $tempClientId }
    $ENABLE_DIALOG = if ([string]::IsNullOrWhiteSpace($tempEnableDialog)) { $currentEnableDialog } else { $tempEnableDialog }
    
    # Validate Heartbeat Interval
    if (-not ($HEARTBEAT_INTERVAL -match '^\d+$')) {
        Write-Host "Heartbeat Interval must be a number. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Validate Dialog Enabled
    if (-not ($ENABLE_DIALOG -match '^(true|false)$')) {
        Write-Host "Enable Dialog must be 'true' or 'false'. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Test backend connection if it was changed
    if ($BACKEND_URL -ne $currentBackendUrl) {
        if (-not (Test-BackendConnection -url $BACKEND_URL)) {
            Write-Host "Backend connection validation failed. Exiting." -ForegroundColor Red
            exit 1
        }
    }
    
    # Check thin client name availability if it was changed
    if ($CLIENT_ID -ne $currentClientId) {
        if (-not (Test-ThinClientName -url $BACKEND_URL -clientId $CLIENT_ID -currentClientId $currentClientId)) {
            Write-Host "Thin client name is already taken or unavailable. Exiting." -ForegroundColor Red
            exit 1
        }
        
        # If client ID changed, deregister the old one from the backend
        try {
            $url = "$currentBackendUrl/api/clients/$currentClientId"
            Invoke-RestMethod -Uri $url -Method Delete -ErrorAction SilentlyContinue
            Write-Host "Deregistered old client ID from backend: $currentClientId" -ForegroundColor Green
        } 
        catch {
            Write-Warning "Failed to deregister old client ID: $_"
        }
    }
    
    # Create new config file
    $configContent = @"
BACKEND_URL=$BACKEND_URL
HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
CLIENT_ID=$CLIENT_ID
ENABLE_DIALOG=$ENABLE_DIALOG
"@
    
    # Stop the service if it exists
    if (Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        Write-Host "Stopped the WinAgent scheduled task." -ForegroundColor Green
    }
    else {
        Write-Host "WinAgent scheduled task not found. Skipping stop operation." -ForegroundColor Yellow
    }
    
    # Update the config file
    Set-Content -Path $ConfigFile -Value $configContent
    Write-Host "Configuration updated at $ConfigFile" -ForegroundColor Green
    
    # Restart the service if it exists
    if (Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue) {
        Start-ScheduledTask -TaskName $ServiceName
        Write-Host "Restarted the WinAgent scheduled task with new configuration." -ForegroundColor Green
    }
    else {
        Write-Host "WinAgent scheduled task not found. You may need to reinstall the agent." -ForegroundColor Yellow
    }
    
    Write-Host "Reconfiguration completed successfully." -ForegroundColor Green
} 
catch {
    Write-Host "Reconfiguration failed: $_" -ForegroundColor Red
    exit 1
}