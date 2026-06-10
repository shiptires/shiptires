#!/bin/bash
# Ship.Tires — Deploy to Hetzner VPS
# Run from project root: bash deploy/deploy.sh
set -euo pipefail

VPS_HOST="178.156.206.66"
VPS_USER="root"
APP_DIR="/opt/ship-tires"
DATA_DIR="/opt/ship-tires-data"

echo "=== Deploying Ship.Tires to $VPS_HOST ==="

# 1. Build locally
echo "[1/4] Building production bundle..."
npm run build

# 2. Sync app files (excluding node_modules — install on server)
echo "[2/4] Syncing app files..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.env.local' \
    --exclude '.git' \
    --exclude 'deploy' \
    .next/ \
    package.json \
    package-lock.json \
    next.config.ts \
    public/ \
    src/ \
    "$VPS_USER@$VPS_HOST:$APP_DIR/"

# 3. Install dependencies on server and restart
echo "[3/4] Installing dependencies and restarting..."
ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && npm ci --production && systemctl restart ship-tires"

# 4. Verify
echo "[4/4] Checking status..."
ssh "$VPS_USER@$VPS_HOST" "systemctl status ship-tires --no-pager -l | head -20"

echo ""
echo "=== Deploy complete ==="
echo "Site: https://ship.tires"
