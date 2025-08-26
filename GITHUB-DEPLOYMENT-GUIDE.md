# GitHub + Azure Static Web Apps Deployment Guide

Since Azure CLI needs additional setup, let's use GitHub for deployment - this is actually the recommended approach!

## Quick GitHub Deployment Method

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click **"New repository"**
3. Name it: `upington-mainz-website`
4. Make it **Public** (required for free Static Web Apps)
5. Click **"Create repository"**

### Step 2: Upload Your Files to GitHub

**Option A: Using GitHub Web Interface (Easiest)**
1. In your new repository, click **"uploading an existing file"**
2. Drag and drop all these files from your project folder:
   ```
   ├── index.html
   ├── admin.html
   ├── book.html
   ├── features.html
   ├── pricing.html
   ├── testimonials.html
   ├── assets/ (entire folder)
   ├── js/ (entire folder)
   ├── api/ (entire folder)
   └── host.json
   ```
3. Add commit message: "Initial website deployment"
4. Click **"Commit changes"**

**Option B: Using Git Commands (If you have Git installed)**
```powershell
# In your project folder
git init
git add .
git commit -m "Initial website deployment"
git branch -M main
git remote add origin https://github.com/yourusername/upington-mainz-website.git
git push -u origin main
```

### Step 3: Create Static Web App with GitHub Integration
1. Go back to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Static Web Apps"**
4. Click **"Create"**

### Step 4: Configure Static Web App
Fill in these details:
- **Subscription:** Your subscription
- **Resource Group:** Create new → `upington-mainz-rg`
- **Name:** `upington-mainz-app`
- **Plan type:** `Free`
- **Region:** `East US 2`
- **Source:** `GitHub`
- **GitHub account:** Sign in to your GitHub
- **Organization:** Your GitHub username
- **Repository:** `upington-mainz-website`
- **Branch:** `main`
- **Build presets:** `Custom`
- **App location:** `/` (root)
- **Api location:** `api`
- **Output location:** `/` (root)

### Step 5: Review and Deploy
1. Click **"Review + create"**
2. Click **"Create"**
3. Azure will automatically:
   - Connect to your GitHub repository
   - Build and deploy your website
   - Set up automatic deployments for future updates

### Step 6: Monitor Deployment
1. Go to your Static Web App resource
2. Click **"GitHub Actions"** to see deployment progress
3. Wait 3-5 minutes for first deployment to complete
4. Click **"Browse"** to see your live website!

### Step 7: Configure Environment Variables
1. In your Static Web App, click **"Configuration"**
2. Click **"Application settings"**
3. Click **"+ Add"**
4. Add:
   ```
   Name: EMAIL_PASSWORD
   Value: Zharayuri100@
   ```
5. Click **"Save"**

### Step 8: Set Up Custom Domain
1. In your Static Web App, click **"Custom domains"**
2. Click **"+ Add"**
3. Enter: `upingtonmainz.com`
4. Follow the DNS verification steps

## Why GitHub Deployment is Better

✅ **Automatic Updates:** Every time you update files in GitHub, Azure automatically redeploys
✅ **Version Control:** Full history of all changes
✅ **No CLI Required:** Everything works through web interfaces
✅ **Free Hosting:** GitHub public repos + Azure Static Web Apps free tier
✅ **Professional Workflow:** Industry standard approach

## After Deployment

Your website will be available at:
- **Temporary URL:** `https://upington-mainz-app.azurestaticapps.net`
- **Custom Domain:** `https://upingtonmainz.com` (after DNS setup)

## Update Process

To make changes to your website:
1. Edit files in GitHub (or upload new files)
2. Commit changes
3. Azure automatically rebuilds and deploys within 2-3 minutes

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Upload your files
3. ✅ Create Static Web App with GitHub connection
4. ✅ Configure environment variables
5. ✅ Set up custom domain
6. ✅ Update Azure AD redirect URIs to include production URL

---

**This method is more reliable and easier to maintain than CLI deployment!**
