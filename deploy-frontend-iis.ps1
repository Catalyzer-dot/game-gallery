# Game Gallery Frontend Deployment Script - IIS

Write-Host "=== Game Gallery Frontend IIS Deployment ===" -ForegroundColor Green

# 1. Check Node.js
Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if (!$nodeVersion) {
    Write-Host "Node.js not installed, please install Node.js 18+" -ForegroundColor Red
    Write-Host "Download: https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi" -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# 2. Install dependencies
Write-Host "`n[2/5] Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location .\web
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency installation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green

# 3. Configure environment variables
Write-Host "`n[3/5] Configuring environment variables..." -ForegroundColor Cyan
if (!(Test-Path ".env.production")) {
    Write-Host "Creating .env.production file..." -ForegroundColor Yellow
    $envContent = "# Production environment configuration`r`n# API base URL (use server IP or domain)`r`nVITE_API_URL=http://localhost:8080"
    $envContent | Out-File -FilePath ".env.production" -Encoding ASCII
    Write-Host "Please edit web\.env.production to configure VITE_API_URL" -ForegroundColor Red
    notepad ".env.production"
    Read-Host "Press Enter after configuration"
}
Write-Host "Environment variables configured" -ForegroundColor Green

# 4. Build frontend
Write-Host "`n[4/5] Building frontend application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Build completed, output directory: web\dist" -ForegroundColor Green

# 5. Install and configure IIS
Write-Host "`n[5/5] Configuring IIS..." -ForegroundColor Cyan
$iisFeature = Get-WindowsFeature Web-Server
if ($iisFeature.Installed -eq $false) {
    Write-Host "Installing IIS..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# Create IIS website
Import-Module WebAdministration
$siteName = "GameGallery"
$sitePath = "C:\inetpub\wwwroot\game-gallery"

# Remove old site if exists
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-WebSite -Name $siteName
}

# Copy files to IIS directory
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
}
Copy-Item -Path ".\dist\*" -Destination $sitePath -Recurse -Force

# Create website
New-WebSite -Name $siteName -Port 80 -PhysicalPath $sitePath -Force | Out-Null

# Configure URL Rewrite (for Vue Router)
$webConfigContent = @'
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
'@
$webConfigContent | Out-File -FilePath "$sitePath\web.config" -Encoding UTF8

Write-Host "IIS configuration completed" -ForegroundColor Green

# Start website
Start-WebSite -Name $siteName

# Configure firewall
Write-Host "`nConfiguring firewall..." -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "HTTP" -ErrorAction SilentlyContinue
if (!$firewallRule) {
    New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 | Out-Null
}

Pop-Location

Write-Host "`n=== Frontend Deployment Complete ===" -ForegroundColor Green
Write-Host "Access URL: http://localhost" -ForegroundColor Cyan
Write-Host "Or use server IP: http://YOUR_SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "To update later:" -ForegroundColor Yellow
Write-Host "  1. cd web" -ForegroundColor White
Write-Host "  2. npm run build" -ForegroundColor White
Write-Host "  3. Copy-Item -Path .\dist\* -Destination C:\inetpub\wwwroot\game-gallery -Recurse -Force" -ForegroundColor White
