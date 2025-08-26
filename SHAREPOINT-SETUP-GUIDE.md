# SharePoint Integration Setup Guide
# Upington Mainz Insurance Agency

This guide will help you set up SharePoint as a database alternative for managing your insurance agency's data.

## Prerequisites

1. Microsoft 365 Business or Enterprise subscription
2. SharePoint Online access
3. Azure Active Directory tenant
4. Global Administrator or SharePoint Administrator permissions

## Step 1: Create SharePoint Site

1. Go to SharePoint admin center (https://yourtenant-admin.sharepoint.com)
2. Click "Sites" → "Active sites" → "Create"
3. Choose "Team site" or "Communication site"
4. Site name: "Upington Mainz Insurance"
5. Site address: `/sites/UpingtonMainz`
6. Set appropriate permissions (Private or Public based on your needs)

## Step 2: Create SharePoint Lists

### Clients List
Create a new list called "Clients" with these columns:

- **Title** (Single line of text) - Client Name
- **Email** (Single line of text)
- **Phone** (Single line of text)
- **DateOfBirth** (Date and time)
- **InsuranceType** (Choice: Medicare, Health Insurance, Life Insurance)
- **Status** (Choice: Active, Inactive)
- **Address** (Multiple lines of text)
- **Notes** (Multiple lines of text)

### Appointments List
Create a new list called "Appointments" with these columns:

- **Title** (Single line of text) - Appointment Title
- **ClientName** (Single line of text)
- **ClientEmail** (Single line of text)
- **AppointmentDate** (Date and time)
- **AppointmentTime** (Single line of text)
- **Method** (Choice: In-Person, Phone, Video Call)
- **Types** (Choice: Consultation, Policy Review, New Application, Follow-up)
- **Status** (Choice: Scheduled, Completed, Cancelled, Rescheduled)
- **Notes** (Multiple lines of text)

### Leads List
Create a new list called "Leads" with these columns:

- **Title** (Single line of text) - Lead Name
- **Email** (Single line of text)
- **Phone** (Single line of text)
- **Source** (Choice: Website, Referral, Social Media, Advertisement)
- **Status** (Choice: New, Contacted, Qualified, Converted, Lost)
- **InterestType** (Choice: Medicare, Health Insurance, Life Insurance)
- **Notes** (Multiple lines of text)

### Policies List
Create a new list called "Policies" with these columns:

- **Title** (Single line of text) - Policy Title
- **ClientName** (Single line of text)
- **ClientId** (Number)
- **PolicyNumber** (Single line of text)
- **InsuranceType** (Choice: Medicare, Health Insurance, Life Insurance)
- **Provider** (Single line of text)
- **Premium** (Currency)
- **Status** (Choice: Active, Expired, Cancelled)
- **EffectiveDate** (Date and time)
- **ExpirationDate** (Date and time)

## Step 3: Register Azure AD Application

1. Go to Azure Portal (https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Application name: "Upington Mainz Admin Dashboard"
5. Supported account types: "Single tenant"
6. Redirect URI: `https://yourdomain.com` (your website domain)
7. Click "Register"

### Configure API Permissions
1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add these permissions:
   - Sites.ReadWrite.All
   - User.Read
6. Click "Grant admin consent"

### Get Application Details
Note down these values from your app registration:
- **Application (client) ID**
- **Directory (tenant) ID**

## Step 4: Configure the Admin Dashboard

1. Open `admin-sharepoint.html`
2. Update the SharePoint configuration in the JavaScript:

```javascript
const config = {
    siteUrl: 'https://yourtenant.sharepoint.com/sites/UpingtonMainz',
    clientId: 'your-application-client-id',
    tenantId: 'your-directory-tenant-id',
    lists: {
        clients: 'Clients',
        appointments: 'Appointments',
        leads: 'Leads',
        policies: 'Policies'
    }
};
```

Replace:
- `yourtenant` with your actual tenant name
- `your-application-client-id` with the Application ID from Step 3
- `your-directory-tenant-id` with the Directory ID from Step 3

## Step 5: Set Up Permissions

### SharePoint Site Permissions
1. Go to your SharePoint site
2. Click Settings gear → "Site permissions"
3. Add users/groups who need access:
   - **Owners**: Full control (You and other administrators)
   - **Members**: Edit access (Staff who need to modify data)
   - **Visitors**: Read access (View-only users)

### List-Level Permissions (Optional)
For enhanced security, you can set specific permissions on each list:
1. Go to each list → Settings → "Permissions for this list"
2. Stop inheriting permissions if needed
3. Grant specific permissions to different users/groups

## Step 6: Security Best Practices

### 1. Enable Multi-Factor Authentication
- Require MFA for all users accessing the admin dashboard
- Configure conditional access policies in Azure AD

### 2. Use Secure Connections
- Ensure your website uses HTTPS
- Configure proper CORS settings in Azure AD

### 3. Regular Backups
- Set up automated SharePoint backups
- Export list data regularly using PowerShell or Power Automate

### 4. Monitor Access
- Enable audit logging in SharePoint
- Review access logs regularly
- Set up alerts for suspicious activities

## Step 7: Advanced Features (Optional)

### Power Automate Integration
Create automated workflows for:
- Email notifications for new appointments
- Follow-up reminders for leads
- Policy renewal alerts

### Power BI Reporting
Connect Power BI to SharePoint lists for:
- Sales dashboards
- Client analytics
- Performance metrics

### Microsoft Teams Integration
- Create a Teams channel for your agency
- Add SharePoint lists as tabs in Teams
- Enable notifications and collaboration

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify client ID and tenant ID are correct
   - Check redirect URI matches exactly
   - Ensure API permissions are granted

2. **Access Denied**
   - Verify user has appropriate SharePoint permissions
   - Check if site/list permissions are correctly configured
   - Ensure Azure AD app has necessary permissions

3. **CORS Errors**
   - Add your domain to Azure AD app's redirect URIs
   - Configure proper CORS settings in SharePoint

### Getting Help

- Microsoft 365 Support: https://support.microsoft.com
- SharePoint Community: https://techcommunity.microsoft.com/t5/sharepoint/ct-p/SharePoint
- Azure AD Documentation: https://docs.microsoft.com/azure/active-directory/

## Maintenance

### Regular Tasks
- Review and update user permissions monthly
- Check for software updates and security patches
- Monitor storage usage and clean up old data
- Test backup and restore procedures

### Performance Optimization
- Regularly review list performance (SharePoint lists work best with <5000 items)
- Consider archiving old data
- Use indexed columns for frequently searched fields
- Implement content types for better organization

## Cost Considerations

- SharePoint Online is included with most Microsoft 365 business plans
- Additional storage can be purchased if needed
- Power Automate and Power BI may require separate licensing
- Consider the total cost of ownership vs. traditional database solutions

## Next Steps

1. Complete the setup following this guide
2. Test the admin dashboard with sample data
3. Train your staff on the new system
4. Gradually migrate existing data to SharePoint
5. Set up monitoring and maintenance procedures

For technical support with implementation, consider engaging a Microsoft certified partner or consultant.
