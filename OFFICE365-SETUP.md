# Office 365 App Password Setup Guide

## Why You Need an App Password

The error "SmtpClientAuthentication is disabled for the Tenant" often means you need to use an App Password instead of your regular password when Multi-Factor Authentication (MFA) is enabled.

## Steps to Create an App Password

1. **Go to Microsoft 365 Security**:
   - Visit https://security.microsoft.com
   - Sign in with brettanya.brown@upingtonmainz.com

2. **Navigate to Authentication Methods**:
   - Go to "Users" → "Authentication methods"
   - Or directly: https://mysignins.microsoft.com/security-info

3. **Create App Password**:
   - Click "Add method"
   - Select "App password"
   - Enter a name like "Upington Mainz Booking System"
   - Copy the generated password (it will only show once!)

4. **Set Environment Variable** (Recommended):
   ```powershell
   # In PowerShell, set the environment variable:
   $env:M365_APP_PASSWORD = "your-app-password-here"
   
   # Then start the server:
   node server.js
   ```

5. **Or Update server.js Directly**:
   Replace this line in server.js:
   ```javascript
   pass: process.env.M365_APP_PASSWORD || 'Rubmyclituntilicum89$!'
   ```
   With:
   ```javascript
   pass: 'your-generated-app-password-here'
   ```

## Alternative: Enable SMTP AUTH (Admin Required)

If you have admin access to the Microsoft 365 tenant:

1. **Exchange Admin Center**:
   - Go to https://admin.exchange.microsoft.com
   - Navigate to "Mail flow" → "Authentication policies"

2. **Enable SMTP AUTH**:
   - Create new policy or edit default
   - Enable "SMTP AUTH" for required users

3. **Per-User Setting**:
   - Go to "Recipients" → "Mailboxes"
   - Select brettanya.brown@upingtonmainz.com
   - "Manage email apps settings"
   - Enable "Authenticated SMTP"

## Test the Configuration

After setting up the App Password:
1. Restart the server: `node server.js`
2. Look for: "✅ Email server is ready to send notifications"
3. Test by submitting a booking form
4. Check brettanya.brown@upingtonmainz.com for the email

## Current Server Configuration

The server now uses:
- ✅ Modern TLS negotiation (no custom ciphers)
- ✅ requireTLS: true for security
- ✅ Environment variable support for App Password
- ✅ Fallback to hardcoded password if env var not set

## Security Note

For production, always use environment variables for passwords:
```powershell
# Set permanently in Windows:
setx M365_APP_PASSWORD "your-app-password"
```
