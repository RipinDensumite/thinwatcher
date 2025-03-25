#!/bin/bash

OS_TYPE="Linux"
CLIENT_ID="THINCLIENT-01"
BACKEND_URL="https://twb.ripin.live/api/status"
TERMINATE_CHECK_URL="https://twb.ripin.live/api/terminate"
HEARTBEAT_INTERVAL=1

get_session_data() {
    # Get active sessions using who command
    who -u | while read -r user tty date time pid rest; do
        # Skip if no pid
        [ -z "$pid" ] && continue

        # Check if session is active
        state="Active"
        if w | grep -q "^$user.*no logout"; then
            state="Disconnected"
        fi

        # Add to sessions array
        echo "{\"ID\":\"$pid\",\"User\":\"$user\",\"State\":\"$state\"}"
    done | jq -s '.'
}

send_heartbeat() {
    sessions=$(get_session_data)
    active_users=$(echo "$sessions" | jq -r '.[] | select(.State=="Active") | .User')

    payload=$(jq -n \
        --arg cid "$CLIENT_ID" \
        --arg os "$OS_TYPE" \
        --argjson sessions "$sessions" \
        --argjson users "$(echo "$active_users" | jq -R . | jq -s .)" \
        '{clientId: $cid, os: $os, users: $users, sessions: $sessions}')

    if curl -s -H "Content-Type: application/json" -X POST -d "$payload" "$BACKEND_URL" >/dev/null; then
        return 0
    else
        return 1
    fi
}

check_termination() {
    response=$(curl -s "$TERMINATE_CHECK_URL/$CLIENT_ID")
    if [ $? -eq 0 ]; then
        action=$(echo "$response" | jq -r '.action')
        session_id=$(echo "$response" | jq -r '.sessionId')

        if [ "$action" = "logoff" ] && [ -n "$session_id" ]; then
            pkill -TERM -s "$session_id"
        fi
    else
        return 1
    fi
    return 0
}

# Check for required commands
for cmd in jq curl who w; do
    if ! command -v $cmd &>/dev/null; then
        echo "Error: Required command '$cmd' not found" >&2
        exit 1
    fi
done

clear
echo "ThinWatcher Agent Starting..."
sleep 1

# Main loop
while true; do
    send_heartbeat
    heartbeat_status=$?
    check_termination
    termination_status=$?

    if [ $heartbeat_status -eq 0 ] && [ $termination_status -eq 0 ]; then
        echo -ne "\r[$(date '+%Y-%m-%d %H:%M:%S')] Connection established: Successfully communicated with server     "
    else
        echo -ne "\r[$(date '+%Y-%m-%d %H:%M:%S')] Connection failed: Unable to communicate with server              "
    fi

    sleep $HEARTBEAT_INTERVAL
done
