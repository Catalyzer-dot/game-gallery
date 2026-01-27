# Game Gallery Server Deployment Script
# This script pulls the latest images and deploys to Windows Server
# Safe for use with public repositories

param(
    [string]$GithubToken = "",
    [string]$BackendImageTag = "latest"
)

Write-Host "=== Game Gallery Deployment Script ===" -ForegroundColor Green
Write-Host "This script will deploy the latest version from GitHub" -ForegroundColor Cyan

# Configuration
$REGISTRY = "ghcr.io"
$REPO_OWNER = "yangzirui-lab"
$REPO_NAME = "game-gallery"
$BACKEND_IMAGE = "$REGISTRY/$REPO_OWNER/$REPO_NAME/backend:$BackendImageTag"
$FRONTEND_BRANCH = "dist"
$IIS_SITE_NAME = "GameGallery"
$IIS_SITE_PATH = "C:\inetpub\wwwroot\game-gallery"
$TEMP_DIR = "$env:TEMP\game-gallery-deploy"

# 1. Check Docker service
Write-Host "`n[1/5] Checking Docker service..." -ForegroundColor Cyan
$dockerService = Get-Service docker -ErrorAction SilentlyContinue
if (!$dockerService -or $dockerService.Status -ne 'Running') {
    Write-Host "Error: Docker service is not running!" -ForegroundColor Red
    Write-Host "Please start Docker: Start-Service docker" -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker service is running" -ForegroundColor Green

# 2. Login to GitHub Container Registry
Write-Host "`n[2/5] Logging in to GitHub Container Registry..." -ForegroundColor Cyan
if ($GithubToken) {
    echo $GithubToken | docker login $REGISTRY -u $REPO_OWNER --password-stdin
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to login to GHCR!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Info: No GitHub token provided, attempting anonymous pull..." -ForegroundColor Yellow
    Write-Host "If the image is private, run this script with: -GithubToken YOUR_TOKEN" -ForegroundColor Yellow
}
Write-Host "Ready to pull images" -ForegroundColor Green

# 3. Deploy Backend
Write-Host "`n[3/5] Deploying backend..." -ForegroundColor Cyan

# Stop and remove old container
Write-Host "Stopping old backend container..." -ForegroundColor Yellow
$oldContainer = docker ps -a -q -f name=game-gallery-backend
if ($oldContainer) {
    docker stop game-gallery-backend 2>$null
    docker rm game-gallery-backend 2>$null
}

# Pull latest image
Write-Host "Pulling latest backend image..." -ForegroundColor Yellow
docker pull $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to pull backend image!" -ForegroundColor Red
    Write-Host "Make sure the image exists and you have access." -ForegroundColor Yellow
    exit 1
}

# Check for .env file
if (!(Test-Path ".\backend\.env")) {
    Write-Host "Warning: backend\.env not found!" -ForegroundColor Yellow
    Write-Host "Creating from example..." -ForegroundColor Yellow
    if (Test-Path ".\backend\.env.example") {
        Copy-Item ".\backend\.env.example" ".\backend\.env"
        Write-Host "Please edit backend\.env and configure STEAM_API_KEY" -ForegroundColor Red
        notepad ".\backend\.env"
        Read-Host "Press Enter after configuration"
    } else {
        Write-Host "Creating minimal .env file..." -ForegroundColor Yellow
        "PORT=8080" | Out-File -FilePath ".\backend\.env" -Encoding ASCII
    }
}

# Start new container
Write-Host "Starting backend container..." -ForegroundColor Yellow
docker run -d `
    -p 8080:8080 `
    --env-file .\backend\.env `
    --name game-gallery-backend `
    --restart unless-stopped `
    $BACKEND_IMAGE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start backend container!" -ForegroundColor Red
    exit 1
}
Write-Host "Backend deployed successfully" -ForegroundColor Green

# 4. Deploy Frontend
Write-Host "`n[4/5] Deploying frontend..." -ForegroundColor Cyan

# Create temp directory
if (Test-Path $TEMP_DIR) {
    Remove-Item -Path $TEMP_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# Clone dist branch
Write-Host "Downloading frontend build from GitHub..." -ForegroundColor Yellow
Push-Location $TEMP_DIR
git clone -b $FRONTEND_BRANCH --depth 1 "https://github.com/$REPO_OWNER/$REPO_NAME.git" frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to clone frontend dist branch!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Ensure IIS is configured
Write-Host "Configuring IIS..." -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction Stop

# Stop site if exists
if (Test-Path "IIS:\Sites\$IIS_SITE_NAME") {
    Stop-WebSite -Name $IIS_SITE_NAME -ErrorAction SilentlyContinue
}

# Create/update site directory
if (!(Test-Path $IIS_SITE_PATH)) {
    New-Item -ItemType Directory -Path $IIS_SITE_PATH -Force | Out-Null
}

# Copy built files
Write-Host "Copying frontend files to IIS..." -ForegroundColor Yellow
Copy-Item -Path "$TEMP_DIR\frontend\*" -Destination $IIS_SITE_PATH -Recurse -Force

# Create web.config for SPA routing
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
$webConfigContent | Out-File -FilePath "$IIS_SITE_PATH\web.config" -Encoding UTF8

# Create or update site
if (!(Test-Path "IIS:\Sites\$IIS_SITE_NAME")) {
    Write-Host "Creating IIS site..." -ForegroundColor Yellow
    New-WebSite -Name $IIS_SITE_NAME -Port 80 -PhysicalPath $IIS_SITE_PATH -Force | Out-Null
}

# Start site
Start-WebSite -Name $IIS_SITE_NAME
Write-Host "Frontend deployed successfully" -ForegroundColor Green

# Cleanup
Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue

# 5. Verify Deployment
Write-Host "`n[5/5] Verifying deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "`nBackend Status:" -ForegroundColor Yellow
docker ps -f name=game-gallery-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`nFrontend Status:" -ForegroundColor Yellow
$site = Get-Website -Name $IIS_SITE_NAME
Write-Host "Site: $($site.Name) - State: $($site.State) - Bindings: $($site.Bindings.Collection.bindingInformation)" -ForegroundColor White

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost (or http://YOUR_SERVER_IP)" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  Health Check: http://localhost:8080/health" -ForegroundColor White
Write-Host "`nTo view logs:" -ForegroundColor Yellow
Write-Host "  docker logs game-gallery-backend" -ForegroundColor White
Write-Host "  docker logs -f game-gallery-backend  # Live logs" -ForegroundColor White
