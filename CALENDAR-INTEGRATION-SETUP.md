# Outlook Calendar Integration Setup

## 🚨 Azure AD App Registration Configuration Required

Your calendar integration failed because the Azure AD app registration needs additional permissions.

### Step 1: Add Calendar Permissions in Azure Portal

1. Go to **Azure Portal** (portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find your app: `ccd7cc4d-1ee9-47a5-986e-cd615e0695ad`
4. Click on **API permissions**
5. Click **+ Add a permission**
6. Select **Microsoft Graph**
7. Choose **Delegated permissions**
8. Find and add these permissions:
   - ✅ `Calendars.ReadWrite` (Create and manage calendar events)
   - ✅ `Calendars.ReadWrite.Shared` (Optional: for shared calendars)

### Step 2: Grant Admin Consent
1. After adding permissions, click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm

### Step 3: Test the Integration
1. Restart the admin dashboard
2. Approve an appointment
3. The system will now create calendar events automatically

## 📅 What the Calendar Integration Does

When you approve an appointment:
1. ✅ **Updates SharePoint** - Changes status to "Scheduled"
2. ✅ **Sends Email** - Notification to brettanya.brown@upingtonmainz.com
3. 🆕 **Creates Calendar Event** - Automatically adds to your Outlook calendar with:
   - Client details and contact info
   - Appointment type and meeting method
   - 30-minute reminder
   - Client as attendee (they'll get calendar invite too)

## 🔧 Troubleshooting

### Error: "Insufficient privileges to complete the operation"
- **Solution**: Grant calendar permissions in Azure AD (steps above)

### Error: "AADSTS65001: The user or administrator has not consented"
- **Solution**: Grant admin consent for the new permissions

### Error: "Invalid audience"
- **Solution**: Ensure redirect URI includes your localhost URL

## 📋 Current Configuration Status

- ✅ SharePoint integration working
- ✅ Email notifications working 
- ⚠️ Calendar integration requires Azure AD permission setup
- ✅ Authentication with security defaults disabled

## 🚀 Alternative: Manual Calendar Export

If Azure permissions cannot be configured, appointments can still be exported as .ics files for manual import to Outlook.
