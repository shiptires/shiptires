#!/bin/bash
# ============================================================
# Ship.Tires — Process Distributor SFTP Uploads
# Runs via cron every 5 minutes. Scans all distributor upload
# folders, POSTs new CSV files to the API, then moves them.
#
# Config: /opt/ship-tires-sftp/.env
# Logs: /var/log/ship-tires-sftp.log
# ============================================================

SFTP_ROOT="/srv/sftp"
ENV_FILE="/opt/ship-tires-sftp/.env"
API_URL="https://ship.tires/api/feeds/inventory-upload"
LOCK_FILE="/tmp/ship-tires-sftp-process.lock"

# Prevent overlapping runs
if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE") ))
    if [ "$LOCK_AGE" -lt 600 ]; then
        exit 0  # Still processing, skip
    fi
    rm -f "$LOCK_FILE"  # Stale lock
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

# Load API keys from env file
# Format: DISTRIBUTOR_SLUG=api_key
# Example: express-tire=st_express-tire_abc123...
if [ ! -f "$ENV_FILE" ]; then
    echo "[$(date)] ERROR: $ENV_FILE not found"
    exit 1
fi
source "$ENV_FILE"

# Scan each distributor's upload folder
for USER_DIR in "$SFTP_ROOT"/*/; do
    USERNAME=$(basename "$USER_DIR")
    UPLOAD_DIR="$USER_DIR/upload"

    [ ! -d "$UPLOAD_DIR" ] && continue

    # Get API key for this distributor (slug = username)
    # Variable name: replace hyphens with underscores for bash compatibility
    VAR_NAME=$(echo "$USERNAME" | tr '-' '_')
    API_KEY="${!VAR_NAME:-}"

    if [ -z "$API_KEY" ]; then
        # Try exact slug match
        API_KEY=$(grep "^${USERNAME}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)
    fi

    if [ -z "$API_KEY" ]; then
        continue  # No API key configured for this distributor
    fi

    # Process CSV files (skip README, processed, failed dirs)
    for CSV_FILE in "$UPLOAD_DIR"/*.csv "$UPLOAD_DIR"/*.CSV; do
        [ ! -f "$CSV_FILE" ] && continue

        FILENAME=$(basename "$CSV_FILE")
        echo "[$(date)] Processing: $USERNAME/$FILENAME"

        # POST to API
        HTTP_CODE=$(curl -s -o /tmp/sftp-upload-response.json -w "%{http_code}" \
            -X POST "$API_URL" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: text/csv" \
            --data-binary "@$CSV_FILE" \
            --max-time 300)

        if [ "$HTTP_CODE" = "200" ]; then
            # Success — move to processed/
            TIMESTAMP=$(date +%Y%m%d_%H%M%S)
            mv "$CSV_FILE" "$UPLOAD_DIR/processed/${TIMESTAMP}_${FILENAME}"
            echo "[$(date)] SUCCESS: $USERNAME/$FILENAME (HTTP $HTTP_CODE)"

            # Log result summary
            if command -v jq &>/dev/null; then
                jq -r '"  matched=\(.matched) unmatched=\(.unmatched) zeroed=\(.zeroed) duration=\(.duration)ms"' /tmp/sftp-upload-response.json 2>/dev/null || true
            fi
        else
            # Failed — move to failed/
            TIMESTAMP=$(date +%Y%m%d_%H%M%S)
            mv "$CSV_FILE" "$UPLOAD_DIR/failed/${TIMESTAMP}_${FILENAME}"
            echo "[$(date)] FAILED: $USERNAME/$FILENAME (HTTP $HTTP_CODE)"
            cat /tmp/sftp-upload-response.json 2>/dev/null || true
        fi

        rm -f /tmp/sftp-upload-response.json
    done

    # Clean up old processed files (keep last 30 days)
    find "$UPLOAD_DIR/processed" -name "*.csv" -mtime +30 -delete 2>/dev/null || true
    find "$UPLOAD_DIR/processed" -name "*.CSV" -mtime +30 -delete 2>/dev/null || true
    find "$UPLOAD_DIR/failed" -name "*.csv" -mtime +30 -delete 2>/dev/null || true
    find "$UPLOAD_DIR/failed" -name "*.CSV" -mtime +30 -delete 2>/dev/null || true
done
