#!/bin/bash

SERVICE_NAME="linux-agent"
INSTALL_DIR="/usr/local/bin/thinwatcher"
AGENT_SCRIPT="linux-agent.sh"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy agent script
cp "$AGENT_SCRIPT" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/$AGENT_SCRIPT"

# Create systemd service file
cat > "/etc/systemd/system/$SERVICE_NAME.service" <<EOL
[Unit]
Description=Thin Client Watcher Agent
After=network.target

[Service]
ExecStart=$INSTALL_DIR/$AGENT_SCRIPT
Restart=always
RestartSec=60
User=root

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd, enable and start service
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

echo "Installation completed. Agent is now running and will persist through reboots."
