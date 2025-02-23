# URLs for the scripts
$installScriptUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/win-agent-install.ps1"
$uninstallScriptUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/win-agent-uninstall.ps1"
# $reconfigScriptUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/win-agent-reconfig.ps1"

# Function to install the agent
function Install-Agent {
    Write-Host "Installing ThinWatcher..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri $installScriptUrl | Invoke-Expression
        Write-Host "Installation completed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Installation failed: $_" -ForegroundColor Red
    }
    Pause
}

# Function to uninstall the agent
function Uninstall-Agent {
    Write-Host "Uninstalling ThinWatcher..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri $uninstallScriptUrl | Invoke-Expression
        Write-Host "Uninstallation completed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Uninstallation failed: $_" -ForegroundColor Red
    }
    Pause
}

# Function to update the agent
function Update-Agent {
    Write-Host "Updating ThinWatcher..." -ForegroundColor Cyan
    try {
        Uninstall-Agent
        Install-Agent
        Write-Host "Update completed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Update failed: $_" -ForegroundColor Red
    }
    Pause
}

# Function to reconfigure the agent
# function Reconfig-Agent {
#     Write-Host "Reconfiguring ThinWatcher..." -ForegroundColor Cyan
#     try {
#         Invoke-RestMethod -Uri $reconfigScriptUrl | Invoke-Expression
#         Write-Host "Reconfiguration completed successfully." -ForegroundColor Green
#     }
#     catch {
#         Write-Host "Reconfiguration failed: $_" -ForegroundColor Red
#     }
#     Pause
# }

# Function to display the menu
function Show-Menu {
    Clear-Host
    Write-Host "============================================"
    Write-Host "ThinWatcher Agent Launcher"
    Write-Host "============================================"
    Write-Host "1. Install ThinWatcher Agent"
    # Write-Host "2. Reconfigure ThinWatcher Agent"
    Write-Host "2. Update ThinWatcher Agent"
    Write-Host "3. Uninstall ThinWatcher Agent"
    Write-Host "4. Exit"
    Write-Host "============================================"
}

# Function to pause the script and wait for user input
function Pause {
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main launcher logic
while ($true) {
    Show-Menu
    $choice = Read-Host "Please select an option (1-5)"

    switch ($choice) {
        1 { Install-Agent }
        # 2 { Reconfig-Agent }
        2 { Update-Agent }
        3 { Uninstall-Agent }
        4 { 
            Write-Host "Exiting ThinWatcher Launcher. Goodbye!" -ForegroundColor Yellow
            exit 
        }
        default {
            Write-Host "Invalid choice. Please select a valid option (1-5)." -ForegroundColor Red
            Pause
        }
    }
}