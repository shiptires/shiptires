#!/bin/bash
set -euo pipefail

# ============================================================
# Add a new distributor SFTP account
# Creates a chroot-jailed user that can only upload to /upload/
#
# Usage: bash add-distributor.sh <username> <password>
# Example: bash add-distributor.sh express-tire 'SecureP@ss123'
# ============================================================

if [ $# -lt 2 ]; then
    echo "Usage: $0 <username> <password>"
    echo "Example: $0 express-tire 'SecureP@ss123'"
    exit 1
fi

USERNAME="$1"
PASSWORD="$2"
SFTP_ROOT="/srv/sftp"
USER_HOME="$SFTP_ROOT/$USERNAME"

echo "=== Creating SFTP account: $USERNAME ==="

# 1. Create system user (no login shell, no home in /home)
if id "$USERNAME" &>/dev/null; then
    echo "   User $USERNAME already exists, updating..."
else
    useradd -g sftp-distributors -s /usr/sbin/nologin -d "$USER_HOME" -M "$USERNAME"
    echo "   User created"
fi

# Set password
echo "$USERNAME:$PASSWORD" | chpasswd
echo "   Password set"

# 2. Create chroot directory structure
# ChrootDirectory must be owned by root:root
mkdir -p "$USER_HOME/upload"
chown root:root "$USER_HOME"
chmod 755 "$USER_HOME"

# /upload is where they actually write files
chown "$USERNAME":sftp-distributors "$USER_HOME/upload"
chmod 775 "$USER_HOME/upload"

echo "   Directories created:"
echo "     $USER_HOME/ (chroot root, owned by root)"
echo "     $USER_HOME/upload/ (writable by $USERNAME)"

# 3. Create a README in the upload folder
cat > "$USER_HOME/upload/README.txt" <<EOF
Ship.Tires Inventory Upload
============================

Upload your inventory CSV file to this folder.
Files are processed automatically every 5 minutes.

CSV Requirements:
  - Header row with column names
  - Required columns: brand, size, cost (or price), quantity (or qty)
  - Optional columns: model, part_number (or sku), description
  - Warehouse columns are auto-detected (e.g., WH 001, DC 200, LOC 100)

After processing, files are moved to /processed/ or /failed/.
Contact support@ship.tires for questions.
EOF
chown "$USERNAME":sftp-distributors "$USER_HOME/upload/README.txt"

# 4. Create processed/failed directories
mkdir -p "$USER_HOME/upload/processed" "$USER_HOME/upload/failed"
chown "$USERNAME":sftp-distributors "$USER_HOME/upload/processed" "$USER_HOME/upload/failed"

echo ""
echo "=== SFTP Account Ready ==="
echo ""
echo "Connection details for $USERNAME:"
echo "  Host:     $(hostname -I | awk '{print $1}')"
echo "  Port:     22"
echo "  Username: $USERNAME"
echo "  Password: $PASSWORD"
echo "  Path:     /upload/"
echo ""
echo "Test connection:"
echo "  sftp $USERNAME@$(hostname -I | awk '{print $1}')"
echo "  > cd /upload"
echo "  > put inventory.csv"
echo ""
