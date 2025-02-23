param (
    [string]$action = "install"
)

$installScriptUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/win-agent-install.ps1"
$uninstallScriptUrl = "https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/win-agent-uninstall.ps1"

function Install-Agent {
    Write-Host "Installing ThinWatcher..."
    Invoke-RestMethod -Uri $installScriptUrl | Invoke-Expression
}

function Uninstall-Agent {
    Write-Host "Uninstalling ThinWatcher..."
    Invoke-RestMethod -Uri $uninstallScriptUrl | Invoke-Expression
}

function Update-Agent {
    Write-Host "Updating ThinWatcher..."
    Uninstall-Agent
    Install-Agent
}

switch ($action.ToLower()) {
    "install" { Install-Agent }
    "uninstall" { Uninstall-Agent }
    "update" { Update-Agent }
    default { Write-Host "Invalid action. Use 'install', 'uninstall', or 'update'." }
}