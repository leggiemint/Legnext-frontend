#!/bin/bash

# Monitoring Script for Legnext Application
# This script monitors the application and sends alerts if issues are detected

set -e

# Configuration
APP_NAME="legnext-app"
APP_URL="https://legnext.ai"
HEALTH_ENDPOINT="$APP_URL/api/health"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
FEISHU_WEBHOOK_URL="${FEISHU_WEBHOOK_URL:-}"
LOG_FILE="/var/log/legnext-monitor.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Send Discord notification
send_discord_notification() {
    local title="$1"
    local description="$2"
    local color="$3"
    
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -X POST "$DISCORD_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"embeds\": [{
                    \"title\": \"$title\",
                    \"description\": \"$description\",
                    \"color\": $color,
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
                }]
            }" 2>/dev/null || log "Failed to send Discord notification"
    fi
}

# Send 飞书/Lark notification
send_feishu_notification() {
    local title="$1"
    local description="$2"
    local template="$3"  # green, yellow, red
    
    if [[ -n "$FEISHU_WEBHOOK_URL" ]]; then
        curl -X POST "$FEISHU_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"msg_type\": \"interactive\",
                \"card\": {
                    \"elements\": [
                        {
                            \"tag\": \"div\",
                            \"text\": {
                                \"content\": \"**$title**\\n\\n$description\",
                                \"tag\": \"lark_md\"
                            }
                        }
                    ],
                    \"header\": {
                        \"title\": {
                            \"content\": \"🔍 Legnext 系统监控\",
                            \"tag\": \"plain_text\"
                        },
                        \"template\": \"$template\"
                    }
                }
            }" 2>/dev/null || log "Failed to send 飞书 notification"
    fi
}

# Check if application is running
check_application() {
    log "🔍 Checking application status..."
    
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log "✅ Application is running"
        return 0
    else
        log "❌ Application is not running"
        return 1
    fi
}

# Check health endpoint
check_health_endpoint() {
    log "🏥 Checking health endpoint..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" --connect-timeout 10 --max-time 30)
    
    if [[ "$response_code" == "200" ]]; then
        log "✅ Health endpoint responding with 200"
        return 0
    else
        log "❌ Health endpoint responding with $response_code"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log "🗄️  Checking database connectivity..."
    
    if pg_isready -h localhost -p 5432 -U legnext_user >/dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        log "❌ Database is not accessible"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log "💾 Checking disk space..."
    
    local usage
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$usage" -lt 80 ]]; then
        log "✅ Disk usage is ${usage}% (healthy)"
        return 0
    elif [[ "$usage" -lt 90 ]]; then
        log "⚠️  Disk usage is ${usage}% (warning)"
        send_discord_notification "⚠️ Disk Space Warning" "Disk usage is at ${usage}%" 16776960
        send_feishu_notification "⚠️ 磁盘空间警告" "磁盘使用率已达到 ${usage}%" "yellow"
        return 1
    else
        log "❌ Disk usage is ${usage}% (critical)"
        send_discord_notification "🚨 Disk Space Critical" "Disk usage is at ${usage}%" 15548997
        send_feishu_notification "🚨 磁盘空间严重不足" "磁盘使用率已达到 ${usage}%，请立即处理" "red"
        return 1
    fi
}

# Check memory usage
check_memory() {
    log "🧠 Checking memory usage..."
    
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [[ "$mem_usage" -lt 80 ]]; then
        log "✅ Memory usage is ${mem_usage}% (healthy)"
        return 0
    elif [[ "$mem_usage" -lt 90 ]]; then
        log "⚠️  Memory usage is ${mem_usage}% (warning)"
        send_discord_notification "⚠️ Memory Warning" "Memory usage is at ${mem_usage}%" 16776960
        send_feishu_notification "⚠️ 内存使用警告" "内存使用率已达到 ${mem_usage}%" "yellow"
        return 1
    else
        log "❌ Memory usage is ${mem_usage}% (critical)"
        send_discord_notification "🚨 Memory Critical" "Memory usage is at ${mem_usage}%" 15548997
        send_feishu_notification "🚨 内存使用严重不足" "内存使用率已达到 ${mem_usage}%，请立即处理" "red"
        return 1
    fi
}

# Check SSL certificate expiry
check_ssl_certificate() {
    log "🔐 Checking SSL certificate..."
    
    local domain="legnext.ai"
    local expiry_date
    local days_until_expiry
    
    expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    days_until_expiry=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))
    
    if [[ "$days_until_expiry" -gt 30 ]]; then
        log "✅ SSL certificate expires in $days_until_expiry days"
        return 0
    elif [[ "$days_until_expiry" -gt 7 ]]; then
        log "⚠️  SSL certificate expires in $days_until_expiry days"
        send_discord_notification "⚠️ SSL Certificate Warning" "Certificate expires in $days_until_expiry days" 16776960
        send_feishu_notification "⚠️ SSL证书即将过期" "SSL证书将在 $days_until_expiry 天后过期" "yellow"
        return 1
    else
        log "❌ SSL certificate expires in $days_until_expiry days"
        send_discord_notification "🚨 SSL Certificate Critical" "Certificate expires in $days_until_expiry days" 15548997
        send_feishu_notification "🚨 SSL证书即将过期" "SSL证书将在 $days_until_expiry 天后过期，请立即更新" "red"
        return 1
    fi
}

# Restart application if needed
restart_application() {
    log "🔄 Restarting application..."
    
    pm2 restart "$APP_NAME"
    sleep 10
    
    if check_application && check_health_endpoint; then
        log "✅ Application restarted successfully"
        send_discord_notification "🔄 Application Restarted" "Application was automatically restarted due to health check failure" 5763719
        send_feishu_notification "🔄 应用自动重启" "由于健康检查失败，应用已自动重启" "green"
        return 0
    else
        log "❌ Application restart failed"
        send_discord_notification "🚨 Application Restart Failed" "Failed to restart application automatically" 15548997
        send_feishu_notification "🚨 应用重启失败" "应用自动重启失败，需要手动干预" "red"
        return 1
    fi
}

# Main monitoring function
main() {
    log "🚀 Starting health check..."
    
    local failed_checks=0
    
    # Run all checks
    check_application || ((failed_checks++))
    check_health_endpoint || ((failed_checks++))
    check_database || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_memory || ((failed_checks++))
    check_ssl_certificate || ((failed_checks++))
    
    # If application or health endpoint failed, try to restart
    if ! check_application || ! check_health_endpoint; then
        log "🚨 Critical services are down, attempting restart..."
        if restart_application; then
            log "✅ Recovery successful"
        else
            log "❌ Recovery failed"
            send_discord_notification "🚨 System Alert" "Application is down and automatic recovery failed. Manual intervention required." 15548997
            send_feishu_notification "🚨 系统警报" "应用程序已停机，自动恢复失败，需要手动干预处理" "red"
        fi
    fi
    
    if [[ "$failed_checks" -eq 0 ]]; then
        log "✅ All health checks passed"
    else
        log "⚠️  $failed_checks health checks failed"
    fi
    
    log "🏁 Health check completed"
    echo ""
}

# Run the main function
main "$@"