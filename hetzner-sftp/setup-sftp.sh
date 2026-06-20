#!/bin/bash
set -euo pipefail

# ============================================================
# Ship.Tires — Distributor SFTP Server Setup
# Run as root on the Hetzner VPS (same server as hipaa-scanner)
# Creates chroot-jailed SFTP accounts for distributors to upload
# inventory CSV files. A watcher cron POSTs uploads to the API.
#
# Usage: bash setup-sftp.sh
# ============================================================

echo "=== Ship.Tires SFTP Server Setup ==="
echo "Started at $(date)"

SFTP_ROOT="/srv/sftp"
UPLOAD_DIR="/srv/sftp-uploads"
PROCESSOR="/opt/ship-tires-sftp/process-uploads.sh"

# ── 1. Create SFTP group ──
echo "[1/5] Creating sftp-distributors group..."
groupadd -f sftp-distributors

# ── 2. Create directory structure ──
echo "[2/5] Creating directory structure..."
mkdir -p "$SFTP_ROOT"
mkdir -p "$UPLOAD_DIR"
mkdir -p /opt/ship-tires-sftp
chmod 755 "$SFTP_ROOT"
chmod 700 "$UPLOAD_DIR"

# ── 3. Configure SSHD for chroot SFTP ──
echo "[3/5] Configuring SSH for chroot SFTP..."

# Check if our config block already exists
if ! grep -q "# Ship.Tires Distributor SFTP" /etc/ssh/sshd_config; then
    cat >> /etc/ssh/sshd_config <<'SSHD_CONF'

# Ship.Tires Distributor SFTP — chroot jailed uploads
Match Group sftp-distributors
    ChrootDirectory /srv/sftp/%u
    ForceCommand internal-sftp -u 0022
    AllowTcpForwarding no
    X11Forwarding no
    PasswordAuthentication yes
SSHD_CONF

    echo "   SSHD config updated"
    systemctl restart sshd
    echo "   SSHD restarted"
else
    echo "   SSHD config already present, skipping"
fi

# ── 4. Open SFTP port in UFW ──
echo "[4/5] Configuring firewall..."
ufw allow 22/tcp  # SSH/SFTP — should already be open

# ── 5. Install the upload processor ──
echo "[5/5] Installing upload processor..."
cp "$(dirname "$0")/process-uploads.sh" "$PROCESSOR" 2>/dev/null || true
chmod +x "$PROCESSOR" 2>/dev/null || true

# Add cron job to process uploads every 5 minutes
CRON_LINE="*/5 * * * * /opt/ship-tires-sftp/process-uploads.sh >> /var/log/ship-tires-sftp.log 2>&1"
if ! crontab -l 2>/dev/null | grep -q "process-uploads.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo "   Cron job added (every 5 minutes)"
else
    echo "   Cron job already exists"
fi

echo ""
echo "=== SFTP Server Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Create distributor accounts:  bash add-distributor.sh express-tire 'SecureP@ss123'"
echo "  2. Copy process-uploads.sh to $PROCESSOR"
echo "  3. Set API keys in /opt/ship-tires-sftp/.env"
echo "  4. Test: sftp express-tire@$(hostname -I | awk '{print $1}')"
echo ""
