#!/bin/bash
# Ship.Tires — Hetzner VPS Setup
# Run as root on the VPS: bash setup.sh
set -euo pipefail

APP_DIR="/opt/ship-tires"
DB_DIR="/opt/ship-tires-data"
DOMAIN="ship.tires"
PORT=3200

echo "=== Ship.Tires VPS Setup ==="
echo ""

# 1. Install Node.js 22 if not present
if ! command -v node &> /dev/null; then
    echo "[1/7] Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "[1/7] Node.js $(node -v) already installed"
fi

# 2. Install nginx + certbot if not present
echo "[2/7] Ensuring nginx and certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx sqlite3

# 3. Create directories
echo "[3/7] Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p "$DB_DIR/images/tires"
mkdir -p "$DB_DIR/images/logos"
mkdir -p "$DB_DIR/images/patterns"
mkdir -p "$DB_DIR/images/models"

# Symlink images into public dir for nginx direct serving
mkdir -p "$APP_DIR/public"
ln -sfn "$DB_DIR/images" "$APP_DIR/public/images"

# 4. Copy service file
echo "[4/7] Installing systemd service..."
cp "$(dirname "$0")/ship-tires.service" /etc/systemd/system/ship-tires.service
systemctl daemon-reload

# 5. Copy nginx config
echo "[5/7] Configuring nginx..."
cp "$(dirname "$0")/nginx-ship-tires.conf" /etc/nginx/sites-available/ship-tires
ln -sf /etc/nginx/sites-available/ship-tires /etc/nginx/sites-enabled/ship-tires

# Test nginx config
nginx -t

# 6. SSL certificate
echo "[6/7] Setting up SSL..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@ship.tires
else
    echo "  SSL certificate already exists"
fi

systemctl reload nginx

# 7. Create .env file template
echo "[7/7] Creating environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" << 'ENVEOF'
NODE_ENV=production
PORT=3200
TIRE_DB_PATH=/opt/ship-tires-data/ship_tires.db
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_LOGO_DEV_TOKEN=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
ADMIN_PASSWORD=
INDEXNOW_KEY=
ENVEOF
    echo "  Created $APP_DIR/.env — EDIT THIS with your real keys!"
else
    echo "  .env already exists, skipping"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/ship-tires/.env with your API keys"
echo "  2. Upload your built app:  rsync -avz .next/ package.json node_modules/ root@VPS:/opt/ship-tires/"
echo "  3. Upload the database:    rsync -avz ship_tires.db root@VPS:/opt/ship-tires-data/"
echo "  4. Start the service:      systemctl enable --now ship-tires"
echo "  5. Check status:           systemctl status ship-tires"
echo "  6. View logs:              journalctl -u ship-tires -f"
echo ""
echo "To sync images later, rsync them to: /opt/ship-tires-data/images/"
echo "Nginx serves /images/ directly — no Node.js overhead for static files."
