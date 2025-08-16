# Azure Function App Configuration Guide

## Email Not Working in Production - Solution

Your Azure Function is correctly set up but missing the EMAIL_PASSWORD environment variable.

## Steps to Fix:

### 1. Go to Azure Portal
- Open https://portal.azure.com
- Find your Function App (likely named something like "upington-mainz-func")

### 2. Configure Application Settings
- In your Function App, go to Settings > Configuration
- Click "New application setting"
- Add these settings:

**Setting 1:**
- Name: `EMAIL_PASSWORD` 
- Value: `Zharayuri100@`

**Setting 2 (Optional for Storage):**
- Name: `AZURE_STORAGE_CONNECTION_STRING`
- Value: Your storage connection string (if you want to store submissions)

### 3. Save and Restart
- Click "Save" at the top
- The Function App will restart automatically

## Current Status:
- ✅ Azure Function code is correct
- ✅ Email configuration is set up  
- ❌ Missing EMAIL_PASSWORD environment variable
- ❌ Function can't authenticate with Office 365 SMTP

## Test After Configuration:
1. Submit a test appointment through your live website
2. Check Function App logs in Azure portal (Monitor > Logs)
3. You should receive email at brettanya.brown@upingtonmainz.com

## Alternative Quick Fix:
If you don't want to use environment variables, you can temporarily hardcode the password in the Azure Function (less secure but works immediately).

## Function App URL:
Your appointment submissions should be going to:
`https://your-function-app.azurewebsites.net/api/submit-appointment`
