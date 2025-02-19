$OS_TYPE = "Windows"
$CLIENT_ID = "THINCLIENT-02"
$BACKEND_URL = "http://167.71.207.105:3001/api/status"
$TERMINATE_CHECK_URL = "http://167.71.207.105:3001/api/terminate"
$HEARTBEAT_INTERVAL = 5 # seconds

# Declare $isGUIOpen at the script level to maintain its state across function calls
$script:isGUIOpen = $false
Add-Type -AssemblyName System.Windows.Forms

function Get-SessionData {
    $raw = query session
    $sessionList = @()

    # State normalization mapping
    $stateMap = @{
        "Activ" = "Active"
        "Conn"  = "Connected"
        "Disc"  = "Disconnected"
        "Liste" = "Listen"
    }

    # Process header to find column positions
    $headerLine = $raw | Select-Object -First 1
    $columns = @()

    $columnOrder = @("SESSIONNAME", "USERNAME", "ID", "STATE")
    foreach ($col in $columnOrder) {
        $index = $headerLine.IndexOf($col)
        if ($index -ne -1) {
            $columns += @{
                Name  = $col
                Start = $index
                End   = $index + $col.Length
            }
        }
    }

    # Process session lines
    $raw | Select-Object -Skip 1 | ForEach-Object {
        $line = $_.PadRight(80)
        $session = [PSCustomObject]@{
            ID    = $null
            User  = "SYSTEM"
            State = $null
        }

        foreach ($col in $columns) {
            $value = $line.Substring($col.Start, $col.End - $col.Start).Trim()
            
            switch ($col.Name) {
                "USERNAME" { 
                    if ($value) { $session.User = $value } 
                }
                "ID" { 
                    $session.ID = $value 
                }
                "STATE" { 
                    if ($stateMap.ContainsKey($value)) {
                        $session.State = $stateMap[$value]
                    }
                    else {
                        $session.State = $value
                    }
                }
            }
        }

        if ($session.ID -match '^\d+$') {
            $sessionList += $session
        }
    }

    return $sessionList
}

function Run-GUI {
# Create a form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Select a Name"
$form.Size = New-Object System.Drawing.Size(300,200)
$form.StartPosition = "CenterScreen"

# Create a label
$label = New-Object System.Windows.Forms.Label
$label.Text = "Select a name from the list:"
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(10,20)
$form.Controls.Add($label)

# Create a combo box (dropdown list)
$comboBox = New-Object System.Windows.Forms.ComboBox
$comboBox.Location = New-Object System.Drawing.Point(10,50)
$comboBox.Size = New-Object System.Drawing.Size(260,20)
$comboBox.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList

# Add some example names to the combo box
$names = @("John Doe", "Jane Smith", "Alice Johnson", "Bob Brown")
foreach ($name in $names) {
    $comboBox.Items.Add($name)
}

$form.Controls.Add($comboBox)

# Create a submit button
$button = New-Object System.Windows.Forms.Button
$button.Location = New-Object System.Drawing.Point(100,100)
$button.Size = New-Object System.Drawing.Size(75,23)
$button.Text = "Submit"
$button.Add_Click({
    $selectedName = $comboBox.SelectedItem
    if ($selectedName) {
        Write-Host "Selected Name: $selectedName"
        $form.Close()
    } else {
        [System.Windows.Forms.MessageBox]::Show("Please select a name.", "Error")
    }
})

$form.Controls.Add($button)

# Show the form
$form.Add_Shown({$form.Activate()})
[void]$form.ShowDialog()
}

function Send-Heartbeat {
    try {
        $sessions = Get-SessionData
        $activeUsers = $sessions | 
        Where-Object { $_.State -eq "Active" } | 
        Select-Object -ExpandProperty User

        # Check if there are any active sessions
        if ($activeUsers.Count -gt 0) {
            if (-not $script:isGUIOpen) {
                Run-GUI
                $script:isGUIOpen = $true
            }
            Write-Output 1
        } else {
            $script:isGUIOpen = $false
            Write-Output 0
        }

        $body = @{
            clientId = $CLIENT_ID
            os       = $OS_TYPE
            users    = @($activeUsers)
            sessions = $sessions
        }

        Invoke-RestMethod -Uri $BACKEND_URL -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Depth 4)
    }
    catch {
        Write-Warning "Status update failed: $($_.Exception.Message)"
    }
}

function Check-Termination {
    try {
        $command = Invoke-RestMethod -Uri "$TERMINATE_CHECK_URL/$CLIENT_ID"
        if ($command.action -eq 'logoff') {
            & logoff $command.sessionId
        }
    }
    catch {
        Write-Warning "Termination check failed: $($_.Exception.Message)"
    }
}

# Main loop
while ($true) {
    Send-Heartbeat
    Check-Termination
    Start-Sleep -Seconds $HEARTBEAT_INTERVAL
}