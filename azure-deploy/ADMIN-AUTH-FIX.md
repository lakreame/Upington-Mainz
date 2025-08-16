# 🔧 Admin Authentication Fix Guide

## **Current Errors Identified:**

### **Error 1: AADSTS500111 - Invalid Scheme**
- **Location**: Debug/Local testing
- **Issue**: Reply URI has invalid scheme
- **Solution**: Add correct redirect URIs to Azure AD app

### **Error 2: AADSTS70011 - Invalid Scope** 
- **Location**: Live site
- **Issue**: Malformed scope combining User.Read with SharePoint URL
- **Solution**: Use proper Microsoft Graph scopes

## **🔗 Step 1: Fix Redirect URIs in Azure AD**

**Azure Portal Link**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/ccd7cc4d-1ee9-47a5-986e-cd615e0695ad

**Add these Redirect URIs:**
```
https://upingtonmainz.com/admin.html
https://upingtonmainz.com/admin-troubleshoot.html
http://localhost:8080/admin.html
http://localhost:3000/admin.html
```

**Steps:**
1. Click "Add a platform" or "Add URI"
2. Select "Single-page application (SPA)"
3. Add each URL above
4. Click "Save"

## **🔑 Step 2: Verify API Permissions**

**Required Permissions:**
- ✅ **Microsoft Graph**: `Sites.ReadWrite.All` (Application)
- ✅ **Microsoft Graph**: `User.Read` (Delegated)
- ✅ **Microsoft Graph**: `Calendars.ReadWrite` (Delegated)

**Important**: Click "Grant admin consent" after adding permissions!

## **📊 Step 3: Check SharePoint Site Access**

1. Visit: https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz
2. Ensure you can access the site directly
3. If you get access denied, you need to be added as a site member/owner

## **🔄 Step 4: Clear Browser Cache**

The invalid scope error might be caused by cached authentication attempts:

1. **Chrome/Edge**: Press Ctrl+Shift+Delete
2. Select "All time" 
3. Check "Cookies and other site data"
4. Click "Clear data"
5. Try accessing admin page again

## **🧪 Step 5: Test Authentication**

After making the changes above:

1. **Test locally**: http://localhost:8080/admin-troubleshoot.html
2. **Test live**: https://upingtonmainz.com/admin-troubleshoot.html
3. **Test admin**: https://upingtonmainz.com/admin.html

## **📝 Additional Notes**

- The SharePoint Manager is already configured with correct scopes
- The issue is likely in Azure AD app configuration, not the code
- Both errors are authentication configuration issues, not code bugs

## **🆘 If Still Having Issues**

1. Check browser developer console for detailed error messages
2. Try in incognito/private browsing mode
3. Try a different browser
4. Verify your user account has access to the Azure AD tenant and SharePoint site
