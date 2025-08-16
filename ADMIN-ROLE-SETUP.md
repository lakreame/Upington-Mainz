# Azure Static Web Apps Role Assignment Guide

## Issue: Admin Page Shows "401: Unauthorized"

Even though you're the Azure subscription owner, Azure Static Web Apps has its own role system that needs to be configured separately.

## Solution: Assign Admin Role in Azure Static Web Apps

### Step 1: Open Azure Portal
1. Go to https://portal.azure.com
2. Navigate to your Static Web App (likely named "polite-tree-xxx" or similar)

### Step 2: Configure Role Management
1. In your Static Web App, go to **Settings > Role management**
2. Click **"Invite"** button
3. Fill in the invitation form:
   - **Authentication provider**: Choose your provider (GitHub, Azure AD, etc.)
   - **Invitee details**: Enter your email or GitHub username
   - **Domain**: Leave as default or enter your domain
   - **Role**: Select **"admin"** (this matches our staticwebapp.config.json)
   - **Hours until expiration**: Set to a high number like 8760 (1 year)

### Step 3: Accept the Invitation
1. You'll receive an invitation link
2. Click the link and accept the invitation
3. This will assign you the "admin" role

### Step 4: Test Access
1. Try accessing https://upingtonmainz.com/admin.html again
2. You may need to clear browser cache or use incognito mode

## Alternative: Use Azure AD Integration

If you prefer to use your existing Azure AD account:

### Step 1: Enable Azure AD Authentication
1. In Static Web App settings, go to **Authentication**
2. Add **Azure Active Directory** as an identity provider
3. Configure it to use your existing Azure AD tenant

### Step 2: Assign Role via Azure AD
1. Go to **Role management**
2. Invite using your Azure AD email
3. Select "admin" role

## Quick Test Method
You can also temporarily remove the role restriction to test if everything else works, then add it back.

## Current Configuration
Your staticwebapp.config.json currently requires:
```json
{
  "route": "/admin.html",
  "allowedRoles": ["admin"]
}
```

This means only users with the "admin" role can access the admin page.

## Next Steps
1. Follow the role assignment steps above
2. Test admin page access
3. If needed, we can modify the configuration to use Azure RBAC roles instead
