# Game Gallery 前端部署脚本 - Docker 方式（需要 Linux 容器支持）

Write-Host "=== Game Gallery 前端 Docker 部署脚本 ===" -ForegroundColor Green
Write-Host "注意：此脚本使用 Linux 容器，需要 Docker Desktop 或 WSL2" -ForegroundColor Yellow
Write-Host ""

# 1. 检查 Docker 服务
Write-Host "[1/5] 检查 Docker 服务..." -ForegroundColor Cyan
$dockerService = Get-Service docker -ErrorAction SilentlyContinue
if ($dockerService.Status -ne 'Running') {
    Write-Host "启动 Docker 服务..." -ForegroundColor Yellow
    Start-Service docker
    Start-Sleep -Seconds 3
}
Write-Host "Docker 服务运行正常" -ForegroundColor Green

# 2. 检查环境变量文件
Write-Host "`n[2/5] 配置环境变量..." -ForegroundColor Cyan
if (!(Test-Path ".\web\.env.production")) {
    Write-Host "创建 .env.production 文件..." -ForegroundColor Yellow
    @"
# 生产环境配置
# API 基础 URL（通过 nginx 代理时留空）
VITE_API_URL=
"@ | Out-File -FilePath ".\web\.env.production" -Encoding UTF8
}
Write-Host "环境变量配置完成" -ForegroundColor Green

# 3. 停止旧容器
Write-Host "`n[3/5] 清理旧容器..." -ForegroundColor Cyan
$oldContainer = docker ps -a -q -f name=game-gallery-frontend
if ($oldContainer) {
    docker stop game-gallery-frontend 2>$null
    docker rm game-gallery-frontend 2>$null
}
Write-Host "清理完成" -ForegroundColor Green

# 4. 构建镜像
Write-Host "`n[4/5] 构建前端镜像（Linux 容器）..." -ForegroundColor Cyan
Write-Host "这可能需要几分钟..." -ForegroundColor Yellow
docker build -f .\web\Dockerfile -t game-gallery-frontend:latest .\web
if ($LASTEXITCODE -ne 0) {
    Write-Host "镜像构建失败！" -ForegroundColor Red
    exit 1
}
Write-Host "镜像构建成功" -ForegroundColor Green

# 5. 运行容器
Write-Host "`n[5/5] 启动容器..." -ForegroundColor Cyan
docker run -d `
  -p 80:80 `
  --name game-gallery-frontend `
  --restart unless-stopped `
  game-gallery-frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "容器启动失败！" -ForegroundColor Red
    exit 1
}
Write-Host "容器启动成功" -ForegroundColor Green

# 验证
Write-Host "`n验证部署..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
docker ps -f name=game-gallery-frontend

Write-Host "`n=== 部署完成 ===" -ForegroundColor Green
Write-Host "访问地址: http://localhost" -ForegroundColor Cyan
Write-Host "或使用服务器IP: http://你的服务器IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Yellow
Write-Host "  查看日志: docker logs game-gallery-frontend" -ForegroundColor White
Write-Host "  停止容器: docker stop game-gallery-frontend" -ForegroundColor White
Write-Host "  启动容器: docker start game-gallery-frontend" -ForegroundColor White
