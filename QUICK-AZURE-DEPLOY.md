# Quick Azure Static Web App Deployment Guide

## Option 1: Deploy via Azure Portal (Easiest - Recommended)

### Step 1: Install Azure CLI
```powershell
# Download and install from: https://aka.ms/installazurecliwindows
# Or use winget:
winget install Microsoft.AzureCLI
```

### Step 2: Prepare Files for Upload
Create a deployment folder with these files:
```
deployment/
├── index.html
├── admin.html  
├── book.html
├── features.html
├── pricing.html
├── testimonials.html
├── assets/
├── js/
├── api/
└── host.json
```

### Step 3: Create Static Web App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web Apps"
4. Click "Create"
5. Fill in details:
   - **Subscription:** Your subscription
   - **Resource Group:** Create new "upington-mainz-rg"
   - **Name:** upington-mainz-app
   - **Plan type:** Free
   - **Region:** East US 2
   - **Source:** Other (for manual upload)
6. Click "Review + create"
7. Click "Create"

### Step 4: Upload Your Files

1. Go to your Static Web App in Azure Portal
2. Click "Browse" to see your app
3. Click "Manage deployment token" to get upload credentials
4. Use Azure CLI to upload:

```powershell
# Login to Azure
az login

# Upload files
az staticwebapp environment create-zip-deploy \
  --name upington-mainz-app \
  --resource-group upington-mainz-rg \
  --source deployment.zip
```

### Step 5: Configure Environment Variables

1. In Azure Portal, go to your Static Web App
2. Click "Configuration" in the left menu
3. Add application setting:
   - **Name:** EMAIL_PASSWORD
   - **Value:** Zharayuri100@
4. Click "Save"

### Step 6: Add Custom Domain

1. In your Static Web App, click "Custom domains"
2. Click "Add"
3. Select "Custom domain on other DNS"
4. Enter: upingtonmainz.com
5. Copy the verification records
6. Add these to your Namecheap DNS:

**In Namecheap DNS:**
```
Type: TXT
Host: @
Value: [verification code from Azure]

Type: CNAME
Host: www
Value: [your-app-name].azurestaticapps.net

Type: CNAME
Host: @  
Value: [your-app-name].azurestaticapps.net
```

### Step 7: Update Azure AD Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Find your app registration
4. Click "Authentication"
5. Update redirect URIs:
   - Remove: http://localhost:3000/admin-sharepoint.html
   - Keep: http://localhost:3000/admin.html (for development)
   - Add: https://upingtonmainz.com/admin.html
   - Add: https://www.upingtonmainz.com/admin.html

## Option 2: Quick Deployment Script

Save this as `quick-deploy.ps1` and run it:

```powershell
# Quick deployment script
$resourceGroup = "upington-mainz-rg"
$appName = "upington-mainz-app"

# Login
az login

# Create resource group
az group create --name $resourceGroup --location "East US 2"

# Create static web app
az staticwebapp create \
  --name $appName \
  --resource-group $resourceGroup \
  --location "East US 2"

# Set environment variables  
az staticwebapp appsettings set \
  --name $appName \
  --resource-group $resourceGroup \
  --setting-names EMAIL_PASSWORD="Zharayuri100@"

Write-Host "✅ Deployment complete!"
Write-Host "🔗 Your app: https://$appName.azurestaticapps.net"
```

## File Upload Preparation

Run this to create a deployment package:

```powershell
# Create deployment folder
mkdir deployment
cp *.html deployment/
cp -r assets deployment/
cp -r js deployment/  
cp -r api deployment/
cp host.json deployment/

# Create zip for upload
Compress-Archive -Path deployment\* -DestinationPath deployment.zip

Write-Host "✅ deployment.zip ready for upload!"
```

## Cost Estimate

**Azure Static Web Apps Free Tier:**
- ✅ 100 GB bandwidth/month
- ✅ 0.5 GB storage
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Global CDN

**Estimated Monthly Cost: $0** (Free tier should be sufficient)

## Support

- Azure Static Web Apps: https://docs.microsoft.com/azure/static-web-apps/
- Custom Domains: https://docs.microsoft.com/azure/static-web-apps/custom-domain
- Environment Variables: https://docs.microsoft.com/azure/static-web-apps/application-settings
