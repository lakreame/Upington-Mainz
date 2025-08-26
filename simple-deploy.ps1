# Simple Azure Static Web App Deployment Script
# This bypasses Git issues and deploys directly

Write-Host "🚀 Starting deployment to Azure Static Web Apps..." -ForegroundColor Green

# Your deployment details
$deploymentToken = "042a3f12b7f778650c0d8d98de1126eac1f43c9efa4e6186799b15bdfd12ef2c01-45389771-eea1-45ae-a914-ed94bc2bd685010152503910cf10"
$appName = "upington-mainz-app"

# Verify files exist
Write-Host "✅ Checking deployment package..." -ForegroundColor Yellow
if (Test-Path "deployment.zip") {
    Write-Host "✅ deployment.zip found!" -ForegroundColor Green
} else {
    Write-Host "❌ deployment.zip not found. Creating it now..." -ForegroundColor Red
    
    # Create deployment package
    Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
    $filesToInclude = @(
        "admin.html",
        "book.html", 
        "features.html",
        "index.html",
        "pricing.html",
        "testimonials.html",
        "assets",
        "js",
        "api",
        "host.json",
        "package.json"
    )
    
    $existingFiles = @()
    foreach ($file in $filesToInclude) {
        if (Test-Path $file) {
            $existingFiles += $file
            Write-Host "  ✅ Found: $file" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Missing: $file" -ForegroundColor Yellow
        }
    }
    
    if ($existingFiles.Count -gt 0) {
        Compress-Archive -Path $existingFiles -DestinationPath "deployment.zip" -Force
        Write-Host "✅ Created deployment.zip with $($existingFiles.Count) items" -ForegroundColor Green
    } else {
        Write-Host "❌ No files found to deploy!" -ForegroundColor Red
        exit 1
    }
}

# Method 1: Try Azure CLI (if logged in)
Write-Host "🔐 Trying Azure CLI deployment..." -ForegroundColor Yellow
try {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # Check if logged in
    $loginCheck = az account show 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure CLI is logged in" -ForegroundColor Green
        
        # Try to deploy using az staticwebapp
        Write-Host "📤 Attempting deployment..." -ForegroundColor Yellow
        az staticwebapp environment set-functions --name $appName --environment-name default --resource-group "upington-mainz-rg" --subscription "45389771-eea1-45ae-a914-ed94bc2bd685"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Azure CLI deployment successful!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Azure CLI deployment failed, trying alternative method..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Azure CLI not logged in, trying alternative method..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Azure CLI not available, trying alternative method..." -ForegroundColor Yellow
}

# Method 2: PowerShell REST API with deployment token
Write-Host "🌐 Trying REST API deployment..." -ForegroundColor Yellow

try {
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes("deployment.zip")
    $fileData = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"deployment.zip`"",
        "Content-Type: application/zip$LF",
        $fileData,
        "--$boundary--$LF"
    ) -join $LF
    
    $uri = "https://upington-mainz-app.scm.azurestaticapps.net/api/zipdeploy"
    
    Write-Host "📤 Uploading to: $uri" -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary" -Headers @{
        "Authorization" = "Bearer $deploymentToken"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    Write-Host "✅ REST API deployment successful!" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ REST API deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Method 3: Manual instructions
    Write-Host "" -ForegroundColor White
    Write-Host "📋 MANUAL DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Cyan
    Write-Host "Since automatic deployment failed, here's how to deploy manually:" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "1. Extract deployment.zip to a folder" -ForegroundColor Yellow
    Write-Host "2. Go to: https://portal.azure.com" -ForegroundColor Yellow
    Write-Host "3. Search for 'upington-mainz-app'" -ForegroundColor Yellow
    Write-Host "4. In your Static Web App, look for 'Functions' or 'API' section" -ForegroundColor Yellow
    Write-Host "5. Upload the 'api' folder contents" -ForegroundColor Yellow
    Write-Host "6. Upload the HTML files (admin.html, index.html, etc.) to the root" -ForegroundColor Yellow
    Write-Host "7. Upload the 'assets' and 'js' folders" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "🌐 Your site will be available at:" -ForegroundColor Green
    Write-Host "https://ambitious-water-03910cf10.azurestaticapps.net" -ForegroundColor Cyan
}

Write-Host "" -ForegroundColor White
Write-Host "🎯 Next Steps After Deployment:" -ForegroundColor Cyan
Write-Host "1. Set EMAIL_PASSWORD environment variable in Azure Portal" -ForegroundColor Yellow
Write-Host "2. Test the website functionality" -ForegroundColor Yellow
Write-Host "3. Configure custom domain (upingtonmainz.com)" -ForegroundColor Yellow

Write-Host "" -ForegroundColor White
Write-Host "✨ Deployment script completed!" -ForegroundColor Green
