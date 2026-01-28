# IIS Website Status Check Script
# Run this on Windows Server to diagnose connection issues

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "IIS Website Status Checker" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check IIS Service
Write-Host "[1/6] Checking IIS Service..." -ForegroundColor Yellow
$iisService = Get-Service W3SVC -ErrorAction SilentlyContinue
if ($iisService) {
    Write-Host "IIS Service Status: $($iisService.Status)" -ForegroundColor $(if ($iisService.Status -eq 'Running') { 'Green' } else { 'Red' })
    if ($iisService.Status -ne 'Running') {
        Write-Host "! IIS is not running. Starting..." -ForegroundColor Yellow
        Start-Service W3SVC
    }
} else {
    Write-Host "ERROR: IIS service not found!" -ForegroundColor Red
}

# 2. Check Website Status
Write-Host ""
Write-Host "[2/6] Checking Website Status..." -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction SilentlyContinue

$siteName = "game-gallery"
$website = Get-Website -Name $siteName -ErrorAction SilentlyContinue

if ($website) {
    Write-Host "Website: $siteName" -ForegroundColor White
    Write-Host "  State: $($website.State)" -ForegroundColor $(if ($website.State -eq 'Started') { 'Green' } else { 'Red' })
    Write-Host "  Physical Path: $($website.PhysicalPath)" -ForegroundColor White
    Write-Host "  Bindings: $($website.Bindings.Collection.bindingInformation)" -ForegroundColor White

    if ($website.State -ne 'Started') {
        Write-Host "! Website is not started. Starting..." -ForegroundColor Yellow
        Start-Website -Name $siteName
    }
} else {
    Write-Host "ERROR: Website '$siteName' not found!" -ForegroundColor Red
    Write-Host "Please run setup-windows-server.ps1 first" -ForegroundColor Yellow
}

# 3. Check Files Exist
Write-Host ""
Write-Host "[3/6] Checking Deployed Files..." -ForegroundColor Yellow
$iisPath = "C:\inetpub\wwwroot\game-gallery"

if (Test-Path $iisPath) {
    $indexFile = Join-Path $iisPath "index.html"
    if (Test-Path $indexFile) {
        Write-Host "OK index.html exists" -ForegroundColor Green
        $fileCount = (Get-ChildItem -Path $iisPath -Recurse | Measure-Object).Count
        Write-Host "Total files: $fileCount" -ForegroundColor White
    } else {
        Write-Host "ERROR: index.html not found!" -ForegroundColor Red
        Write-Host "Please run deploy-manual.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: IIS directory not found: $iisPath" -ForegroundColor Red
}

# 4. Check Firewall Rules
Write-Host ""
Write-Host "[4/6] Checking Firewall Rules..." -ForegroundColor Yellow

$httpRule = Get-NetFirewallRule -DisplayName "HTTP (Port 80)" -ErrorAction SilentlyContinue
if ($httpRule) {
    Write-Host "Firewall Rule: HTTP (Port 80)" -ForegroundColor White
    Write-Host "  Enabled: $($httpRule.Enabled)" -ForegroundColor $(if ($httpRule.Enabled -eq 'True') { 'Green' } else { 'Red' })
    Write-Host "  Action: $($httpRule.Action)" -ForegroundColor White

    if ($httpRule.Enabled -ne 'True') {
        Write-Host "! Firewall rule is disabled. Enabling..." -ForegroundColor Yellow
        Enable-NetFirewallRule -DisplayName "HTTP (Port 80)"
    }
} else {
    Write-Host "WARNING: Firewall rule for HTTP not found" -ForegroundColor Yellow
    Write-Host "Creating firewall rule..." -ForegroundColor Cyan
    New-NetFirewallRule -DisplayName "HTTP (Port 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
    Write-Host "OK Firewall rule created" -ForegroundColor Green
}

# 5. Check Port Listening
Write-Host ""
Write-Host "[5/6] Checking Port 80 Listener..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue

if ($port80) {
    Write-Host "OK Port 80 is listening" -ForegroundColor Green
    Write-Host "  Process ID: $($port80.OwningProcess)" -ForegroundColor White
    $process = Get-Process -Id $port80.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "  Process Name: $($process.Name)" -ForegroundColor White
    }
} else {
    Write-Host "ERROR: Nothing is listening on port 80!" -ForegroundColor Red
}

# 6. Get Network Information
Write-Host ""
Write-Host "[6/6] Network Information..." -ForegroundColor Yellow

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'}

Write-Host "Server IP Addresses:" -ForegroundColor White
foreach ($ip in $ipAddresses) {
    Write-Host "  $($ip.IPAddress) ($($ip.InterfaceAlias))" -ForegroundColor Cyan
}

# 7. Test Local Access
Write-Host ""
Write-Host "Testing Local Access..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing
    Write-Host "OK Local access successful (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Local access failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Diagnostic Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($iisService.Status -eq 'Running' -and $website.State -eq 'Started' -and $port80) {
    Write-Host "Status: IIS is running correctly on this server" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you still cannot access from external network:" -ForegroundColor Yellow
    Write-Host "1. Check cloud provider security groups (Aliyun, Tencent Cloud, etc.)" -ForegroundColor White
    Write-Host "   - Open port 80 for inbound traffic" -ForegroundColor White
    Write-Host ""
    Write-Host "2. If accessing from local network:" -ForegroundColor White
    Write-Host "   - Try: http://localhost" -ForegroundColor Cyan
    foreach ($ip in $ipAddresses) {
        Write-Host "   - Try: http://$($ip.IPAddress)" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "3. If this is a cloud server, you may need to use the PUBLIC IP" -ForegroundColor White
    Write-Host "   - 172.22.x.x is typically a PRIVATE IP address" -ForegroundColor Yellow
    Write-Host "   - Check your cloud provider dashboard for the public IP" -ForegroundColor White
} else {
    Write-Host "Status: Issues detected, see above for details" -ForegroundColor Red
}

Write-Host ""
