# SharePoint Integration Troubleshooting Guide

## Current Issue
You're experiencing authentication errors when trying to connect to SharePoint:
- "Cannot read properties of undefined (reading 'GetContextWebInformation')"
- "Cannot read properties of undefined (reading 'results')"

## Step-by-Step Resolution

### 1. Azure AD App Registration Setup

1. **Go to Azure Portal** (portal.azure.com)
2. **Navigate to**: Azure Active Directory > App registrations
3. **Create new registration** or find your existing one:
   - Name: "Upington Mainz SharePoint App"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Add your website URLs (e.g., `http://localhost` for testing)

4. **Copy these values** from the Overview page:
   - Application (client) ID
   - Directory (tenant) ID

### 2. Configure API Permissions

1. **In your app registration**, go to "API permissions"
2. **Add permissions**:
   - **SharePoint**: Sites.FullControl.All (or Sites.ReadWrite.All)
   - **Microsoft Graph**: Sites.ReadWrite.All
3. **Grant admin consent** for all permissions

### 3. Update Configuration

1. **Edit** `js/sharepoint-config.js`
2. **Replace** the placeholder values:
   ```javascript
   clientId: 'your-actual-client-id-from-azure',
   tenantId: 'your-actual-tenant-id-from-azure'
   ```

### 4. Test with Debug Tool

1. **Open** `sharepoint-debug.html` in your browser
2. **Follow the step-by-step testing**:
   - Configuration check should pass
   - Authentication should work
   - Site access should succeed
   - Lists access should find your lists

### 5. Common Issues and Solutions

#### Issue: "AADSTS50011: The reply URL specified in the request does not match"
**Solution**: Add your current URL to redirect URIs in Azure AD app

#### Issue: "AADSTS65001: The user or administrator has not consented"
**Solution**: Grant admin consent for API permissions in Azure AD

#### Issue: "Access denied" or 403 errors
**Solution**: Check SharePoint site permissions and API permissions

#### Issue: Lists not found
**Solution**: Verify list names match exactly (case-sensitive)

### 6. SharePoint Lists Verification

Ensure your SharePoint site has these lists with correct names:
- **Clients** (with columns: Email, Phone, DateOfBirth, InsuranceType, Status)
- **Appointments** (with columns: ClientName, ClientEmail, AppointmentDate, AppointmentTime, Method, Types, Status, Notes)
- **Leads** (with columns: Email, Phone, Source, Status, InterestType, Notes)
- **Policies** (with columns: ClientId, PolicyNumber, InsuranceType, StartDate, ExpirationDate)

### 7. Browser Console Debugging

1. **Open browser developer tools** (F12)
2. **Check console** for detailed error messages
3. **Look for**:
   - Authentication flow messages
   - API request URLs
   - Response errors

### 8. Testing Sequence

1. **Start with** `sharepoint-debug.html`
2. **Verify each step** passes before moving to the next
3. **Only use the main forms** after debug tool shows all green

## Enhanced Error Handling

The SharePoint Manager now includes better error handling and logging:
- Detailed console messages for debugging
- Graceful fallbacks for authentication
- Comprehensive error reporting
- Safe handling of undefined responses

## Next Steps

1. **Update your Azure AD app** with correct permissions
2. **Configure** `js/sharepoint-config.js` with real values
3. **Test with** `sharepoint-debug.html`
4. **Once working**, use the main booking form and admin dashboard

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your SharePoint site URL is accessible
3. Ensure you have admin permissions on the SharePoint site
4. Try the debug tool with different authentication methods
