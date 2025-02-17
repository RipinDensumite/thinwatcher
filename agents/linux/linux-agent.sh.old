#!/bin/bash

OS_TYPE="Linux"
CLIENT_ID="THINCLIENT-01"
BACKEND_URL="http://167.71.207.105:3001/api/status"
TERMINATE_CHECK_URL="http://167.71.207.105:3001/api/terminate"
HEARTBEAT_INTERVAL=5

get_session_data() {
    # Initialize an empty JSON array for sessions
    local sessions="[]"

    # Get session data using who command with specific format
    while IFS=' ' read -r user tty date time pid; do
        # Skip empty lines
        [ -z "$user" ] && continue

        # Get session state (Active/Disconnected) based on idle time
        state="Active"
        if w | grep -q "^$user.*no logout"; then
            state="Disconnected"
        fi

        # Extract session ID (using PID as session ID)
        id="${pid//[!0-9]/}"

        # Append session to JSON array
        if [ ! -z "$id" ]; then
            sessions=$(echo $sessions | jq ". + [{\"ID\": \"$id\", \"User\": \"$user\", \"State\": \"$state\"}]")
        fi
    done < <(who -u)

    echo "$sessions"
}

send_heartbeat() {
    # Get session data
    local sessions=$(get_session_data)

    # Extract active users
    local active_users=$(echo "$sessions" | jq -r '.[] | select(.State=="Active") | .User')

    # Create JSON payload
    local payload=$(jq -n \
        --arg cid "$CLIENT_ID" \
        --arg os "$OS_TYPE" \
        --argjson sessions "$sessions" \
        --argjson users "$(echo "$active_users" | jq -R . | jq -s .)" \
        '{clientId: $cid, os: $os, users: $users, sessions: $sessions}')

    # Send request
    if ! curl -s -H "Content-Type: application/json" -X POST -d "$payload" "$BACKEND_URL"; then
        echo "Warning: Status update failed" >&2
    fi
}

check_termination() {
    # Check for termination commands
    local response
    if response=$(curl -s "$TERMINATE_CHECK_URL/$CLIENT_ID"); then
        local action=$(echo "$response" | jq -r '.action')
        local session_id=$(echo "$response" | jq -r '.sessionId')

        if [ "$action" = "logoff" ] && [ ! -z "$session_id" ]; then
            # Find the process ID associated with the session and terminate it
            kill -TERM "$session_id" 2>/dev/null ||
                echo "Warning: Could not terminate session $session_id" >&2
        fi
    else
        echo "Warning: Termination check failed" >&2
    fi
}

# Check for required commands
for cmd in jq curl who w; do
    if ! command -v $cmd &>/dev/null; then
        echo "Error: Required command '$cmd' not found. Please install it first." >&2
        exit 1
    fi
done

# Main loop
while true; do
    send_heartbeat
    check_termination
    sleep "$HEARTBEAT_INTERVAL"
done
