# Simple Azure Deployment using VS Code Extension

## Since the REST API approach had SSL issues, let's use the easiest method:

### Option 1: VS Code Azure Extension (Recommended)

1. **Install Azure Static Web Apps Extension in VS Code:**
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Azure Static Web Apps"
   - Install the extension by Microsoft

2. **Deploy using VS Code:**
   - Right-click on your project folder in VS Code
   - Select "Deploy to Static Web App"
   - Choose your existing app: `upington-mainz-app`
   - Select deployment folder: choose your project root

### Option 2: GitHub Integration (Most Reliable)

1. **Create GitHub Repository:**
   - Go to [GitHub.com](https://github.com) and sign in
   - Click "New repository"
   - Name it: `upington-mainz-website`
   - Make it Public
   - Don't initialize with README

2. **Push your files to GitHub:**
   ```powershell
   # In your project folder
   git init
   git add .
   git commit -m "Initial deployment"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/upington-mainz-website.git
   git push -u origin main
   ```

3. **Connect GitHub to Azure:**
   - In Azure Portal, go to your Static Web App
   - Click "Deployment" in left menu
   - Click "GitHub"
   - Authorize GitHub access
   - Select your repository
   - Azure will automatically deploy!

### Option 3: Direct File Upload via Portal

1. **In Azure Portal:**
   - Go to your Static Web App
   - Click "Functions" in left menu
   - Look for upload option
   - Upload individual files or use drag & drop

### Current Status Check

Let's first check if your Static Web App is working:

1. **Visit your app URL:** https://ambitious-water-03910cf10.azurestaticapps.net
2. **You should see a default Azure page**
3. **Once you deploy, your website will replace this**

### Which method would you prefer?

- **VS Code Extension** (easiest if you use VS Code)
- **GitHub Integration** (best for long-term maintenance)
- **Manual upload** (simplest for one-time deployment)

Let me know which you'd like to try!
