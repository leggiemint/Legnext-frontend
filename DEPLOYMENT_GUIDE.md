# Legnext.ai 完整部署指南

本指南将带您完成Legnext Midjourney API应用的完整部署流程，包括VPS设置、Cloudflare配置、GitHub Actions CI/CD等。

## 📋 部署概览

**架构组件:**
- **VPS**: Ubuntu 20.04+ 服务器
- **Web服务器**: Caddy (自动HTTPS)
- **进程管理**: PM2
- **数据库**: PostgreSQL 15
- **CI/CD**: GitHub Actions
- **DNS/CDN**: Cloudflare
- **域名**: legnext.ai

## 🚀 第一步：VPS准备

### 1.1 VPS要求
- Ubuntu 20.04+ 服务器
- 最少2GB RAM
- 20GB+ 存储空间
- Root或sudo权限

### 1.2 初始服务器设置

SSH连接到您的VPS并执行以下命令：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 创建部署用户
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy

# 设置防火墙
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🌐 第二步：Cloudflare配置

### 2.1 添加域名到Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击 "Add a Site"
3. 输入域名 `legnext.ai`
4. 选择计划（Free计划即可）
5. Cloudflare将扫描现有DNS记录

### 2.2 更新域名服务器

1. 在域名注册商处，将域名服务器更改为Cloudflare提供的NS记录：
   ```
   名称服务器1: xxx.ns.cloudflare.com
   名称服务器2: xxx.ns.cloudflare.com
   ```
2. 等待DNS传播（通常需要24-48小时）

### 2.3 配置DNS记录

在Cloudflare DNS设置中添加以下记录：

| 类型 | 名称 | 内容 | 代理状态 | TTL |
|------|------|------|----------|-----|
| A | legnext.ai | YOUR_VPS_IP | 🟠 代理 | 自动 |
| A | www | YOUR_VPS_IP | 🟠 代理 | 自动 |

**重要**: 启用代理状态以获得Cloudflare的CDN和DDoS保护。

### 2.4 SSL/TLS设置

1. 进入 **SSL/TLS** > **概述**
2. 设置加密模式为 **Full (strict)**
3. 进入 **边缘证书**
4. 确保启用：
   - 始终使用HTTPS: ✅ 开启
   - HTTP严格传输安全(HSTS): ✅ 开启
   - 最小TLS版本: 1.2
   - 机会性加密: ✅ 开启
   - TLS 1.3: ✅ 开启

### 2.5 性能优化

1. **速度** > **优化**
   - Auto Minify: ✅ JavaScript, CSS, HTML
   - Brotli: ✅ 开启
   - Early Hints: ✅ 开启

2. **缓存** > **配置**
   - 缓存级别: Standard
   - 浏览器缓存TTL: 4小时

### 2.6 安全设置

1. **安全性** > **WAF**
   - 启用托管规则集
   - OWASP核心规则集: ✅ 开启

2. **安全性** > **设置**
   - Security Level: Medium
   - Challenge Passage: 30分钟
   - Browser Integrity Check: ✅ 开启

## 🔧 第三步：VPS环境设置

### 3.1 自动设置脚本

从GitHub下载并运行设置脚本：

```bash
# 切换到部署用户
sudo su - deploy

# 下载设置脚本
wget https://raw.githubusercontent.com/yourusername/legnext-nextjs/main/scripts/setup-vps.sh

# 给予执行权限并运行
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

这个脚本会自动安装：
- Node.js 18 LTS
- pnpm 包管理器
- PM2 进程管理器
- PostgreSQL 15
- Caddy web服务器
- 创建应用目录和用户权限

### 3.2 手动验证安装

```bash
# 检查Node.js版本
node --version  # 应该显示 v18.x.x

# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查Caddy状态
sudo systemctl status caddy

# 检查防火墙状态
sudo ufw status
```

## 🗄️ 第四步：数据库配置

### 4.1 创建数据库和用户

```bash
sudo -u postgres psql
```

在PostgreSQL命令行中执行：

```sql
-- 创建数据库用户
CREATE USER legnext_user WITH PASSWORD 'your_secure_password_here';

-- 创建数据库
CREATE DATABASE legnext_db OWNER legnext_user;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE legnext_db TO legnext_user;

-- 退出PostgreSQL
\q
```

### 4.2 测试数据库连接

```bash
psql -h localhost -U legnext_user -d legnext_db
```

## ⚙️ 第五步：GitHub配置

### 5.1 设置SSH密钥

在本地机器生成SSH密钥对：

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@legnext.ai" -f ~/.ssh/github-actions
```

将公钥添加到VPS：

```bash
# 在VPS上执行
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy bash -c 'cat >> /home/deploy/.ssh/authorized_keys' << 'EOF'
# 粘贴您的github-actions.pub内容到这里
EOF

sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 5.2 配置GitHub Secrets

在GitHub仓库设置中添加以下Secrets：

| Secret名称 | 值 | 说明 |
|-----------|---|------|
| `VPS_HOST` | YOUR_VPS_IP | VPS IP地址 |
| `VPS_USER` | deploy | 部署用户名 |
| `VPS_PATH` | /var/www/legnext | 应用路径 |
| `APP_NAME` | legnext-app | PM2应用名称 |
| `APP_URL` | https://legnext.ai | 应用URL |
| `VPS_SSH_KEY` | 私钥内容 | github-actions私钥 |

**可选Secrets (通知配置):**
- `DISCORD_WEBHOOK_URL`: Discord通知webhook
- `FEISHU_WEBHOOK_URL`: 飞书/Lark通知webhook (推荐)
- `SLACK_WEBHOOK_URL`: Slack通知webhook (已弃用)

## 🔐 第六步：环境变量配置

### 6.1 创建生产环境配置

```bash
sudo -u deploy cp /var/www/legnext/.env.production.template /var/www/legnext/.env.production
sudo -u deploy nano /var/www/legnext/.env.production
```

### 6.2 必需的环境变量

```bash
# 数据库配置
DATABASE_URL="postgresql://legnext_user:your_secure_password_here@localhost:5432/legnext_db"
DIRECT_URL="postgresql://legnext_user:your_secure_password_here@localhost:5432/legnext_db"

# NextAuth配置
NEXTAUTH_URL="https://legnext.ai"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-min-32-chars"

# Google OAuth (必需用于认证)
GOOGLE_ID="your-google-oauth-client-id"
GOOGLE_SECRET="your-google-oauth-client-secret"

# 支付网关配置
PAYMENT_GATEWAY="stripe"  # 或 "square"

# Stripe配置 (如果使用Stripe)
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_FREE_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."

# 邮件服务
RESEND_API_KEY="re_..."

# 应用配置
NODE_ENV="production"
SITE_URL="https://legnext.ai"
DOMAIN_NAME="legnext.ai"
```

### 6.3 获取Google OAuth凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建OAuth 2.0客户端ID
5. 添加授权重定向URI:
   - `https://legnext.ai/api/auth/callback/google`
6. 复制客户端ID和客户端密钥到环境变量

### 6.4 Stripe配置 (如果使用)

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 获取API密钥（开发者 > API密钥）
3. 创建产品和价格：
   - 免费计划：100 API调用
   - Pro计划：5000 API调用/月，$29/月
4. 设置Webhook端点：`https://legnext.ai/api/webhooks/stripe`

### 6.5 飞书通知配置 (可选但推荐)

飞书webhook用于接收部署状态和系统监控通知。

#### 创建飞书机器人

1. 登录飞书开放平台或在飞书群聊中添加机器人：
   - **方法一 (群聊机器人)**：
     - 在飞书群聊中，点击右上角设置
     - 选择"群机器人" > "添加机器人"
     - 选择"自定义机器人"
     - 设置机器人名称和描述
     - 复制生成的Webhook URL

   - **方法二 (开放平台)**：
     - 访问 [飞书开放平台](https://open.feishu.cn/)
     - 创建企业应用
     - 获取Webhook URL

2. **配置环境变量**：
   ```bash
   # 添加到 .env.production
   FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxx"
   ```

3. **添加GitHub Secret**：
   - 在GitHub仓库设置中添加 `FEISHU_WEBHOOK_URL`
   - 值为步骤1中获得的Webhook URL

4. **测试Webhook (可选)**：
   ```bash
   # 测试飞书webhook是否正常工作
   ./scripts/test-feishu-webhook.sh "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxx"
   ```

#### 通知功能

配置完成后，您将收到以下飞书通知：

**CI/CD构建通知：**
- 🔨 构建成功通知
- ❌ 构建失败通知（包含GitHub Actions链接）

**CI/CD部署通知：**
- 🚀 部署成功通知
- ❌ 部署失败通知

**系统监控通知：**
- ⚠️ 磁盘空间警告 (>80%)
- 🚨 磁盘空间严重不足 (>90%)
- ⚠️ 内存使用警告 (>80%)
- 🚨 内存使用严重不足 (>90%)
- ⚠️ SSL证书即将过期 (<30天)
- 🚨 SSL证书即将过期 (<7天)
- 🔄 应用自动重启通知
- 🚨 应用重启失败警报

## 🌐 第七步：Caddy配置

### 7.1 更新Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

确认配置内容正确（域名已更新为legnext.ai）：

```caddyfile
legnext.ai {
    # 反向代理到Next.js应用
    reverse_proxy localhost:3000

    # 静态文件缓存
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }
    header @static Cache-Control max-age=31536000

    # 安全头部
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }

    # 速率限制
    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1m
        }
    }
    
    # API路由速率限制
    @api {
        path /api/*
    }
    rate_limit @api {
        zone api {
            key {remote_host}
            events 30
            window 1m
        }
    }

    # 日志记录
    log {
        output file /var/log/caddy/legnext.log
        format json
    }

    # 错误页面
    handle_errors {
        rewrite * /{err.status_code}.html
        file_server
    }
}

# www重定向
www.legnext.ai {
    redir https://legnext.ai{uri} permanent
}
```

### 7.2 重启Caddy

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

## 🚀 第八步：首次部署

### 8.1 手动部署测试

在本地机器上构建并上传：

```bash
# 在本地项目目录
npm install
npm run build

# 创建部署包
tar -czf deploy.tar.gz .next public package.json pnpm-lock.yaml prisma next.config.js tailwind.config.js ecosystem.config.js

# 上传到VPS
scp deploy.tar.gz deploy@YOUR_VPS_IP:/tmp/

# 在VPS上部署
ssh deploy@YOUR_VPS_IP
cd /var/www/legnext
tar -xzf /tmp/deploy.tar.gz
pnpm install --production
pnpm prisma generate
pnpm prisma migrate deploy
pm2 start ecosystem.config.js
```

### 8.2 验证部署

```bash
# 检查应用状态
pm2 status
pm2 logs legnext-app

# 检查健康端点
curl https://legnext.ai/api/health

# 检查网站访问
curl -I https://legnext.ai
```

## 🔄 第九步：自动化CI/CD

### 9.1 启用GitHub Actions

推送代码到main分支将自动触发部署：

```bash
git add .
git commit -m "🚀 Production deployment setup"
git push origin main
```

### 9.2 监控部署

1. 访问GitHub Actions标签页查看部署状态
2. 检查Discord/Slack通知（如果配置了）
3. 验证网站功能：https://legnext.ai

## 📊 第十步：监控设置

### 10.1 设置监控脚本

```bash
# 添加到crontab
sudo -u deploy crontab -e

# 添加以下行（每5分钟检查一次）
*/5 * * * * /var/www/legnext/scripts/monitor.sh
```

### 10.2 设置数据库备份

```bash
# 创建备份脚本
sudo -u deploy nano /var/www/legnext/scripts/backup-db.sh
```

添加以下内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
pg_dump -h localhost -U legnext_user -d legnext_db > "$BACKUP_DIR/legnext_db_$DATE.sql"

# 保留最近30天的备份
find "$BACKUP_DIR" -name "legnext_db_*.sql" -mtime +30 -delete
```

```bash
# 给予执行权限
chmod +x /var/www/legnext/scripts/backup-db.sh

# 添加到crontab（每日凌晨2点备份）
sudo -u deploy crontab -e
# 添加: 0 2 * * * /var/www/legnext/scripts/backup-db.sh
```

### 10.3 日志轮转

```bash
sudo nano /etc/logrotate.d/legnext
```

添加以下内容：

```
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

## 🔍 故障排除指南

### DNS问题
```bash
# 检查DNS传播
dig legnext.ai
nslookup legnext.ai

# 检查Cloudflare设置
curl -I https://legnext.ai
```

### SSL证书问题
```bash
# 检查证书状态
sudo caddy list-certificates

# 检查Caddy日志
sudo journalctl -u caddy -f

# 测试SSL连接
openssl s_client -connect legnext.ai:443 -servername legnext.ai
```

### 应用问题
```bash
# 检查应用状态
pm2 status
pm2 logs legnext-app

# 检查健康端点
curl https://legnext.ai/api/health

# 重启应用
pm2 restart legnext-app
```

### 数据库问题
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U legnext_user -d legnext_db -c "SELECT 1;"

# 查看数据库日志
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 🛡️ 安全最佳实践

### 服务器安全
1. **定期更新系统**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**:
   ```bash
   sudo ufw status
   # 只允许必要端口: 22(SSH), 80(HTTP), 443(HTTPS)
   ```

3. **监控登录尝试**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

### 应用安全
1. **定期轮换密钥**:
   - JWT secrets
   - Database passwords
   - API keys

2. **监控错误日志**:
   ```bash
   pm2 logs legnext-app --err
   ```

3. **定期安全审计**:
   ```bash
   npm audit
   npm audit fix
   ```

## 📞 支持联系

如遇到部署问题:

1. 检查应用日志: `pm2 logs legnext-app`
2. 检查系统日志: `sudo journalctl -f`
3. 运行健康检查: `curl https://legnext.ai/api/health`
4. 联系开发团队并提供日志输出

## 📝 部署清单

**部署前:**
- [ ] VPS已准备并可SSH访问
- [ ] 域名已添加到Cloudflare
- [ ] DNS记录已配置并传播
- [ ] GitHub Secrets已设置
- [ ] 环境变量已准备

**部署后:**
- [ ] 网站可正常访问 (https://legnext.ai)
- [ ] 健康检查通过 (https://legnext.ai/api/health)
- [ ] 用户注册登录功能正常
- [ ] 支付系统测试通过
- [ ] 监控脚本运行正常
- [ ] 数据库备份配置完成

## 🎉 部署完成

恭喜！您的Legnext.ai应用现已成功部署并运行在生产环境中。

**重要提醒:**
- 保持所有依赖项最新
- 定期检查监控日志
- 备份重要数据
- 监控资源使用情况并根据需要扩展

您的应用现在可以在 https://legnext.ai 访问！

完成第一次部署 - 2025 09 02