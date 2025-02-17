#!/bin/bash

SERVICE_NAME="linux-agent"
INSTALL_DIR="/usr/local/bin/thinwatcher"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Stop and disable service
systemctl stop $SERVICE_NAME
systemctl disable $SERVICE_NAME

# Remove service file
rm -f "/etc/systemd/system/$SERVICE_NAME.service"

# Kill any running instances
pkill -f "linux-agent.sh"

# Remove installation directory
rm -rf "$INSTALL_DIR"

# Reload systemd
systemctl daemon-reload

echo "Uninstallation completed successfully."
