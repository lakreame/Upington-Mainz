# Microsoft 365 SMTP Authentication Setup Guide

## Current Issue
Your Office 365 tenant has SMTP authentication disabled, which is blocking email notifications.

**Error:** `SmtpClientAuthentication is disabled for the Tenant`

## Solution Options

### Option 1: Enable SMTP AUTH in Microsoft 365 Admin Center

1. **Sign into Microsoft 365 Admin Center**
   - Go to https://admin.microsoft.com
   - Sign in with admin credentials

2. **Access Exchange Admin Center**
   - Click "Admin centers" → "Exchange"
   - Or go directly to https://admin.exchange.microsoft.com

3. **Enable SMTP Authentication**
   - Navigate to "Mail flow" → "Authentication policies"
   - Create new policy or edit default
   - Enable "SMTP AUTH" checkbox

4. **Enable for Specific Mailbox**
   - Go to "Recipients" → "Mailboxes"
   - Find and select: info@upingtonmainz.com
   - Click "Manage email apps settings"
   - Turn ON "Authenticated SMTP"
   - Save changes

### Option 2: Use OAuth2 Authentication (More Secure)

Instead of basic authentication, we can configure OAuth2:

1. **Register App in Azure AD**
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Create new app registration
   - Note Client ID and create Client Secret

2. **Configure API Permissions**
   - Add Microsoft Graph permissions:
     - Mail.Send
     - User.Read
   - Grant admin consent

3. **Update Server Configuration**
   - Use OAuth2 instead of basic auth
   - More secure and compliant

### Option 3: Use Alternative Email Service

For immediate solution, use a different email service:

**Gmail Business Account:**
- Create Gmail account for notifications
- Enable 2FA and create App Password
- Update server.js with Gmail SMTP

**SendGrid/Mailgun:**
- Business email services with APIs
- More reliable for transactional emails
- Better delivery rates

## Recommended Steps

1. **Immediate:** Try Option 1 (enable SMTP AUTH)
2. **Long-term:** Implement Option 2 (OAuth2) for better security
3. **Backup:** Set up Option 3 (alternative service) as fallback

## Testing

After enabling SMTP AUTH:
1. Restart the Node.js server
2. Submit a test booking form
3. Check email delivery to brettanya.brown@upingtonmainz.com

## Need Help?

If you don't have admin access to Microsoft 365:
- Contact your IT administrator
- They need to enable SMTP AUTH for your tenant
- Provide them this error message and the link: https://aka.ms/smtp_auth_disabled
