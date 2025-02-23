Add-Type -AssemblyName System.Windows.Forms

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

        # Add some example names to the combo box
        $names = @("John Doe", "Jane Smith", "Alice Johnson", "Bob Brown")
        foreach ($name in $names) {
            $comboBox.Items.Add($name)
        }
        $form.Controls.Add($comboBox)
        Write-Log "Combo box created and populated with names"

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