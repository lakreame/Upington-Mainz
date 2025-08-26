# Create App Password for BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com

## Step-by-Step Instructions

### 1. **Enable Multi-Factor Authentication (MFA) First**
   - App Passwords require MFA to be enabled
   - Go to: https://account.microsoft.com/security
   - Sign in with: brettanya.brown@upingtonmainz.com
   - Click "Advanced security options"
   - Turn on "Two-step verification" if not already enabled

### 2. **Create App Password - Updated Paths**

**Option A: Microsoft Account Security (Most Common)**
   - Visit: https://account.microsoft.com/security
   - Sign in with: BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com
   - Click "Advanced security options"
   - Scroll down to find "App passwords" section
   - Click "Create a new app password"
   - Name: "Upington Mainz Email Server"

**Option B: Office 365 Security Portal**
   - Visit: https://mysignins.microsoft.com/security-info
   - Sign in with: brettanya.brown@upingtonmainz.com
   - Look for "Add method" or "Add sign-in method"
   - Select "App password" from dropdown

**Option C: Azure Portal**
   - Visit: https://portal.azure.com
   - Go to "Azure Active Directory" → "Users"
   - Find your user → "Authentication methods"
   - Add "App password"

### 4. **Update Server Configuration**
   - Replace the password in server.js with the App Password
   - Keep username as: brettanya.brown@upingtonmainz.com
   - Use App Password (not regular password)

## Important Notes
- App Password looks like: "abcd-efgh-ijkl-mnop"
- Use this password in place of your regular password
- App Passwords work even when regular password changes
- More secure than enabling SMTP AUTH for whole tenant

## What to Do After Creating Password
1. Copy the generated App Password
2. Update server.js with this password
3. Restart the Node server
4. Test email notifications
