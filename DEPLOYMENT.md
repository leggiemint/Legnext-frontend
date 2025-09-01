# Legnext Midjourney API - Deployment Guide

This guide covers deploying the Legnext Midjourney API application to a VPS using GitHub Actions, PM2, and Caddy.

## 🏗️ Architecture

- **VPS**: Ubuntu 20.04+ server
- **Web Server**: Caddy (automatic HTTPS)
- **Process Manager**: PM2
- **Database**: PostgreSQL 15
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom monitoring scripts

## 📋 Prerequisites

1. **VPS Requirements**:
   - Ubuntu 20.04+ server
   - At least 2GB RAM
   - 20GB+ storage
   - Root or sudo access

2. **Domain Requirements**:
   - Domain name pointing to your VPS
   - DNS A record configured

3. **GitHub Repository**:
   - Repository with the codebase
   - GitHub Actions enabled

## 🚀 Initial VPS Setup

### Step 1: Run the Setup Script

SSH into your VPS and run the setup script:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/legnext-nextjs/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

This script will:
- Install Node.js 18, pnpm, PM2
- Install PostgreSQL and create database
- Install Caddy web server
- Create application user and directories
- Configure firewall
- Set up basic error pages

### Step 2: Configure Environment Variables

Create the production environment file:

```bash
sudo -u deploy cp /var/www/legnext/.env.production.template /var/www/legnext/.env.production
sudo -u deploy nano /var/www/legnext/.env.production
```

Fill in all required values:
- Database credentials
- NextAuth configuration
- Google OAuth credentials
- Payment gateway keys (Stripe or Square)
- Email service keys

### Step 3: Update Caddyfile

Update the domain in the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace `legnext.ai` with your actual domain name.

## ⚙️ GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | Your VPS IP address | `192.168.1.100` |
| `VPS_USER` | Deployment user | `deploy` |
| `VPS_PATH` | Application path | `/var/www/legnext` |
| `APP_NAME` | PM2 app name | `legnext-app` |
| `APP_URL` | Application URL | `https://legnext.ai` |
| `VPS_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

### Setting up SSH Key

Generate an SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@legnext.ai" -f ~/.ssh/github-actions
```

Add the public key to the VPS:

```bash
# On your VPS
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy bash -c 'cat >> /home/deploy/.ssh/authorized_keys' < your-public-key.pub
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Add the private key to GitHub secrets as `VPS_SSH_KEY`.

## 🔄 Deployment Process

The deployment process is automatic via GitHub Actions:

1. **Trigger**: Push to `main` branch
2. **Build**: Install dependencies, run tests, build application
3. **Package**: Create deployment package
4. **Deploy**: Copy to VPS and restart services
5. **Health Check**: Verify deployment success
6. **Notify**: Send status notifications

### Manual Deployment

If needed, you can deploy manually:

```bash
# On your local machine
npm run build
tar -czf deploy.tar.gz .next public package.json pnpm-lock.yaml prisma next.config.js tailwind.config.js ecosystem.config.js

# Copy to VPS
scp deploy.tar.gz deploy@your-vps:/tmp/

# On VPS
cd /var/www/legnext
tar -xzf /tmp/deploy.tar.gz
pnpm install --production
pnpm prisma generate
pnpm prisma migrate deploy
pm2 restart legnext-app
```

## 📊 Monitoring

### Health Check

The application includes a health check endpoint at `/api/health` that checks:
- Database connectivity
- Environment variables
- Memory usage
- Application uptime

### Automated Monitoring

Set up the monitoring script to run every 5 minutes:

```bash
# Add to crontab
sudo -u deploy crontab -e

# Add this line:
*/5 * * * * /var/www/legnext/scripts/monitor.sh
```

The monitoring script checks:
- Application status (PM2)
- Health endpoint response
- Database connectivity
- Disk space usage
- Memory usage
- SSL certificate expiry

### Log Management

Application logs are stored in:
- PM2 logs: `~/.pm2/logs/`
- Caddy logs: `/var/log/caddy/legnext.log`
- Monitor logs: `/var/log/legnext-monitor.log`

Rotate logs to prevent disk space issues:

```bash
# Add log rotation
sudo nano /etc/logrotate.d/legnext

# Content:
/var/log/caddy/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 caddy caddy
    postrotate
        systemctl reload caddy
    endscript
}

/var/log/legnext-monitor.log {
    weekly
    missingok
    rotate 12
    compress
    notifempty
}
```

## 🔧 Maintenance

### Database Backups

Create automated backups:

```bash
#!/bin/bash
# /var/www/legnext/scripts/backup-db.sh

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
pg_dump -h localhost -U legnext_user -d legnext_db > "$BACKUP_DIR/legnext_db_$DATE.sql"

# Keep only last 30 days
find "$BACKUP_DIR" -name "legnext_db_*.sql" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /var/www/legnext/scripts/backup-db.sh
```

### SSL Certificate Renewal

Caddy automatically renews SSL certificates, but you can check status:

```bash
sudo caddy list-certificates
```

### Application Updates

Updates are handled automatically via GitHub Actions, but for manual updates:

```bash
cd /var/www/legnext
git pull origin main
pnpm install
pnpm run build
pnpm prisma generate
pnpm prisma migrate deploy
pm2 restart legnext-app
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**:
   - Check environment variables: `sudo -u deploy cat /var/www/legnext/.env.production`
   - Check PM2 logs: `pm2 logs legnext-app`
   - Verify database connection: `pg_isready -h localhost -U legnext_user`

2. **502/503 errors**:
   - Check if application is running: `pm2 status`
   - Check Caddy logs: `sudo journalctl -u caddy`
   - Verify port 3000 is listening: `netstat -tlnp | grep :3000`

3. **Database connection issues**:
   - Check PostgreSQL status: `sudo systemctl status postgresql`
   - Verify database credentials in environment file
   - Check if user can connect: `psql -h localhost -U legnext_user -d legnext_db`

4. **SSL certificate issues**:
   - Check Caddy logs: `sudo journalctl -u caddy`
   - Verify DNS is pointing to correct IP: `dig legnext.ai`
   - Restart Caddy: `sudo systemctl restart caddy`

### Emergency Procedures

**Rollback to previous version**:
```bash
# Find backup
ls -la /var/backups/

# Restore backup
sudo cp -r /var/backups/legnext-app-YYYYMMDD-HHMMSS /var/www/legnext

# Restart application
cd /var/www/legnext
pm2 restart legnext-app
```

**Database restoration**:
```bash
# Restore from backup
psql -h localhost -U legnext_user -d legnext_db < /var/backups/postgresql/legnext_db_YYYYMMDD_HHMMSS.sql
```

## 📞 Support

For deployment issues:
1. Check application logs: `pm2 logs legnext-app`
2. Check system logs: `sudo journalctl -f`
3. Run health check manually: `curl https://legnext.ai/api/health`
4. Contact the development team with log outputs

## 📝 Notes

- Always test deployments in a staging environment first
- Keep backups of both database and application code
- Monitor resource usage and scale as needed
- Update dependencies regularly for security patches
- Review and rotate SSH keys and API tokens regularly