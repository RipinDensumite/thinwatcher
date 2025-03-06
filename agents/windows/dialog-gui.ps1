try {
    Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;
    Add-Type -AssemblyName PresentationCore -ErrorAction Stop;
    Add-Type -AssemblyName WindowsBase -ErrorAction Stop;
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop;
} catch {
    Log-Error
}

$directoryPath = $PSScriptRoot
$configFile = "$directoryPath\config.txt"

function Read-Config {
    $config = @{}
    if (Test-Path $configFile) {
        Get-Content $configFile | Foreach-Object {
            if ($_ -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $config[$key] = $value
            }
        }
    }
    else {
        Write-Error "Configuration file not found: $configFile"
        exit 1
    }
    return $config
}

$config = Read-Config

# Assign configuration values to variables
$BACKEND_URL = $config["BACKEND_URL"]

# Validate required configuration
if (-not $BACKEND_URL) {
    Write-Error "Missing required configuration values. Please check config.txt"
    exit 1
}

# Output configuration values for verification
Write-Host "Configuration loaded:"
Write-Host "Backend URL: $BACKEND_URL"

# Set up logging
$logPath = Join-Path $PSScriptRoot "script_log.txt"

function Write-Log {
    param(
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

function Get-UserNames {
    try {
        Write-Log "Fetching user names from API"
        $apiUrl = "${BACKEND_URL}/api/clients/users"
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get
        $usernames = $response | ForEach-Object { $_.username }
        Write-Log "Successfully fetched user names: $($usernames -join ', ')"
        return $usernames
    }
    catch {
        Write-Log "ERROR: An exception occurred while fetching user names: $($_.Exception.Message)"
        Write-Log "Stack Trace: $($_.Exception.StackTrace)"
        return @()
    }
}

function Open-GUI {
    try {
        Write-Log "Starting to create GUI form"
        
        # Create a form
        $form = New-Object System.Windows.Forms.Form
        $form.Text = "Select a Name"
        $form.Size = New-Object System.Drawing.Size(300, 200)
        $form.StartPosition = "CenterScreen"
        Write-Log "Form object created successfully"

        # Create a label
        $label = New-Object System.Windows.Forms.Label
        $label.Text = "Select a name from the list:"
        $label.AutoSize = $true
        $label.Location = New-Object System.Drawing.Point(10, 20)
        $form.Controls.Add($label)
        Write-Log "Label added to form"

        # Create a combo box (dropdown list)
        $comboBox = New-Object System.Windows.Forms.ComboBox
        $comboBox.Location = New-Object System.Drawing.Point(10, 50)
        $comboBox.Size = New-Object System.Drawing.Size(260, 20)
        $comboBox.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList

        # Fetch user names from the API
        $usernames = Get-UserNames
        if ($usernames.Count -gt 0) {
            foreach ($username in $usernames) {
                $comboBox.Items.Add($username)
            }
            Write-Log "Combo box populated with user names"
        }
        else {
            Write-Log "No user names fetched from API"
        }
        $form.Controls.Add($comboBox)

        # Create a submit button
        $button = New-Object System.Windows.Forms.Button
        $button.Location = New-Object System.Drawing.Point(100, 100)
        $button.Size = New-Object System.Drawing.Size(75, 23)
        $button.Text = "Submit"
        $button.Add_Click({
                $selectedName = $comboBox.SelectedItem
                if ($selectedName) {
                    Write-Log "User selected name: $selectedName"
                    $form.Close()
                }
                else {
                    Write-Log "Error: No name selected"
                    [System.Windows.Forms.MessageBox]::Show("Please select a name.", "Error")
                }
            })
        $form.Controls.Add($button)
        Write-Log "Submit button added to form"

        # Show the form
        $form.Add_Shown({ $form.Activate() })
        Write-Log "Displaying GUI form"
        [void]$form.ShowDialog()

    }
    catch {
        Write-Log "ERROR: An exception occurred in Open-GUI function: $($_.Exception.Message)"
        Write-Log "Stack Trace: $($_.Exception.StackTrace)"
    }
}

# Main loop
try {
    $MAX_LOOP = 1
    $CURRENT_LOOP = 0
    Write-Log "Script started. Maximum loops: $MAX_LOOP"

    while ($CURRENT_LOOP -lt $MAX_LOOP) {
        Write-Log "Starting loop iteration $($CURRENT_LOOP + 1)"
        Open-GUI
        $CURRENT_LOOP++
        Write-Log "Completed loop iteration $CURRENT_LOOP"
    }
    Write-Log "Script completed successfully"
}
catch {
    Write-Log "ERROR: An exception occurred in main loop: $($_.Exception.Message)"
    Write-Log "Stack Trace: $($_.Exception.StackTrace)"
}