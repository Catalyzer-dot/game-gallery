# Fix IIS 500 Error Script
# Run this script as Administrator

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "IIS 500 Error Fix Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$iisPath = "C:\inetpub\wwwroot\game-gallery"

# 1. Check if URL Rewrite module is installed
Write-Host "[1/3] Checking URL Rewrite Module..." -ForegroundColor Yellow

$rewriteModule = Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue

if (-not $rewriteModule) {
    Write-Host "! URL Rewrite Module is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "The URL Rewrite module is required for SPA routing." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install URL Rewrite Module (Recommended)" -ForegroundColor Cyan
    Write-Host "  Download from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor White
    Write-Host "  Or use Web Platform Installer" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use simplified web.config (Quick Fix)" -ForegroundColor Cyan
    Write-Host "  This script will create a basic web.config without URL rewrite" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Choose option (1 or 2, or press Enter to use Option 2)"

    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "Please install URL Rewrite Module first:" -ForegroundColor Yellow
        Write-Host "1. Download: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor White
        Write-Host "2. Install the downloaded MSI file" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 0
    }

    # Use Option 2: Create simplified web.config
    Write-Host ""
    Write-Host "Creating simplified web.config..." -ForegroundColor Cyan

} else {
    Write-Host "OK URL Rewrite Module is installed" -ForegroundColor Green
}

# 2. Backup existing web.config
Write-Host ""
Write-Host "[2/3] Backing up existing web.config..." -ForegroundColor Yellow

$webConfigPath = Join-Path $iisPath "web.config"
if (Test-Path $webConfigPath) {
    $backupPath = "$webConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $webConfigPath $backupPath
    Write-Host "OK Backup created: $backupPath" -ForegroundColor Green
} else {
    Write-Host "No existing web.config found" -ForegroundColor White
}

# 3. Create appropriate web.config
Write-Host ""
Write-Host "[3/3] Creating web.config..." -ForegroundColor Yellow

if ($rewriteModule) {
    # Full web.config with URL Rewrite
    $webConfigContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
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
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
        </staticContent>
        <httpErrors errorMode="Custom" existingResponse="Replace">
            <remove statusCode="404" />
            <error statusCode="404" path="/" responseMode="ExecuteURL" />
        </httpErrors>
    </system.webServer>
</configuration>
'@
    Write-Host "Creating web.config with URL Rewrite support..." -ForegroundColor Cyan
} else {
    # Simplified web.config without URL Rewrite
    $webConfigContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
        </staticContent>
        <httpErrors errorMode="Detailed" />
        <defaultDocument>
            <files>
                <clear />
                <add value="index.html" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
'@
    Write-Host "Creating simplified web.config..." -ForegroundColor Cyan
    Write-Host "NOTE: Client-side routing may not work without URL Rewrite module" -ForegroundColor Yellow
}

$webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8 -Force
Write-Host "OK web.config created" -ForegroundColor Green

# 4. Test local access
Write-Host ""
Write-Host "Testing local access..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing
    Write-Host "OK Website accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Fix Complete!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Try accessing the website again:" -ForegroundColor Yellow
    Write-Host "  http://localhost" -ForegroundColor Cyan
    Write-Host "  http://172.22.144.1" -ForegroundColor Cyan
    Write-Host "  http://172.16.0.5" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "ERROR: Still cannot access website: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking IIS event logs..." -ForegroundColor Yellow
    $events = Get-WinEvent -LogName "Microsoft-IIS-Configuration/Operational" -MaxEvents 5 -ErrorAction SilentlyContinue
    if ($events) {
        Write-Host "Recent IIS events:" -ForegroundColor White
        $events | ForEach-Object {
            Write-Host "  [$($_.TimeCreated)] $($_.Message)" -ForegroundColor White
        }
    }
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. File permissions on $iisPath" -ForegroundColor White
    Write-Host "2. IIS Application Pool status" -ForegroundColor White
    Write-Host "3. Windows Event Viewer > Windows Logs > Application" -ForegroundColor White
}

Write-Host ""
