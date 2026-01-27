# Game Gallery Windows Server 2019 Deployment Script
# Backend: Windows Container

Write-Host "=== Game Gallery Windows Container Deployment ===" -ForegroundColor Green

# 1. Check Docker service
Write-Host "`n[1/6] Checking Docker service..." -ForegroundColor Cyan
$dockerService = Get-Service docker -ErrorAction SilentlyContinue
if ($dockerService.Status -ne 'Running') {
    Write-Host "Starting Docker service..." -ForegroundColor Yellow
    Start-Service docker
    Start-Sleep -Seconds 3
}
Write-Host "Docker service is running" -ForegroundColor Green

# 2. Check environment file
Write-Host "`n[2/6] Checking environment configuration..." -ForegroundColor Cyan
if (!(Test-Path .\backend\.env)) {
    Write-Host "Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .\backend\.env.example .\backend\.env
    Write-Host "Please edit backend\.env and configure STEAM_API_KEY" -ForegroundColor Red
    notepad .\backend\.env
    Read-Host "Press Enter after configuration"
}
Write-Host "Environment file exists" -ForegroundColor Green

# 3. Clean old containers
Write-Host "`n[3/6] Cleaning old containers..." -ForegroundColor Cyan
$oldContainer = docker ps -a -q -f name=game-gallery-backend
if ($oldContainer) {
    Write-Host "Stopping and removing old container..." -ForegroundColor Yellow
    docker stop game-gallery-backend 2>$null
    docker rm game-gallery-backend 2>$null
}
Write-Host "Cleanup completed" -ForegroundColor Green

# 4. Build image
Write-Host "`n[4/6] Building Windows container image..." -ForegroundColor Cyan
Write-Host "This may take several minutes, please wait..." -ForegroundColor Yellow
docker build -f .\backend\Dockerfile -t game-gallery-backend:windows .\backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Image build failed!" -ForegroundColor Red
    Write-Host "If network error, try configuring Docker mirror:" -ForegroundColor Yellow
    Write-Host "  1. Create C:\ProgramData\docker\config\daemon.json" -ForegroundColor White
    Write-Host "  2. Add mirror configuration" -ForegroundColor White
    Write-Host "  3. Restart Docker: Restart-Service docker" -ForegroundColor White
    exit 1
}
Write-Host "Image built successfully" -ForegroundColor Green

# 5. Run container
Write-Host "`n[5/6] Starting container..." -ForegroundColor Cyan
docker run -d -p 8080:8080 --env-file .\backend\.env --name game-gallery-backend --restart unless-stopped game-gallery-backend:windows

if ($LASTEXITCODE -ne 0) {
    Write-Host "Container startup failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Container started successfully" -ForegroundColor Green

# 6. Verify deployment
Write-Host "`n[6/6] Verifying deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
docker ps -f name=game-gallery-backend

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Backend URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:8080/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: docker logs game-gallery-backend" -ForegroundColor White
Write-Host "  Live logs: docker logs -f game-gallery-backend" -ForegroundColor White
Write-Host "  Stop: docker stop game-gallery-backend" -ForegroundColor White
Write-Host "  Start: docker start game-gallery-backend" -ForegroundColor White
Write-Host "  Restart: docker restart game-gallery-backend" -ForegroundColor White
Write-Host "  Remove: docker rm -f game-gallery-backend" -ForegroundColor White
