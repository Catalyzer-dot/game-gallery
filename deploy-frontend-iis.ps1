# Game Gallery 前端部署脚本 - IIS 方式（推荐）

Write-Host "=== Game Gallery 前端 IIS 部署脚本 ===" -ForegroundColor Green

# 1. 检查 Node.js
Write-Host "`n[1/5] 检查 Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if (!$nodeVersion) {
    Write-Host "未安装 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi" -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

# 2. 安装依赖
Write-Host "`n[2/5] 安装前端依赖..." -ForegroundColor Cyan
cd .\web
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "依赖安装失败！" -ForegroundColor Red
    exit 1
}
Write-Host "依赖安装完成" -ForegroundColor Green

# 3. 配置环境变量
Write-Host "`n[3/5] 配置环境变量..." -ForegroundColor Cyan
if (!(Test-Path ".env.production")) {
    Write-Host "创建 .env.production 文件..." -ForegroundColor Yellow
    @"
# 生产环境配置
# API 基础 URL（使用服务器IP或域名）
VITE_API_URL=http://localhost:8080
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Host "请编辑 web\.env.production，配置 VITE_API_URL" -ForegroundColor Red
    notepad ".env.production"
    Read-Host "配置完成后，按回车继续"
}
Write-Host "环境变量配置完成" -ForegroundColor Green

# 4. 构建前端
Write-Host "`n[4/5] 构建前端应用..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}
Write-Host "构建完成，输出目录: web\dist" -ForegroundColor Green

# 5. 安装并配置 IIS
Write-Host "`n[5/5] 配置 IIS..." -ForegroundColor Cyan
$iisFeature = Get-WindowsFeature Web-Server
if ($iisFeature.Installed -eq $false) {
    Write-Host "安装 IIS..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# 创建 IIS 网站
Import-Module WebAdministration
$siteName = "GameGallery"
$sitePath = "C:\inetpub\wwwroot\game-gallery"

# 删除旧站点（如果存在）
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-WebSite -Name $siteName
}

# 复制文件到 IIS 目录
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath -Force
}
Copy-Item -Path ".\dist\*" -Destination $sitePath -Recurse -Force

# 创建网站
New-WebSite -Name $siteName -Port 80 -PhysicalPath $sitePath -Force

# 配置 URL Rewrite（支持 Vue Router）
$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Handle History Mode and custom 404/500" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
        </staticContent>
    </system.webServer>
</configuration>
"@
$webConfig | Out-File -FilePath "$sitePath\web.config" -Encoding UTF8

Write-Host "IIS 配置完成" -ForegroundColor Green

# 启动网站
Start-WebSite -Name $siteName

# 配置防火墙
Write-Host "`n配置防火墙..." -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "HTTP" -ErrorAction SilentlyContinue
if (!$firewallRule) {
    New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80
}

cd ..

Write-Host "`n=== 前端部署完成 ===" -ForegroundColor Green
Write-Host "访问地址: http://localhost" -ForegroundColor Cyan
Write-Host "或使用服务器IP: http://你的服务器IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "后续更新:" -ForegroundColor Yellow
Write-Host "  1. cd web" -ForegroundColor White
Write-Host "  2. npm run build" -ForegroundColor White
Write-Host "  3. Copy-Item -Path .\dist\* -Destination $sitePath -Recurse -Force" -ForegroundColor White
