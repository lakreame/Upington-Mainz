# SharePoint Connection Test Script
# This script tests various methods to connect to SharePoint Online

Write-Host "=== SharePoint Connection Test ===" -ForegroundColor Green
Write-Host "Testing connection to: https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz" -ForegroundColor Yellow

# Test 1: Basic HTTP connectivity
Write-Host "`n1. Testing basic HTTP connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://upingtonmainzllc1.sharepoint.com" -Method Head -TimeoutSec 10
    Write-Host "✅ SharePoint site is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: SharePoint Online Management Shell (if installed)
Write-Host "`n2. Testing SharePoint Online PowerShell module..." -ForegroundColor Cyan
if (Get-Module -ListAvailable -Name "Microsoft.Online.SharePoint.PowerShell") {
    Write-Host "✅ SharePoint Online PowerShell module is available" -ForegroundColor Green
    
    # Prompt for credentials
    Write-Host "Enter your SharePoint Online admin credentials:" -ForegroundColor Yellow
    $credential = Get-Credential
    
    try {
        Import-Module Microsoft.Online.SharePoint.PowerShell
        Connect-SPOService -Url "https://upingtonmainzllc1-admin.sharepoint.com" -Credential $credential
        
        $site = Get-SPOSite -Identity "https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz"
        Write-Host "✅ SharePoint site found:" -ForegroundColor Green
        Write-Host "   Title: $($site.Title)" -ForegroundColor White
        Write-Host "   URL: $($site.Url)" -ForegroundColor White
        Write-Host "   Storage Used: $($site.StorageUsageCurrent) MB" -ForegroundColor White
        
        Disconnect-SPOService
    } catch {
        Write-Host "❌ SharePoint Online PowerShell connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ SharePoint Online PowerShell module not installed" -ForegroundColor Yellow
    Write-Host "To install: Install-Module -Name Microsoft.Online.SharePoint.PowerShell" -ForegroundColor Gray
}

# Test 3: PnP PowerShell (if installed)
Write-Host "`n3. Testing PnP PowerShell module..." -ForegroundColor Cyan
if (Get-Module -ListAvailable -Name "PnP.PowerShell") {
    Write-Host "✅ PnP PowerShell module is available" -ForegroundColor Green
    
    try {
        Import-Module PnP.PowerShell
        
        # Interactive login
        Connect-PnPOnline -Url "https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz" -Interactive
        
        $web = Get-PnPWeb
        Write-Host "✅ PnP connection successful:" -ForegroundColor Green
        Write-Host "   Site Title: $($web.Title)" -ForegroundColor White
        Write-Host "   Site URL: $($web.Url)" -ForegroundColor White
        
        # Test list access
        $lists = Get-PnPList
        Write-Host "   Available Lists:" -ForegroundColor White
        foreach ($list in $lists) {
            if ($list.Title -in @("Clients", "Appointments", "Leads", "Policies")) {
                Write-Host "     ✅ $($list.Title) (Items: $($list.ItemCount))" -ForegroundColor Green
            } else {
                Write-Host "     📋 $($list.Title)" -ForegroundColor Gray
            }
        }
        
        Disconnect-PnPOnline
    } catch {
        Write-Host "❌ PnP PowerShell connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ PnP PowerShell module not installed" -ForegroundColor Yellow
    Write-Host "To install: Install-Module -Name PnP.PowerShell" -ForegroundColor Gray
}

# Test 4: REST API with credentials
Write-Host "`n4. Testing SharePoint REST API..." -ForegroundColor Cyan
Write-Host "Enter your SharePoint credentials for REST API test:" -ForegroundColor Yellow
$restCredential = Get-Credential

try {
    $securePassword = $restCredential.Password
    $credential = New-Object System.Management.Automation.PSCredential($restCredential.UserName, $securePassword)
    
    $uri = "https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz/_api/web"
    $response = Invoke-RestMethod -Uri $uri -Method Get -Credential $credential -Headers @{"Accept"="application/json;odata=verbose"}
    
    Write-Host "✅ REST API connection successful:" -ForegroundColor Green
    Write-Host "   Site Title: $($response.d.Title)" -ForegroundColor White
    Write-Host "   Site Description: $($response.d.Description)" -ForegroundColor White
    Write-Host "   Created: $($response.d.Created)" -ForegroundColor White
    
} catch {
    Write-Host "❌ REST API connection failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "If all tests failed, check:" -ForegroundColor Yellow
Write-Host "1. SharePoint site URL is correct" -ForegroundColor Gray
Write-Host "2. User has proper permissions" -ForegroundColor Gray
Write-Host "3. Multi-factor authentication settings" -ForegroundColor Gray
Write-Host "4. Conditional access policies" -ForegroundColor Gray

Read-Host "Press Enter to exit"
