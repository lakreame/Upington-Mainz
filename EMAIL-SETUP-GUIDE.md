# Email Notification Setup Guide

## Current Status
✅ **Form submissions working** - Data is saved to JSON file and SharePoint  
✅ **Email logging working** - Email details are logged to server console  
⚠️ **Email sending disabled** - Requires SMTP configuration  

## To Enable Real Email Notifications

### Option 1: Gmail Setup (Recommended)

1. **Create a Gmail account** (if you don't have one) or use existing business email

2. **Enable 2-Factor Authentication** in your Google Account

3. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

4. **Update server.js** (around line 32):
   ```javascript
   emailTransporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
           user: 'brettanya.brown@upingtonmainz.com', // Your Gmail
           pass: 'your-16-char-app-password'          // Generated app password
       }
   });
   ```

### Option 2: Business Email (Outlook/Exchange)

```javascript
emailTransporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: 'brettanya.brown@upingtonmainz.com',
        pass: 'your-email-password'
    }
});
```

### Option 3: Custom SMTP

```javascript
emailTransporter = nodemailer.createTransport({
    host: 'your-smtp-server.com',
    port: 587, // or 465 for SSL
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'your-email@yourdomain.com',
        pass: 'your-password'
    }
});
```

## Testing Email Setup

1. **Update the configuration** in `server.js`
2. **Restart the server**: `node server.js`
3. **Submit a test form** on the booking page
4. **Check server console** for success/error messages
5. **Check your email** for the notification

## Current Email Template

When configured, emails will be sent to `brettanya.brown@upingtonmainz.com` with:

- **Subject**: 🆕 New Appointment Request - [Client Name]
- **Content**: Client details, appointment preferences, contact info
- **Format**: Both plain text and HTML

## Security Notes

- Never commit real passwords to version control
- Use environment variables for production: `process.env.EMAIL_PASSWORD`
- Consider using app passwords instead of account passwords
- Test with a small volume first

## Support

If you need help with email setup, the current logging shows all email details in the server console, so you can manually follow up on appointments while email is being configured.
