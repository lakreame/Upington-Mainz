# Prepare files for Azure deployment
Write-Host "📦 Preparing Upington Mainz for Azure deployment..." -ForegroundColor Green

# Create deployment directory
if (Test-Path "deployment") {
    Remove-Item "deployment" -Recurse -Force
}
New-Item -ItemType Directory -Name "deployment" | Out-Null

# Copy HTML files
Write-Host "📄 Copying HTML files..." -ForegroundColor Yellow
Copy-Item "*.html" "deployment/" -Force

# Copy assets directory
Write-Host "🎨 Copying assets..." -ForegroundColor Yellow
if (Test-Path "assets") {
    Copy-Item "assets" "deployment/" -Recurse -Force
}

# Copy JavaScript directory
Write-Host "📜 Copying JavaScript files..." -ForegroundColor Yellow
if (Test-Path "js") {
    Copy-Item "js" "deployment/" -Recurse -Force
}

# Copy API directory
Write-Host "⚙️ Copying API functions..." -ForegroundColor Yellow
if (Test-Path "api") {
    Copy-Item "api" "deployment/" -Recurse -Force
}

# Copy configuration files
Write-Host "🔧 Copying configuration..." -ForegroundColor Yellow
if (Test-Path "host.json") {
    Copy-Item "host.json" "deployment/" -Force
}

# Create package.json for the root (for Azure Static Web Apps)
Write-Host "📋 Creating root package.json..." -ForegroundColor Yellow
$rootPackageJson = @{
    name = "upington-mainz"
    version = "1.0.0"
    description = "Upington Mainz Insurance Services Website"
    scripts = @{
        build = "echo 'No build required for static files'"
    }
} | ConvertTo-Json -Depth 3

$rootPackageJson | Out-File "deployment/package.json" -Encoding UTF8

# Create staticwebapp.config.json for routing
Write-Host "🔄 Creating Static Web App configuration..." -ForegroundColor Yellow
$staticWebAppConfig = @{
    routes = @(
        @{
            route = "/api/*"
            allowedRoles = @("anonymous")
        }
        @{
            route = "/admin.html"
            allowedRoles = @("anonymous")
        }
        @{
            route = "/*"
            serve = "/index.html"
            statusCode = 200
        }
    )
    navigationFallback = @{
        rewrite = "/index.html"
        exclude = @("/assets/*", "/js/*", "/api/*")
    }
    mimeTypes = @{
        ".json" = "application/json"
        ".js" = "application/javascript"
        ".css" = "text/css"
    }
} | ConvertTo-Json -Depth 4

$staticWebAppConfig | Out-File "deployment/staticwebapp.config.json" -Encoding UTF8

# Create deployment zip
Write-Host "🗜️ Creating deployment.zip..." -ForegroundColor Yellow
if (Test-Path "deployment.zip") {
    Remove-Item "deployment.zip" -Force
}

Compress-Archive -Path "deployment\*" -DestinationPath "deployment.zip"

# Show deployment summary
Write-Host ""
Write-Host "✅ Deployment package ready!" -ForegroundColor Green
Write-Host "📦 Files prepared in: deployment/" -ForegroundColor Cyan
Write-Host "🗜️ Deployment package: deployment.zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Azure Portal: https://portal.azure.com"
Write-Host "2. Create Static Web App (see QUICK-AZURE-DEPLOY.md)"
Write-Host "3. Upload deployment.zip to your Static Web App"
Write-Host "4. Configure custom domain upingtonmainz.com"
Write-Host ""

# List deployment contents
Write-Host "Deployment contents:" -ForegroundColor Cyan
Get-ChildItem "deployment" -Recurse | Select-Object Name, Length | Format-Table

Write-Host "Ready for Azure deployment!" -ForegroundColor Green
