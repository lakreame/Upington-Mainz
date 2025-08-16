# Complete Guide: Upington Mainz Insurance Website
## From Creation to Deployment and Management

---

## 📚 Table of Contents
1. [Project Overview](#project-overview)
2. [Initial Setup](#initial-setup)
3. [Development Environment](#development-environment)
4. [Application Architecture](#application-architecture)
5. [Git Workflow](#git-workflow)
6. [Azure Deployment](#azure-deployment)
7. [Email System Setup](#email-system-setup)
8. [SEO Implementation](#seo-implementation)
9. [Security Configuration](#security-configuration)
10. [Maintenance & Updates](#maintenance--updates)
11. [Troubleshooting](#troubleshooting)

---

## 🏗️ Project Overview

**Application Type**: Static Website with Azure Functions Backend
**Primary Purpose**: Insurance agency website with appointment booking system
**Tech Stack**: HTML5, Tailwind CSS, JavaScript (GSAP), Azure Static Web Apps, Azure Functions, Node.js
**Domain**: https://upingtonmainz.com
**Repository**: https://github.com/lakreame/Upington-Mainz

### Key Features
- ✅ Responsive insurance agency website
- ✅ Interactive appointment booking system
- ✅ Email notification system via Azure Functions
- ✅ Admin dashboard with role-based access control
- ✅ SEO optimized with local business targeting
- ✅ Automated CI/CD deployment via GitHub Actions

---

## 🚀 Initial Setup

### Prerequisites
```powershell
# Required Software
- Git for Windows
- Node.js (v16 or later)
- VS Code
- Azure CLI
- GitHub account
- Azure account
```

### Repository Initialization
```bash
# 1. Create new repository on GitHub
# 2. Clone to local machine
git clone https://github.com/lakreame/Upington-Mainz.git
cd Upington-Mainz

# 3. Initialize project structure
mkdir assets/images
mkdir js
mkdir azure-deploy
mkdir azure-deploy/api
mkdir .github/workflows

# 4. Create basic files
touch index.html
touch README.md
touch .gitignore
```

### Basic File Structure Created
```
Upington-Mainz/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-polite-tree-0ecbd9010.yml
├── assets/
│   └── images/
├── azure-deploy/
│   ├── api/
│   │   └── submit-appointment/
│   │       └── index.js
│   ├── index.html
│   └── (all other HTML files)
├── js/
│   └── main.js
├── admin.html
├── book.html
├── features.html
├── index.html
├── pricing.html
├── testimonials.html
├── staticwebapp.config.json
├── sitemap.xml
├── robots.txt
└── README.md
```

---

## 💻 Development Environment

### Local Development Server Setup
```powershell
# Install Node.js dependencies (if using Node server)
npm install express nodemailer

# Create server.js for local development
# (See server.js file for full configuration)

# Start local development server
node server.js
# Server runs on http://localhost:3000
```

### Alternative: Simple HTTP Server
```powershell
# Using Python (if installed)
python -m http.server 8080

# Using PowerShell (built-in)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
# (See full PowerShell server code in previous sessions)
```

### VS Code Extensions Recommended
- Live Server
- HTML CSS Support
- JavaScript (ES6) code snippets
- Azure Tools
- GitLens

---

## 🏛️ Application Architecture

### Frontend Architecture
```
┌─────────────────────────────────────┐
│           Frontend (Static)         │
├─────────────────────────────────────┤
│ • HTML5 semantic structure         │
│ • Tailwind CSS (CDN)               │
│ • JavaScript (GSAP animations)     │
│ • Responsive design                │
│ • Glassmorphism UI effects         │
└─────────────────────────────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────┐
│        Azure Static Web Apps        │
├─────────────────────────────────────┤
│ • Static file hosting              │
│ • Custom domain (upingtonmainz.com)│
│ • SSL certificate (automatic)      │
│ • CDN (global distribution)        │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│         Azure Functions API         │
├─────────────────────────────────────┤
│ • submit-appointment endpoint       │
│ • Email sending via Nodemailer     │
│ • Office 365 SMTP integration      │
│ • Form validation & processing     │
└─────────────────────────────────────┘
```

### Security Layer
```
┌─────────────────────────────────────┐
│       Security Configuration        │
├─────────────────────────────────────┤
│ • Role-based access control        │
│ • Admin authentication required    │
│ • HTTPS enforcement                │
│ • Content Security Policy          │
│ • XSS protection headers           │
└─────────────────────────────────────┘
```

---

## 🔄 Git Workflow

### Basic Git Commands Used

#### Daily Development Workflow
```bash
# Check current status
git status

# Add changes to staging
git add .
# Or add specific files
git add index.html azure-deploy/index.html

# Commit changes with descriptive message
git commit -m "feat: Add local SEO section with service areas"

# Push to GitHub (triggers auto-deployment)
git push origin main
```

#### Branch Management
```bash
# Create new feature branch
git checkout -b feature/seo-improvements

# Switch between branches
git checkout main
git checkout feature/seo-improvements

# Merge feature branch to main
git checkout main
git merge feature/seo-improvements

# Delete merged branch
git branch -d feature/seo-improvements
```

#### Emergency Fixes
```bash
# Create hotfix branch
git checkout -b hotfix/email-notification-fix

# Make changes, commit, and push
git add .
git commit -m "fix: Resolve email notification SMTP authentication"
git push origin hotfix/email-notification-fix

# Merge via GitHub Pull Request or direct merge
git checkout main
git merge hotfix/email-notification-fix
git push origin main
```

#### Deployment-Specific Commands
```bash
# Deploy changes (automatic via GitHub Actions when pushing to main)
git add azure-deploy/
git commit -m "deploy: Update production files with latest changes"
git push origin main

# Check deployment status
# Visit: https://github.com/lakreame/Upington-Mainz/actions

# Rollback if needed (revert last commit)
git revert HEAD
git push origin main
```

#### File Synchronization (Development to Production)
```powershell
# Copy local changes to azure-deploy folder
Copy-Item "index.html" "azure-deploy/index.html" -Force
Copy-Item "assets/*" "azure-deploy/assets/" -Recurse -Force

# Commit and deploy
git add azure-deploy/
git commit -m "sync: Update production with latest local changes"
git push origin main
```

---

## ☁️ Azure Deployment

### Azure Static Web Apps Setup

#### Initial Azure Configuration
```bash
# 1. Create Azure Static Web App via Azure Portal
# 2. Connect to GitHub repository
# 3. Configure build settings:
#    - App location: ./azure-deploy
#    - Api location: ./azure-deploy/api
#    - Output location: /
#    - Skip app build: true
```

#### GitHub Actions Workflow
**File**: `.github/workflows/azure-static-web-apps-polite-tree-0ecbd9010.yml`
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: false
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_TREE_0ECBD9010 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "./azure-deploy"
          api_location: "./azure-deploy/api"
          output_location: "/"
          skip_app_build: true
```

#### Domain Configuration
```bash
# 1. In Azure Portal > Static Web App > Custom domains
# 2. Add custom domain: upingtonmainz.com
# 3. Configure DNS CNAME record:
#    CNAME www upingtonmainz.azurestaticapps.net
# 4. SSL certificate is automatically provisioned
```

#### Environment Variables & Secrets
```bash
# GitHub Repository Secrets:
AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_TREE_0ECBD9010=<deployment_token>

# Azure Function Environment Variables:
OFFICE365_EMAIL=<email@domain.com>
OFFICE365_PASSWORD=<app_password>
OFFICE365_SMTP_HOST=smtp.office365.com
```

---

## 📧 Email System Setup

### Azure Function Configuration
**File**: `azure-deploy/api/submit-appointment/index.js`

```javascript
const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    // Email configuration with Office 365
    const transporter = nodemailer.createTransporter({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.OFFICE365_EMAIL,
            pass: process.env.OFFICE365_PASSWORD
        }
    });

    // Email template and sending logic
    // (See full implementation in actual file)
};
```

### Email Setup Steps
```bash
# 1. Office 365 Configuration
# - Create app password in Office 365 admin
# - Enable SMTP authentication
# - Configure security settings

# 2. Azure Function App Settings
# - Add environment variables for email credentials
# - Configure CORS settings
# - Enable Function App logs

# 3. Testing
# - Test form submission from website
# - Check Function App logs for errors
# - Verify email delivery
```

---

## 🔍 SEO Implementation

### Technical SEO Setup
```html
<!-- Meta Tags (in <head>) -->
<title>Medicare Agent Marietta GA | Health Insurance Marietta | Upington Mainz Insurance</title>
<meta name="description" content="Licensed Medicare and health insurance agent serving Marietta, Roswell, Kennesaw, Alpharetta, and Metro Atlanta, GA.">
<meta name="keywords" content="medicare agent marietta ga, health insurance marietta georgia, insurance agent near me">

<!-- Geographic Targeting -->
<meta name="geo.region" content="US-GA">
<meta name="geo.placename" content="Marietta, Georgia">
<meta name="geo.position" content="33.9527;-84.5499">

<!-- Open Graph Tags -->
<meta property="og:title" content="Upington Mainz — Medicare, Health & Life Insurance in Georgia">
<meta property="og:description" content="Expert Medicare, health insurance, and life insurance guidance in Georgia.">
<meta property="og:image" content="https://upingtonmainz.com/assets/images/hero-team.jpg">
<meta property="og:url" content="https://upingtonmainz.com/">
```

### Schema Markup (Local Business)
```json
{
  "@context": "https://schema.org",
  "@type": "InsuranceAgency",
  "name": "Upington Mainz",
  "description": "Independent insurance agency specializing in Medicare, health insurance, and life insurance in Georgia",
  "url": "https://upingtonmainz.com",
  "telephone": "+1-470-913-3445",
  "email": "info@upingtonmainz.com",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "GA",
    "addressCountry": "US"
  },
  "areaServed": [
    {"@type": "City", "name": "Marietta"},
    {"@type": "City", "name": "Roswell"},
    {"@type": "City", "name": "Kennesaw"}
  ]
}
```

### SEO Files
**robots.txt**
```
User-agent: *
Allow: /

Sitemap: https://upingtonmainz.com/sitemap.xml

# Block admin areas
Disallow: /admin/
Disallow: /*.json$
```

**sitemap.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://upingtonmainz.com/</loc>
        <lastmod>2025-08-16</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <!-- Additional URLs -->
</urlset>
```

---

## 🔒 Security Configuration

### Static Web App Security
**File**: `staticwebapp.config.json`
```json
{
  "routes": [
    {
      "route": "/admin.html",
      "allowedRoles": ["authenticated"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/js/*", "*.css", "*.js", "*.json"]
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block"
  }
}
```

### Access Control Setup
```bash
# Azure Portal Steps:
# 1. Static Web App > Role management
# 2. Create "admin" role
# 3. Assign users to admin role
# 4. Configure authentication providers (GitHub, Azure AD)
```

---

## 🔧 Maintenance & Updates

### Regular Update Workflow
```bash
# 1. Pull latest changes
git pull origin main

# 2. Make updates to local files
# Edit index.html, assets, etc.

# 3. Test locally
node server.js
# or use live server

# 4. Copy to production folder
Copy-Item "index.html" "azure-deploy/index.html" -Force

# 5. Commit and deploy
git add .
git commit -m "update: Monthly content refresh and security updates"
git push origin main

# 6. Verify deployment
# Check https://upingtonmainz.com
# Check https://github.com/lakreame/Upington-Mainz/actions
```

### Content Updates
```bash
# Update business information
# - Edit contact details in index.html
# - Update service offerings
# - Modify pricing information
# - Add new testimonials

# SEO maintenance
# - Update meta descriptions seasonally
# - Add new location keywords
# - Refresh schema markup
# - Update sitemap.xml with new pages
```

### Security Maintenance
```bash
# Monthly security checks
# - Review Azure Function logs
# - Check for failed authentication attempts
# - Update dependencies (nodemailer, etc.)
# - Review and rotate API keys if needed

# Azure portal monitoring
# - Check Static Web App metrics
# - Review Function App performance
# - Monitor email delivery success rates
```

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Deployment Failures
```bash
# Issue: GitHub Action fails
# Solution: Check workflow logs in GitHub Actions tab

# Issue: Azure deployment token expired
# Solution: Regenerate in Azure Portal > Static Web App > Manage deployment token

# Issue: Build fails due to file paths
# Solution: Verify app_location: "./azure-deploy" in workflow
```

#### Email System Issues
```bash
# Issue: Emails not sending
# Solutions:
# 1. Check Azure Function logs
# 2. Verify Office 365 app password
# 3. Test SMTP credentials manually
# 4. Check Function App environment variables

# Issue: Form submissions not reaching API
# Solutions:
# 1. Check browser console for CORS errors
# 2. Verify API endpoint URL in JavaScript
# 3. Test API directly with Postman
```

#### SEO Problems
```bash
# Issue: Site not appearing in search results
# Solutions:
# 1. Submit sitemap to Google Search Console
# 2. Request indexing for main pages
# 3. Connect Google Business Profile to website
# 4. Verify robots.txt allows crawling

# Issue: Poor local search visibility
# Solutions:
# 1. Update Google Business Profile
# 2. Add local business directories
# 3. Enhance local content and keywords
# 4. Verify schema markup implementation
```

#### Access Control Issues
```bash
# Issue: Admin page not requiring authentication
# Solutions:
# 1. Check staticwebapp.config.json syntax
# 2. Verify role assignments in Azure Portal
# 3. Clear browser cache and cookies
# 4. Test in incognito mode

# Issue: Users can't access admin page
# Solutions:
# 1. Add user to "authenticated" role in Azure
# 2. Verify authentication provider setup
# 3. Check user email matches Azure AD account
```

### Emergency Procedures

#### Site Down - Quick Recovery
```bash
# 1. Check Azure Static Web App status
# 2. Verify DNS configuration
# 3. Check GitHub Actions for failed deployments
# 4. Rollback if necessary:
git revert HEAD
git push origin main
```

#### Email System Down
```bash
# 1. Check Azure Function App status
# 2. Verify Office 365 service status
# 3. Test with backup email configuration
# 4. Switch to alternative email service if needed
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **Website Traffic**: Google Analytics
- **Search Performance**: Google Search Console
- **Email Delivery**: Azure Function logs
- **Form Submissions**: Custom logging
- **Site Performance**: Azure monitoring

### Monthly Review Checklist
- [ ] Review website analytics
- [ ] Check search console for errors
- [ ] Verify email system functionality
- [ ] Update content and SEO
- [ ] Review security logs
- [ ] Test all forms and functionality
- [ ] Update dependencies and packages

---

## 🎯 Performance Optimization

### Frontend Optimization
```html
<!-- Preconnect to external resources -->
<link rel="preconnect" href="https://cdn.tailwindcss.com">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">

<!-- Optimize images -->
<!-- Use WebP format when possible -->
<!-- Implement lazy loading for below-fold images -->
```

### Backend Optimization
```javascript
// Azure Function optimization
// - Use connection pooling for database connections
// - Implement caching for frequently accessed data
// - Optimize email templates for faster rendering
```

---

## 📚 Additional Resources

### Documentation Links
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Support Contacts
- **Azure Support**: Azure Portal > Support
- **GitHub Support**: GitHub Help Documentation
- **Domain/DNS**: Domain registrar support
- **Email Service**: Office 365 support

---

## 🔄 Version History

### Current Version: v2.1.0 (August 2025)
- ✅ Enhanced SEO with local targeting
- ✅ FAQ section implementation
- ✅ Improved schema markup
- ✅ Email notification system
- ✅ Role-based admin access
- ✅ Responsive design improvements

### Previous Versions
- **v2.0.0**: Azure deployment and email integration
- **v1.5.0**: Admin dashboard implementation
- **v1.0.0**: Initial website launch

---

*This guide covers the complete lifecycle of the Upington Mainz Insurance website. For specific technical issues or advanced configurations, refer to the individual documentation files in the repository.*
