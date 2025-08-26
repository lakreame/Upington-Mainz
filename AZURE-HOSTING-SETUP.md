# Azure Hosting Setup for upingtonmainz.com

## Overview
You have a Node.js backend with static frontend files that need to be hosted on Azure with your custom domain from Namecheap.

## Recommended Azure Hosting Options

### Option 1: Azure Static Web Apps + Azure Functions (RECOMMENDED)
**Best for:** Frontend + serverless backend
**Cost:** Very low (free tier available)
**Benefits:** 
- Automatic HTTPS
- Global CDN
- Built-in authentication
- Serverless scaling

### Option 2: Azure App Service
**Best for:** Full-stack applications
**Cost:** ~$13-55/month
**Benefits:**
- Supports Node.js directly
- Easy deployment
- Built-in domain management

### Option 3: Azure Container Apps
**Best for:** Containerized applications
**Cost:** Pay-per-use
**Benefits:**
- Modern serverless containers
- Auto-scaling
- Multiple environments

## Step-by-Step Setup for Azure Static Web Apps (Recommended)

### Prerequisites
1. Azure account (you already have this)
2. GitHub repository (we'll create one)
3. Domain connected to Azure (you have this)

### Step 1: Install Azure CLI
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

### Step 2: Prepare Your Code Structure
Your current structure needs minor adjustments:

```
/
├── index.html              # Main site files
├── admin.html
├── book.html
├── features.html
├── pricing.html
├── testimonials.html
├── assets/                 # Static assets
├── js/
└── api/                    # Create this folder
    └── appointments.js     # Move server.js logic here
```

### Step 3: Convert Backend to Azure Functions

Create `api/appointments.js`:
```javascript
const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    context.log('Appointment request received');
    
    // Your existing server.js email logic goes here
    // But adapted for Azure Functions format
    
    if (req.method === 'POST') {
        const { name, email, phone, service, date, time, notes } = req.body;
        
        // Email configuration (same as your server.js)
        const transporter = nodemailer.createTransporter({
            service: 'outlook',
            auth: {
                user: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
                pass: process.env.EMAIL_PASSWORD // Set in Azure
            }
        });
        
        try {
            await transporter.sendMail({
                from: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
                to: 'brettanya.brown@upingtonmainz.com',
                subject: `New Appointment Request - ${service}`,
                html: `
                    <h2>New Appointment Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Notes:</strong> ${notes}</p>
                `
            });
            
            context.res = {
                status: 200,
                body: { success: true, message: 'Appointment request sent successfully!' }
            };
        } catch (error) {
            context.log.error('Email error:', error);
            context.res = {
                status: 500,
                body: { success: false, message: 'Failed to send appointment request.' }
            };
        }
    } else {
        context.res = {
            status: 405,
            body: 'Method not allowed'
        };
    }
};
```

### Step 4: Create Azure Function Configuration

Create `api/package.json`:
```json
{
  "name": "upington-mainz-api",
  "version": "1.0.0",
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

Create `host.json`:
```json
{
  "version": "2.0",
  "functionTimeout": "00:05:00",
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  }
}
```

### Step 5: Update Frontend API Calls

Update your frontend JavaScript to call Azure Functions:
```javascript
// Instead of: fetch('/api/appointments', ...)
// Use: fetch('/api/appointments', ...)
// Azure Static Web Apps automatically routes /api/* to your functions
```

### Step 6: Deploy to Azure

#### Option A: Deploy via Azure Portal (Easiest)
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Static Web Apps"
3. Click "Create"
4. Choose your subscription and resource group
5. Enter app name: `upington-mainz-app`
6. Select "Custom" for deployment source
7. Upload your files

#### Option B: Deploy via GitHub (Recommended for CI/CD)
1. Create GitHub repository
2. Push your code
3. Create Static Web App and connect to GitHub
4. Azure will auto-deploy on every push

### Step 7: Configure Custom Domain

1. In Azure Portal, go to your Static Web App
2. Navigate to "Custom domains"
3. Click "Add custom domain"
4. Enter: `upingtonmainz.com`
5. Choose "Custom domain on Azure DNS" (since you said Azure is connected)
6. Follow the verification steps

### Step 8: Set Environment Variables

1. In your Static Web App settings
2. Go to "Configuration"
3. Add application setting:
   - Name: `EMAIL_PASSWORD`
   - Value: `[Your email password]`

### Step 9: Update Azure AD App Registration

Update your redirect URIs to include:
- `https://upingtonmainz.com/admin.html`
- Remove localhost URLs for production

## Alternative: Azure App Service Setup

If you prefer to keep your current Node.js structure:

### Step 1: Create App Service
```bash
# After installing Azure CLI
az login
az webapp create --resource-group [your-rg] --plan [your-plan] --name upington-mainz --runtime "NODE|18-lts"
```

### Step 2: Deploy Code
```bash
# From your project directory
az webapp deployment source config-zip --resource-group [your-rg] --name upington-mainz --src deployment.zip
```

### Step 3: Configure Environment Variables
```bash
az webapp config appsettings set --resource-group [your-rg] --name upington-mainz --settings EMAIL_PASSWORD="[your-password]"
```

### Step 4: Add Custom Domain
```bash
az webapp config hostname add --webapp-name upington-mainz --resource-group [your-rg] --hostname upingtonmainz.com
```

## DNS Configuration (Namecheap Side)

Since you mentioned Azure is connected to your domain, verify these DNS records in Namecheap:

### For Static Web Apps:
```
Type: CNAME
Host: www
Value: [your-static-web-app].azurestaticapps.net

Type: CNAME  
Host: @
Value: [your-static-web-app].azurestaticapps.net
```

### For App Service:
```
Type: CNAME
Host: www  
Value: [your-app-name].azurewebsites.net

Type: A
Host: @
Value: [App Service IP - get from Azure]
```

## Cost Estimates

### Azure Static Web Apps:
- **Free Tier:** 0.5 GB storage, 100 GB bandwidth/month
- **Standard:** $9/month for additional features

### Azure App Service:
- **Basic B1:** ~$13/month
- **Standard S1:** ~$55/month

## Security Considerations

1. **Environment Variables:** Store email passwords in Azure configuration, not in code
2. **HTTPS:** Automatic with both options
3. **Authentication:** Already configured with Azure AD
4. **CORS:** Configure for your domain only

## Monitoring and Logs

1. Enable Application Insights
2. Set up alerts for failures
3. Monitor performance metrics

## Next Steps

1. Choose your preferred option (Static Web Apps recommended)
2. Install Azure CLI
3. Restructure code if using Static Web Apps
4. Deploy and test
5. Configure custom domain
6. Update Azure AD redirect URIs

## Support

- Azure Documentation: https://docs.microsoft.com/azure/
- Static Web Apps Guide: https://docs.microsoft.com/azure/static-web-apps/
- App Service Guide: https://docs.microsoft.com/azure/app-service/

---

**Recommendation:** Start with Azure Static Web Apps for the best performance, lowest cost, and easiest management for your use case.
