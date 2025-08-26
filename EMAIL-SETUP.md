# Email Configuration Setup Guide

## IMPORTANT: You need to configure email credentials to receive notifications

The server is set up to send email notifications to `brettanya.brown@upingtonmainz.com` when booking forms are submitted, but you need to provide the email password.

## Step 1: Update Email Credentials

Edit `server.js` and find this section (around line 37):

```javascript
auth: {
    user: 'brettanya.brown@upingtonmainz.com', // Replace with actual email
    pass: 'YOUR_EMAIL_PASSWORD_HERE' // Replace with actual password
},
```

Replace `YOUR_EMAIL_PASSWORD_HERE` with the actual password for brettanya.brown@upingtonmainz.com

## Step 2: Email Provider Options

### Option A: Outlook/Office 365 (Current Setup)
- Works with most business email accounts
- Uses smtp.office365.com
- Port 587 with TLS

### Option B: Gmail (Alternative)
If you prefer Gmail, uncomment the Gmail section in server.js:

```javascript
emailTransporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'brettanya.brown@upingtonmainz.com',
        pass: 'YOUR_GMAIL_APP_PASSWORD' // Generate app password in Gmail settings
    }
});
```

**For Gmail:** You need to:
1. Enable 2-factor authentication
2. Generate an "App Password" in Gmail settings
3. Use the app password (not your regular password)

## Step 3: Test the Configuration

1. Update the password in server.js
2. Restart the server: `node server.js`
3. Submit a test booking form
4. Check for email in brettanya.brown@upingtonmainz.com

## Security Note

For production, consider using environment variables instead of hardcoding passwords:

```javascript
auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
}
```

## Troubleshooting

If emails are not working:
1. Check the server console for error messages
2. Verify email credentials are correct
3. Check spam/junk folder
4. For Outlook: Make sure "less secure apps" or app passwords are enabled
5. For Gmail: Make sure 2FA is enabled and you're using an app password

## Current Status

- ❌ Email credentials need to be configured
- ✅ Email templates and sending logic are ready
- ✅ Notifications will be sent to: brettanya.brown@upingtonmainz.com
- ✅ Form submissions work without email (backup to localStorage)
