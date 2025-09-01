#!/bin/bash

# Pre-deployment Check Script
# Run this script before deploying to ensure everything is configured correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Print header
echo -e "${BLUE}🔍 Legnext Pre-Deployment Checklist${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to log check results
log_check() {
    local status=$1
    local message=$2
    
    if [[ "$status" == "pass" ]]; then
        echo -e "✅ ${GREEN}$message${NC}"
        ((CHECKS_PASSED++))
    elif [[ "$status" == "fail" ]]; then
        echo -e "❌ ${RED}$message${NC}"
        ((CHECKS_FAILED++))
    elif [[ "$status" == "warn" ]]; then
        echo -e "⚠️  ${YELLOW}$message${NC}"
        ((WARNINGS++))
    else
        echo -e "ℹ️  ${BLUE}$message${NC}"
    fi
}

# Check if required files exist
check_required_files() {
    echo -e "${BLUE}📁 Checking required files...${NC}"
    
    local required_files=(
        "package.json"
        "next.config.js"
        "tailwind.config.js"
        "ecosystem.config.js"
        "Caddyfile"
        ".env.production.template"
        "prisma/schema.prisma"
        ".github/workflows/deploy.yml"
        "scripts/setup-vps.sh"
        "scripts/monitor.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_check "pass" "$file exists"
        else
            log_check "fail" "$file is missing"
        fi
    done
    echo ""
}

# Check package.json configuration
check_package_json() {
    echo -e "${BLUE}📦 Checking package.json configuration...${NC}"
    
    if [[ -f "package.json" ]]; then
        if jq -e '.scripts.build' package.json >/dev/null 2>&1; then
            log_check "pass" "Build script is configured"
        else
            log_check "fail" "Build script is missing"
        fi
        
        if jq -e '.scripts.start' package.json >/dev/null 2>&1; then
            log_check "pass" "Start script is configured"
        else
            log_check "fail" "Start script is missing"
        fi
        
        if jq -e '.dependencies."@prisma/client"' package.json >/dev/null 2>&1; then
            log_check "pass" "Prisma client dependency found"
        else
            log_check "warn" "Prisma client dependency not found"
        fi
    else
        log_check "fail" "package.json not found"
    fi
    echo ""
}

# Check environment template
check_env_template() {
    echo -e "${BLUE}🔧 Checking environment template...${NC}"
    
    if [[ -f ".env.production.template" ]]; then
        local required_vars=(
            "DATABASE_URL"
            "DIRECT_URL"
            "NEXTAUTH_URL"
            "NEXTAUTH_SECRET"
            "GOOGLE_ID"
            "GOOGLE_SECRET"
            "PAYMENT_GATEWAY"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env.production.template; then
                log_check "pass" "$var is in environment template"
            else
                log_check "fail" "$var is missing from environment template"
            fi
        done
    else
        log_check "fail" "Environment template not found"
    fi
    echo ""
}

# Check Prisma configuration
check_prisma() {
    echo -e "${BLUE}🗄️  Checking Prisma configuration...${NC}"
    
    if [[ -f "prisma/schema.prisma" ]]; then
        log_check "pass" "Prisma schema exists"
        
        if grep -q "postgresql" prisma/schema.prisma; then
            log_check "pass" "PostgreSQL provider configured"
        else
            log_check "warn" "PostgreSQL provider not found in schema"
        fi
        
        if [[ -d "prisma/migrations" ]] && [[ "$(ls -A prisma/migrations)" ]]; then
            log_check "pass" "Database migrations exist"
        else
            log_check "warn" "No database migrations found"
        fi
    else
        log_check "fail" "Prisma schema not found"
    fi
    echo ""
}

# Check GitHub Actions configuration
check_github_actions() {
    echo -e "${BLUE}⚙️  Checking GitHub Actions configuration...${NC}"
    
    if [[ -f ".github/workflows/deploy.yml" ]]; then
        log_check "pass" "Deployment workflow exists"
        
        if grep -q "VPS_HOST" .github/workflows/deploy.yml; then
            log_check "pass" "VPS_HOST secret referenced"
        else
            log_check "fail" "VPS_HOST secret not referenced"
        fi
        
        if grep -q "health" .github/workflows/deploy.yml; then
            log_check "pass" "Health check included in workflow"
        else
            log_check "warn" "Health check not found in workflow"
        fi
    else
        log_check "fail" "GitHub Actions workflow not found"
    fi
    echo ""
}

# Check Caddy configuration
check_caddy_config() {
    echo -e "${BLUE}🌐 Checking Caddy configuration...${NC}"
    
    if [[ -f "Caddyfile" ]]; then
        log_check "pass" "Caddyfile exists"
        
        if grep -q "reverse_proxy" Caddyfile; then
            log_check "pass" "Reverse proxy configuration found"
        else
            log_check "fail" "Reverse proxy configuration missing"
        fi
        
        if grep -q "localhost:3000" Caddyfile; then
            log_check "pass" "Correct upstream port configured"
        else
            log_check "warn" "Port 3000 not found in Caddyfile"
        fi
        
        if grep -q "rate_limit" Caddyfile; then
            log_check "pass" "Rate limiting configured"
        else
            log_check "warn" "Rate limiting not configured"
        fi
    else
        log_check "fail" "Caddyfile not found"
    fi
    echo ""
}

# Check PM2 configuration
check_pm2_config() {
    echo -e "${BLUE}🔄 Checking PM2 configuration...${NC}"
    
    if [[ -f "ecosystem.config.js" ]]; then
        log_check "pass" "PM2 ecosystem file exists"
        
        if grep -q "port.*3000" ecosystem.config.js; then
            log_check "pass" "Correct port configured in PM2"
        else
            log_check "warn" "Port 3000 not found in PM2 config"
        fi
        
        if grep -q "NODE_ENV.*production" ecosystem.config.js; then
            log_check "pass" "Production environment configured"
        else
            log_check "warn" "Production environment not set in PM2 config"
        fi
    else
        log_check "fail" "PM2 ecosystem file not found"
    fi
    echo ""
}

# Check build capability
check_build() {
    echo -e "${BLUE}🔨 Testing build process...${NC}"
    
    if command -v node >/dev/null 2>&1; then
        log_check "pass" "Node.js is available"
        local node_version=$(node --version)
        log_check "info" "Node.js version: $node_version"
    else
        log_check "fail" "Node.js not found"
    fi
    
    if command -v pnpm >/dev/null 2>&1; then
        log_check "pass" "pnpm is available"
    else
        log_check "warn" "pnpm not found (will be installed on VPS)"
    fi
    
    if [[ -f "package-lock.json" ]]; then
        log_check "warn" "package-lock.json found (using pnpm instead)"
    fi
    
    if [[ -f "pnpm-lock.yaml" ]]; then
        log_check "pass" "pnpm-lock.yaml exists"
    else
        log_check "fail" "pnpm-lock.yaml not found"
    fi
    echo ""
}

# Check security considerations
check_security() {
    echo -e "${BLUE}🔒 Checking security configuration...${NC}"
    
    if [[ -f ".env" ]] || [[ -f ".env.local" ]]; then
        log_check "warn" "Local environment files found - ensure secrets are not committed"
    fi
    
    if grep -r "sk_live_\|sk_test_\|pk_live_\|pk_test_" --include="*.js" --include="*.ts" --include="*.json" . 2>/dev/null; then
        log_check "fail" "API keys found in code - move to environment variables"
    else
        log_check "pass" "No API keys found in code"
    fi
    
    if [[ -f ".gitignore" ]]; then
        if grep -q ".env" .gitignore; then
            log_check "pass" "Environment files ignored by Git"
        else
            log_check "warn" "Environment files not ignored by Git"
        fi
    else
        log_check "warn" ".gitignore not found"
    fi
    echo ""
}

# Print summary
print_summary() {
    echo -e "${BLUE}📊 Summary${NC}"
    echo -e "${BLUE}=========${NC}"
    echo -e "✅ Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "❌ Checks failed: ${RED}$CHECKS_FAILED${NC}"
    echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 All critical checks passed! Ready for deployment.${NC}"
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  Please review the warnings above.${NC}"
        fi
        exit 0
    else
        echo -e "${RED}🚫 Deployment not recommended. Please fix the failed checks.${NC}"
        exit 1
    fi
}

# Run all checks
main() {
    check_required_files
    check_package_json
    check_env_template
    check_prisma
    check_github_actions
    check_caddy_config
    check_pm2_config
    check_build
    check_security
    print_summary
}

# Run the main function
main "$@"