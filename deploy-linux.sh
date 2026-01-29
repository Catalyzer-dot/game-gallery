#!/bin/bash
set -e

# Linux服务器自动部署脚本
# 此脚本从dist分支拉取前端构建产物，从GHCR拉取后端镜像

echo "======================================"
echo "Game Gallery Linux Deployment"
echo "======================================"
echo ""

# 配置变量
DEPLOY_DIR="${DEPLOY_DIR:-/opt/game-gallery}"
BACKEND_IMAGE="${BACKEND_IMAGE:-ghcr.io/yangzirui-lab/game-gallery/backend:latest}"
TEMP_DIR="/tmp/game-gallery-deploy-$$"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
log_info "Checking dependencies..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "Git is not installed"
    exit 1
fi

log_info "All dependencies are installed"

# 步骤1: 拉取最新后端镜像
echo ""
log_info "[1/5] Pulling latest backend image..."
if docker pull "$BACKEND_IMAGE"; then
    log_info "Backend image pulled successfully"
else
    log_error "Failed to pull backend image"
    exit 1
fi

# 步骤2: 下载前端构建产物
echo ""
log_info "[2/5] Downloading frontend build from dist branch..."
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# 配置 git 以提高稳定性
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 尝试克隆，最多重试 3 次
RETRY_COUNT=0
MAX_RETRIES=3
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log_info "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES to download frontend..."

    if git clone --branch dist --depth 1 --single-branch https://github.com/yangzirui-lab/game-gallery.git .; then
        SUCCESS=true
        log_info "Frontend build downloaded successfully"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warn "Download failed, retrying in 5 seconds..."
            sleep 5
        fi
    fi
done

if [ "$SUCCESS" = false ]; then
    log_error "Failed to download frontend build after $MAX_RETRIES attempts"
    log_info "Trying alternative method (GitHub API)..."

    # 备用方案：使用 GitHub API 下载
    cd "$TEMP_DIR"
    if curl -fsSL -o dist.tar.gz "https://github.com/yangzirui-lab/game-gallery/archive/refs/heads/dist.tar.gz"; then
        tar -xzf dist.tar.gz --strip-components=1
        rm dist.tar.gz
        log_info "Frontend downloaded via GitHub API"
    else
        log_error "All download methods failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
fi

# 步骤3: 部署前端文件
echo ""
log_info "[3/5] Deploying frontend files..."
mkdir -p "$DEPLOY_DIR/web/dist"
cp -r "$TEMP_DIR"/* "$DEPLOY_DIR/web/dist/"

# 修正文件权限
if id deploy &>/dev/null; then
    log_info "Setting file ownership to deploy user..."
    chown -R deploy:deploy "$DEPLOY_DIR/web"
fi

log_info "Frontend files deployed to $DEPLOY_DIR/web/dist"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 步骤4: 更新配置文件和服务
echo ""
log_info "[4/5] Updating configuration and services..."
cd "$DEPLOY_DIR"

# 下载最新的配置文件
log_info "Updating docker-compose.yml..."
if curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/yangzirui-lab/game-gallery/main/docker-compose.yml; then
    # 移除 version 字段（Docker Compose v2 不需要）
    sed -i.bak '/^version:/d' docker-compose.yml && rm -f docker-compose.yml.bak
    log_info "docker-compose.yml updated"
else
    log_warn "Failed to update docker-compose.yml"
fi

log_info "Updating nginx.conf..."
if curl -fsSL -o nginx.conf https://raw.githubusercontent.com/yangzirui-lab/game-gallery/main/nginx.conf; then
    log_info "nginx.conf updated"
else
    log_warn "Failed to update nginx.conf"
fi

log_info "Updating deploy-linux.sh..."
if curl -fsSL -o deploy-linux.sh.new https://raw.githubusercontent.com/yangzirui-lab/game-gallery/main/deploy-linux.sh; then
    # 比较文件是否有变化
    if ! cmp -s deploy-linux.sh deploy-linux.sh.new; then
        mv deploy-linux.sh.new deploy-linux.sh
        chmod +x deploy-linux.sh
        log_info "deploy-linux.sh updated (script will continue with old version)"
    else
        rm deploy-linux.sh.new
        log_info "deploy-linux.sh is already up to date"
    fi
else
    log_warn "Failed to update deploy-linux.sh"
    rm -f deploy-linux.sh.new
fi

# 检查.env文件
if [ ! -f "$DEPLOY_DIR/backend/.env" ]; then
    log_warn "Backend .env file not found, please create it before starting services"
fi

# 零停机部署
log_info "Deploying with zero downtime..."

# 更新后端服务（滚动更新）
log_info "Updating backend service..."
if docker-compose up -d --no-deps --force-recreate backend; then
    log_info "Backend container recreated"
else
    log_error "Failed to update backend"
    exit 1
fi

# 等待后端健康检查
log_info "Waiting for backend health check..."
MAX_RETRY=30
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRY ]; do
    if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        log_info "Backend is healthy"
        BACKEND_HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRY ]; then
        log_warn "Backend health check timeout, but continuing..."
        docker-compose logs backend --tail=20
    fi
    sleep 2
done

# Nginx 配置热更新（如果配置有变化）
if docker-compose ps nginx | grep -q "Up"; then
    log_info "Reloading nginx configuration..."
    if docker-compose exec -T nginx nginx -s reload 2>/dev/null; then
        log_info "Nginx configuration reloaded"
    else
        log_warn "Nginx reload failed, recreating container..."
        docker-compose up -d --no-deps --force-recreate nginx
        sleep 3
    fi
else
    log_info "Starting nginx service..."
    docker-compose up -d nginx
    sleep 3
fi

# 步骤5: 验证部署
echo ""
log_info "[5/5] Verifying deployment..."

# 最终健康检查
if curl -sf http://localhost/health > /dev/null; then
    log_info "Health check passed"
else
    log_warn "Health check failed"
    docker-compose logs --tail=30
fi

# 清理旧容器
log_info "Cleaning up old containers..."
docker container prune -f

# 检查容器状态
if docker-compose ps | grep -q "Up"; then
    log_info "Containers are running"
else
    log_error "Some containers are not running"
    docker-compose ps
    exit 1
fi

# 显示部署信息
echo ""
echo "======================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Backend Image: $BACKEND_IMAGE"
echo "Deploy Directory: $DEPLOY_DIR"
echo ""
echo "Services:"
docker-compose ps
echo ""
echo "Access your application:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  Backend API: http://$(hostname -I | awk '{print $1}')/api"
echo ""
