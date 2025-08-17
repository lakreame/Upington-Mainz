# SharePoint Integration Solution

This document outlines the complete solution for integrating SharePoint with the Upington Mainz admin dashboard.

## Problem: CORS Restrictions

When accessing SharePoint REST API directly from a browser, you'll encounter CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature that prevents websites from making requests to different domains.

## Solutions

### Option 1: Azure Function Proxy (Recommended)

**Pros:**
- Handles authentication server-side
- Bypasses CORS restrictions
- Secure token management
- Scalable solution

**Setup Steps:**

1. **Deploy Azure Function**
   ```bash
   # Install Azure Functions Core Tools
   npm install -g azure-functions-core-tools@4
   
   # Navigate to azure-functions directory
   cd azure-functions
   
   # Install dependencies
   npm install
   
   # Deploy to Azure
   func azure functionapp publish upington-mainz-functions
   ```

2. **Configure Environment Variables**
   In Azure Portal > Function App > Configuration > Application Settings:
   - `SHAREPOINT_CLIENT_ID`: Your Azure AD app client ID
   - `SHAREPOINT_CLIENT_SECRET`: Your Azure AD app client secret
   - `SHAREPOINT_TENANT_ID`: Your Azure AD tenant ID

3. **Update Admin Dashboard**
   The dashboard will automatically use the Azure Function URL for SharePoint calls.

### Option 2: SharePoint Add-in with CORS Configuration

**Setup Steps:**

1. **Create SharePoint Add-in**
   - Register app in SharePoint Admin Center
   - Configure permissions for full control
   - Add your domain to allowed origins

2. **Update App Manifest**
   ```xml
   <AppPermissionRequests AllowAppOnlyPolicy="true">
     <AppPermissionRequest Scope="http://sharepoint/content/sitecollection" Right="FullControl" />
   </AppPermissionRequests>
   ```

### Option 3: Microsoft Graph API (Current Implementation)

**Pros:**
- Microsoft's recommended approach
- Better permission management
- More secure

**Cons:**
- Still has CORS limitations
- Requires proper authentication flow

## Current Implementation Status

### Working Features ✅
- Simple username/password authentication
- Client, appointment, lead, and policy management
- Data persistence in localStorage
- Responsive mobile design
- Dashboard with real-time updates

### SharePoint Integration Status 🔄
- Configuration files created
- Azure Function proxy created
- Graph API endpoints configured
- Awaiting Azure Function deployment

## Next Steps

1. **Deploy Azure Function** (Recommended)
   ```powershell
   # Install Azure CLI if not already installed
   # https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   
   # Login to Azure
   az login
   
   # Create resource group (if not exists)
   az group create --name upington-mainz-rg --location eastus
   
   # Create function app
   az functionapp create --resource-group upington-mainz-rg --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name upington-mainz-functions --storage-account upingtonmainzstorage
   
   # Deploy function
   cd azure-functions
   func azure functionapp publish upington-mainz-functions
   ```

2. **Configure Azure AD App Permissions**
   - Navigate to Azure Portal > Azure AD > App Registrations
   - Find your app (ID: ccd7cc4d-1ee9-47a5-986e-cd615e0695ad)
   - Add API permissions:
     - SharePoint > Sites.FullControl.All
     - Microsoft Graph > Sites.ReadWrite.All
   - Grant admin consent

3. **Test SharePoint Connection**
   - Use the SharePoint Test section in the admin dashboard
   - Verify data can be read from and written to SharePoint lists

## Alternative: Immediate Working Solution

If you prefer not to set up Azure Functions immediately, we can implement a **PowerShell-based data sync** solution:

1. **Manual Data Export/Import**
   - Export data from admin dashboard as JSON
   - Use PowerShell scripts to import to SharePoint
   - Schedule regular sync operations

2. **Local Development Server**
   - Run a local Node.js proxy server
   - Handle SharePoint authentication server-side
   - Use for development and testing

Would you like me to implement any of these solutions?

## Files Created

- `/azure-functions/sharepoint-proxy/function.json` - Azure Function configuration
- `/azure-functions/sharepoint-proxy/index.js` - Proxy function implementation
- `/azure-functions/package.json` - Dependencies
- `/azure-functions/host.json` - Function app configuration

## Testing

Once deployed, your SharePoint API calls will use:
```
https://upington-mainz-functions.azurewebsites.net/api/sharepoint/{endpoint}
```

Instead of direct SharePoint URLs, bypassing CORS restrictions.
