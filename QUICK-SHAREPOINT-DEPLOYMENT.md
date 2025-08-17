# Quick SharePoint Integration Deployment

This guide will help you deploy the SharePoint integration for the Upington Mainz admin dashboard.

## 🚀 Option 1: Quick Azure Function Deployment (Recommended)

### Prerequisites
- Azure account with active subscription
- PowerShell (Windows) or Bash (Linux/Mac)
- Git installed

### Step 1: Run Deployment Script

Open PowerShell as Administrator and run:

```powershell
# Navigate to your project directory
cd "C:\Users\re2bl\source\repos\Upington-Mainz"

# Run the deployment script
.\deploy-azure-function.ps1
```

The script will:
- Install Azure CLI (if needed)
- Install Azure Functions Core Tools
- Create Azure resources
- Deploy the SharePoint proxy function

### Step 2: Configure Environment Variables

1. Open Azure Portal (https://portal.azure.com)
2. Navigate to **Function Apps** > **upington-mainz-functions**
3. Go to **Configuration** > **Application settings**
4. Add these settings:

```
SHAREPOINT_CLIENT_ID = ccd7cc4d-1ee9-47a5-986e-cd615e0695ad
SHAREPOINT_CLIENT_SECRET = [Your Azure AD App Secret]
SHAREPOINT_TENANT_ID = [Your Azure AD Tenant ID]
```

### Step 3: Grant Permissions

1. Go to Azure Portal > **Azure Active Directory** > **App registrations**
2. Find your app: `ccd7cc4d-1ee9-47a5-986e-cd615e0695ad`
3. Click **API permissions** > **Add a permission**
4. Select **SharePoint** > **Application permissions**
5. Add: `Sites.FullControl.All`
6. Click **Grant admin consent**

### Step 4: Test Connection

1. Open your admin dashboard: https://upingtonmainz.com/complete-admin.html
2. Navigate to **SharePoint Test** section
3. Click **Test SharePoint Connection**
4. Should show "✅ SharePoint connection successful!"

---

## 🔧 Option 2: Manual Setup (If PowerShell fails)

### Install Azure CLI

```bash
# Windows (using winget)
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

### Install Azure Functions Core Tools

```bash
npm install -g azure-functions-core-tools@4
```

### Deploy Function Manually

```bash
# Login to Azure
az login

# Create resource group
az group create --name upington-mainz-rg --location eastus

# Create storage account
az storage account create --name upingtonmainzstorage --location eastus --resource-group upington-mainz-rg --sku Standard_LRS

# Create function app
az functionapp create --resource-group upington-mainz-rg --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name upington-mainz-functions --storage-account upingtonmainzstorage

# Deploy function code
cd azure-functions
npm install
func azure functionapp publish upington-mainz-functions
```

---

## 🛠️ Troubleshooting

### Issue: "Azure CLI not found"
**Solution:** Install Azure CLI from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

### Issue: "Functions Core Tools not found"
**Solution:** Run `npm install -g azure-functions-core-tools@4`

### Issue: "Function app name already exists"
**Solution:** Change the function app name in the deployment script to something unique

### Issue: "SharePoint connection still fails"
**Solutions:**
1. Check environment variables are set correctly
2. Verify Azure AD app permissions are granted
3. Ensure the function app is running (check Azure Portal)
4. Try the manual SharePoint test section for debugging

### Issue: "Permission denied"
**Solution:** Run PowerShell as Administrator

---

## 📊 Verifying Success

After deployment, you should see:

1. **Azure Portal:**
   - Resource group: `upington-mainz-rg`
   - Function app: `upington-mainz-functions`
   - Storage account: `upingtonmainzstorage`

2. **Admin Dashboard:**
   - SharePoint Test shows "✅ Connected"
   - Mode shows "Azure Function Proxy (connected)"
   - Sync buttons work without errors

3. **Data Flow:**
   - Add a client → automatically syncs to SharePoint
   - Refresh from SharePoint → loads real data
   - No CORS errors in browser console

---

## 📞 Getting Help

If you encounter issues:

1. Check the Azure Function logs in Azure Portal
2. Open browser Developer Tools (F12) and check Console for errors
3. Try the "Advanced: Manual SharePoint Access Test" section
4. Review the SHAREPOINT-INTEGRATION-GUIDE.md for detailed troubleshooting

## 🎯 Next Steps

Once SharePoint integration is working:

1. **Create SharePoint Lists:** Set up the required lists in your SharePoint site
2. **Data Migration:** Use the sync buttons to migrate existing data
3. **Team Training:** Show team members how to use the new features
4. **Backup Strategy:** Set up regular data backups from SharePoint

Your SharePoint integration will now handle:
- ✅ Real-time data sync
- ✅ CORS bypass via Azure Function
- ✅ Secure authentication
- ✅ Automatic failover to localStorage if SharePoint is unavailable
