# Azure Portal Deployment - Step by Step

✅ **Prerequisites Complete:**
- Azure CLI installed (restart PowerShell later to use it)
- deployment.zip created
- Azure Portal opened

## Step-by-Step Deployment via Azure Portal

### Step 1: Create Static Web App
1. In Azure Portal, click **"Create a resource"**
2. Search for **"Static Web Apps"**
3. Click **"Create"**

### Step 2: Basic Configuration
Fill in these details:
- **Subscription:** Choose your subscription
- **Resource Group:** Create new → `upington-mainz-rg`
- **Name:** `upington-mainz-app`
- **Plan type:** `Free`
- **Azure Functions and staging details:** `East US 2`
- **Source:** Select `Other`

### Step 3: Review and Create
1. Click **"Review + create"**
2. Click **"Create"**
3. Wait for deployment to complete (1-2 minutes)

### Step 4: Upload Your Files
1. Go to your new Static Web App resource
2. Click **"Browse"** to see the default page
3. In the left menu, click **"Overview"**
4. Click **"Manage deployment token"** → Copy the token

### Step 5: Deploy Your Files
Since you've restarted PowerShell, let's try Azure CLI first:

**Option A: Using Azure Cloud Shell (You have this open!)**
Azure Cloud Shell is already authenticated! Follow these steps:

1. **First, create your Static Web App:**
```bash
# Create resource group
az group create --name upington-mainz-rg --location eastus2

# Create Static Web App
az staticwebapp create \
  --name upington-mainz-app \
  --resource-group upington-mainz-rg \
  --location eastus2 \
  --source https://github.com/placeholder/repo \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "/"
```

2. **Upload your deployment.zip file to Cloud Shell:**
   - Click the upload button in Cloud Shell toolbar
   - Upload your `deployment.zip` file from your local computer

3. **Deploy the files:**
```bash
# Extract and deploy
unzip deployment.zip -d deployment/
# Note: We'll set up GitHub integration instead for easier management
```

**Option B: If CLI still doesn't work - Use GitHub Integration**
1. Create a new GitHub repository for your project
2. Upload your files to GitHub
3. In Azure Portal, go back to your Static Web App
4. Click **"Deployment"** in the left menu
5. Click **"GitHub"** and connect your repository
6. Azure will automatically deploy from GitHub

**Option C: Manual Upload via VS Code Extension**
1. Install "Azure Static Web Apps" extension in VS Code
2. Right-click on your project folder
3. Select "Deploy to Static Web App"

### Step 6: Configure Environment Variables
1. In your Static Web App, click **"Configuration"**
2. Click **"Application settings"**
3. Click **"+ Add"**
4. Add these settings:
   ```
   Name: EMAIL_PASSWORD
   Value: Zharayuri100@
   ```
5. Click **"Save"**

### Step 7: Configure Custom Domain
1. In your Static Web App, click **"Custom domains"**
2. Click **"+ Add"**
3. Select **"Custom domain on other DNS"**
4. Enter domain: `upingtonmainz.com`
5. Copy the verification records shown

### Step 8: Update Namecheap DNS
In your Namecheap domain management:

**Add these DNS records:**
```
Type: TXT
Host: @
Value: [verification code from Azure]

Type: CNAME  
Host: www
Value: [your-app-name].azurestaticapps.net

Type: CNAME
Host: @
Value: [your-app-name].azurestaticapps.net
```

### Step 9: Update Azure AD Redirect URIs
1. Go to Azure Portal → Azure Active Directory
2. App registrations → Your app
3. Authentication → Redirect URIs
4. Update to include:
   - `https://upingtonmainz.com/admin.html`
   - `https://www.upingtonmainz.com/admin.html`
   - Keep: `http://localhost:3000/admin.html` (for development)

## If Upload Doesn't Work in Portal

### Alternative: Use REST API
```powershell
# After restarting PowerShell and Azure CLI works:
az rest --method post \
  --url "https://[your-app].scm.azurestaticapps.net/api/zipdeploy" \
  --headers "Content-Type=application/zip" \
  --body @deployment.zip
```

### Alternative: GitHub Integration
1. Create GitHub repository
2. Push your files to GitHub
3. In Static Web App creation, choose GitHub as source
4. Connect your repository

## Verification Steps

After deployment:
1. ✅ Visit your app URL: `https://[your-app].azurestaticapps.net`
2. ✅ Test appointment booking form
3. ✅ Check email notifications
4. ✅ Test admin dashboard login
5. ✅ Verify custom domain works

## Troubleshooting

**If Functions Don't Work:**
- Check that `api/` folder was uploaded correctly
- Verify environment variables are set
- Check function logs in Azure Portal

**If Custom Domain Fails:**
- Verify DNS propagation (can take up to 24 hours)
- Check TXT record for domain verification
- Ensure CNAME records point to correct Static Web App URL

## Next Steps After Deployment

1. **Test Everything:** Make sure all features work on the live site
2. **Calendar Permissions:** Add Calendars.ReadWrite permission in Azure AD
3. **SSL Certificate:** Azure provides this automatically
4. **Monitoring:** Set up Application Insights for monitoring

## Cost Monitoring

Your Static Web App should be **FREE** under these limits:
- 100 GB bandwidth/month
- 0.5 GB storage
- 2 custom domains

Monitor usage in Azure Portal → Your Static Web App → Metrics

---

**Current Status:** Ready to deploy!
- ✅ Files prepared in `deployment.zip`
- ✅ Azure Portal opened
- ✅ Deployment guide ready

**Next Action:** Follow the steps above to create your Static Web App!
