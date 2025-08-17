# Azure Function Deployment Script
# Run this script to deploy the SharePoint proxy function to Azure

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "upington-mainz-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppName = "upington-mainz-functions",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName = "upingtonmainzstorage"
)

Write-Host "🚀 Starting Azure Function deployment for Upington Mainz SharePoint Integration" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version --output tsv --query '"azure-cli"' 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI not found"
    }
    Write-Host "✅ Azure CLI found (version: $azVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not installed. Please install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check if Functions Core Tools is installed
try {
    $funcVersion = func --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Functions Core Tools not found"
    }
    Write-Host "✅ Azure Functions Core Tools found (version: $funcVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure Functions Core Tools not installed. Installing..." -ForegroundColor Yellow
    npm install -g azure-functions-core-tools@4
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Azure Functions Core Tools. Please install manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔐 Logging into Azure..." -ForegroundColor Blue

# Login to Azure
az login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Azure" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully logged into Azure" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "📁 Creating resource group: $ResourceGroupName" -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created/verified" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

# Create storage account
Write-Host "💾 Creating storage account: $StorageAccountName" -ForegroundColor Blue
az storage account create --name $StorageAccountName --location $Location --resource-group $ResourceGroupName --sku Standard_LRS
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage account created/verified" -ForegroundColor Green
} else {
    Write-Host "⚠️ Storage account creation failed or already exists" -ForegroundColor Yellow
}

# Create function app
Write-Host "⚡ Creating function app: $FunctionAppName" -ForegroundColor Blue
az functionapp create --resource-group $ResourceGroupName --consumption-plan-location $Location --runtime node --runtime-version 18 --functions-version 4 --name $FunctionAppName --storage-account $StorageAccountName
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function app created/verified" -ForegroundColor Green
} else {
    Write-Host "⚠️ Function app creation failed or already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Please configure the following environment variables in Azure Portal:" -ForegroundColor Yellow
Write-Host "   Function App: $FunctionAppName" -ForegroundColor White
Write-Host "   Configuration > Application Settings:" -ForegroundColor White
Write-Host "   • SHAREPOINT_CLIENT_ID: ccd7cc4d-1ee9-47a5-986e-cd615e0695ad" -ForegroundColor Cyan
Write-Host "   • SHAREPOINT_CLIENT_SECRET: [Your Azure AD App Secret]" -ForegroundColor Cyan
Write-Host "   • SHAREPOINT_TENANT_ID: [Your Azure AD Tenant ID]" -ForegroundColor Cyan
Write-Host ""

$deploy = Read-Host "Do you want to deploy the function code now? (y/n)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "📦 Deploying function code..." -ForegroundColor Blue
    
    # Navigate to azure-functions directory
    Set-Location "azure-functions"
    
    # Install dependencies
    Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
    npm install
    
    # Deploy function
    Write-Host "🚀 Deploying to Azure..." -ForegroundColor Blue
    func azure functionapp publish $FunctionAppName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your SharePoint proxy endpoint:" -ForegroundColor Green
        Write-Host "   https://$FunctionAppName.azurewebsites.net/api/sharepoint" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔗 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Configure environment variables in Azure Portal" -ForegroundColor White
        Write-Host "   2. Grant admin consent for Azure AD app permissions" -ForegroundColor White
        Write-Host "   3. Test the SharePoint connection in your admin dashboard" -ForegroundColor White
    } else {
        Write-Host "❌ Function deployment failed" -ForegroundColor Red
    }
    
    # Return to original directory
    Set-Location ".."
} else {
    Write-Host "⏸️ Skipping function deployment. You can deploy later using:" -ForegroundColor Yellow
    Write-Host "   cd azure-functions" -ForegroundColor White
    Write-Host "   func azure functionapp publish $FunctionAppName" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
