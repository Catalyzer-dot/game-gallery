# Configure Docker Registry Mirror for China
# Solves: "context deadline exceeded" error when pulling images

Write-Host "=== Configuring Docker Registry Mirror ===" -ForegroundColor Green

# 1. Create config directory
$configDir = "C:\ProgramData\docker\config"
if (!(Test-Path $configDir)) {
    Write-Host "Creating config directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# 2. Create daemon.json with mirror configuration
Write-Host "Creating daemon.json with registry mirrors..." -ForegroundColor Cyan

$daemonConfig = @"
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "max-concurrent-downloads": 10
}
"@

$daemonConfig | Out-File -FilePath "$configDir\daemon.json" -Encoding ASCII -Force

Write-Host "daemon.json created successfully" -ForegroundColor Green
Write-Host "Configuration:" -ForegroundColor Cyan
Get-Content "$configDir\daemon.json"

# 3. Restart Docker service
Write-Host "`nRestarting Docker service..." -ForegroundColor Cyan
Restart-Service docker
Start-Sleep -Seconds 5

# 4. Verify
Write-Host "`nVerifying Docker configuration..." -ForegroundColor Cyan
docker info | Select-String -Pattern "Registry Mirrors" -Context 0,5

Write-Host "`n=== Configuration Complete ===" -ForegroundColor Green
Write-Host "Docker registry mirrors configured" -ForegroundColor Cyan
Write-Host "You can now run: .\deploy-windows.ps1" -ForegroundColor Yellow
