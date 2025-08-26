# Azure Deployment Script for Upington Mainz
# Run this script to deploy your website to Azure Static Web Apps

Write-Host "🚀 Azure Deployment Script for Upington Mainz" -ForegroundColor Green
Write-Host "=" * 60

# Check if Azure CLI is installed
try {
    $azVersion = az --version 2>$null
    if ($azVersion) {
        Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Azure CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Azure CLI: https://aka.ms/installazurecliwindows"
    Write-Host "Or run: winget install Microsoft.AzureCLI"
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
az login

# Set variables
$RESOURCE_GROUP = "upington-mainz-rg"
$STATIC_WEB_APP = "upington-mainz-app"
$LOCATION = "eastus"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Resource Group: $RESOURCE_GROUP"
Write-Host "   App Name: $STATIC_WEB_APP"
Write-Host "   Location: $LOCATION"

# Create resource group if it doesn't exist
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Static Web App
Write-Host "🌐 Creating Azure Static Web App..." -ForegroundColor Yellow
$staticAppInfo = az staticwebapp create `
    --name $STATIC_WEB_APP `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --source https://github.com/yourusername/upington-mainz `
    --branch main `
    --app-location "/" `
    --api-location "api" `
    --output-location "/" | ConvertFrom-Json

if ($staticAppInfo) {
    Write-Host "✅ Static Web App created successfully!" -ForegroundColor Green
    Write-Host "🔗 URL: $($staticAppInfo.defaultHostname)" -ForegroundColor Cyan
    
    # Get deployment token
    $deploymentToken = az staticwebapp secrets list --name $STATIC_WEB_APP --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv
    
    Write-Host "🔑 Deployment token retrieved" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Static Web App" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor Yellow
az staticwebapp appsettings set `
    --name $STATIC_WEB_APP `
    --resource-group $RESOURCE_GROUP `
    --setting-names EMAIL_PASSWORD="Zharayuri100@"

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Instructions for custom domain
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload your files to the Static Web App"
Write-Host "2. Configure custom domain upingtonmainz.com:"
Write-Host "   az staticwebapp hostname set --name $STATIC_WEB_APP --resource-group $RESOURCE_GROUP --hostname upingtonmainz.com"
Write-Host "3. Update DNS records in Namecheap:"
Write-Host "   CNAME: www -> $($staticAppInfo.defaultHostname)"
Write-Host "   CNAME: @ -> $($staticAppInfo.defaultHostname)"

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
Write-Host "🔗 Access your app at: https://$($staticAppInfo.defaultHostname)" -ForegroundColor Cyan
