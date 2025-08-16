# 📧 Email Configuration Checklist

## ✅ Current Email Setup Status

### **Azure Function Configuration:**
- **SMTP Host:** `smtp.office365.com` ✅
- **Port:** `587` ✅
- **Authentication:** Office 365 credentials ✅
- **From Email:** `BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com` ✅
- **To Email:** `brettanya.brown@upingtonmainz.com` ✅

### **Template Features:**
- ✅ Includes Insurance Type (Medicare, Life, Health, Annuities)
- ✅ Includes Appointment Type (Initial Consultation, Follow-up, etc.)
- ✅ Client contact details with clickable links
- ✅ Meeting preferences and location info
- ✅ Direct link to admin dashboard
- ✅ Professional HTML formatting

### **Security Improvements Made:**
- ✅ Removed hardcoded password fallback
- ✅ Now requires `EMAIL_PASSWORD` environment variable
- ✅ Added error checking for missing password

## 🔧 **Required Azure Configuration:**

### **1. Set Environment Variable in Azure:**
You need to configure the `EMAIL_PASSWORD` environment variable in your Azure Function App:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Function App: `upington-mainz-app`
3. Go to **Settings** → **Configuration**
4. Under **Application Settings**, add:
   - **Name:** `EMAIL_PASSWORD`
   - **Value:** `Zharayuri100@`
5. Click **Save**

### **2. Test Email Functionality:**
After deployment, test by:
1. Submitting a booking form on https://upingtonmainz.com/book.html
2. Check if email arrives at `brettanya.brown@upingtonmainz.com`
3. Verify the email includes both Insurance Type and Appointment Type

### **3. Monitor Function Logs:**
To check if emails are working:
1. Go to Azure Portal → Function App → Functions → submit-appointment
2. Click **Monitor** to see function execution logs
3. Look for messages like:
   - `✅ Email sent successfully`
   - `❌ Email sending failed`

## 📋 **Email Template Preview:**

```
Subject: 🆕 New Appointment Request - [Client Name]

New Appointment Request Received!

Client Details:
• Name: John Smith
• Email: john@example.com
• Phone: (555) 123-4567

Appointment Details:
• Insurance Type: Medicare Health Plan
• Appointment Type: Initial Consultation
• Preferred Date: 2025-08-20
• Preferred Time: 14:00
• Meeting Type: Phone

Location:
• Address: 123 Main St, Atlanta, GA 30309
• County: Fulton

Submitted: 8/16/2025, 2:30:15 PM

Please log into your admin dashboard to review and respond to this request:
🔗 https://upingtonmainz.com/admin.html
```

## ⚠️ **Troubleshooting:**

### **If Emails Don't Send:**
1. Check Azure Function logs for error messages
2. Verify EMAIL_PASSWORD is set correctly in Azure
3. Confirm the email password is still valid
4. Check if Office 365 account has any security restrictions

### **If Wrong Data in Emails:**
The booking form now correctly separates:
- **Insurance Type:** What insurance they want (Medicare, Life, etc.)
- **Appointment Type:** What kind of meeting (Consultation, Review, etc.)

Both will appear separately in the email notification.

## ✅ **Ready for Deployment:**
All email configuration improvements are ready to deploy. The system will now:
1. Send professional emails with proper data separation
2. Include direct admin dashboard links
3. Use secure environment variables only
4. Provide clear error messages if misconfigured
