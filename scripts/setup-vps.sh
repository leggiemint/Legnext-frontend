#!/bin/bash

# VPS Setup Script for Legnext Midjourney API
# This script sets up the VPS environment for the first time

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="legnext-app"
APP_PATH="/var/www/legnext"
APP_USER="deploy"
DOMAIN="legnext.ai"

echo -e "${GREEN}🚀 Setting up VPS for Legnext Midjourney API...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18
echo -e "${YELLOW}📦 Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
echo -e "${YELLOW}📦 Installing pnpm...${NC}"
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
export PATH="$HOME/.local/share/pnpm:$PATH"

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
npm install -g pm2

# Setup PM2 startup
pm2 startup
echo -e "${YELLOW}⚠️  Please run the PM2 startup command shown above if prompted${NC}"

# Install PostgreSQL
echo -e "${YELLOW}🗄️  Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
sudo -u postgres psql << EOF
CREATE USER legnext_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE legnext_db OWNER legnext_user;
GRANT ALL PRIVILEGES ON DATABASE legnext_db TO legnext_user;
\q
EOF

# Install Caddy
echo -e "${YELLOW}🌐 Installing Caddy...${NC}"
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo apt update
sudo apt install -y caddy

# Create app user
echo -e "${YELLOW}👤 Creating application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash "$APP_USER"
    sudo usermod -aG sudo "$APP_USER"
fi

# Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p "$APP_PATH"
sudo chown -R "$APP_USER:$APP_USER" "$APP_PATH"

# Create logs directory
sudo mkdir -p /var/log/caddy
sudo chown -R caddy:caddy /var/log/caddy

# Create error pages directory
sudo mkdir -p /var/www/error-pages/errors
sudo chown -R "$APP_USER:$APP_USER" /var/www/error-pages

# Create basic error pages
cat > /tmp/502.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Service Temporarily Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #4f46e5; }
    </style>
</head>
<body>
    <h1>Service Temporarily Unavailable</h1>
    <p>We're performing maintenance. Please try again in a few minutes.</p>
</body>
</html>
EOF

cat > /tmp/503.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #4f46e5; }
    </style>
</head>
<body>
    <h1>Service Unavailable</h1>
    <p>The service is temporarily unavailable. Please try again later.</p>
</body>
</html>
EOF

sudo mv /tmp/502.html /var/www/error-pages/errors/
sudo mv /tmp/503.html /var/www/error-pages/errors/
sudo chown -R "$APP_USER:$APP_USER" /var/www/error-pages

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Enable services
echo -e "${YELLOW}🔧 Enabling services...${NC}"
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl enable postgresql

# Create backup directory
sudo mkdir -p /var/backups
sudo chown -R "$APP_USER:$APP_USER" /var/backups

echo -e "${GREEN}✅ VPS setup completed!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update the database password in your environment variables"
echo "2. Configure your GitHub secrets:"
echo "   - VPS_HOST: your-server-ip"
echo "   - VPS_USER: $APP_USER"
echo "   - VPS_PATH: $APP_PATH"
echo "   - APP_NAME: $APP_NAME"
echo "   - APP_URL: https://$DOMAIN"
echo "3. Add your SSH public key to $APP_USER's authorized_keys"
echo "4. Update the Caddyfile with your actual domain"
echo "5. Set up your environment variables on the server"
echo ""
echo -e "${GREEN}🎉 Your VPS is ready for deployment!${NC}"