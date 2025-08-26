# 🌐 Production Deployment Guide - upingtonmainz.com

## Current Azure AD Configuration Status

### ✅ Correctly Configured:
- `https://upingtonmainz.com` (Web)
- `https://upingtonmainz.com/admin.html` (Single-page application)

### ❌ Need to Clean Up:
- Remove: `http://localhost:3000/admin-sharepoint.html` (old development URL)
- Remove: `http://localhost:3000` (redundant)

## 🔧 Recommended Azure AD Redirect URI Setup

### For Production (upingtonmainz.com):

**Web Platform:**
```
https://upingtonmainz.com
```

**Single-page Application Platform:**
```
https://upingtonmainz.com/admin.html
http://localhost:3000/admin.html  (keep for development)
```

## 📁 Files to Deploy to upingtonmainz.com

### Root Directory Files:
- `index.html` (main website)
- `book.html` (booking form)
- `admin.html` (admin dashboard)
- `features.html`, `pricing.html`, `testimonials.html`, etc.

### Assets Directory:
- `assets/` (entire folder with images)
- `js/` (entire folder with JavaScript files)

### Backend (if hosting Node.js):
- `server.js` (email notification server)
- `package.json`
- `node_modules/` (or install via npm on server)

## 🚀 Deployment Steps

### Step 1: Update Azure AD Redirect URIs
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to App registrations → Your app
3. Go to Authentication
4. **Remove these URLs:**
   - `http://localhost:3000/admin-sharepoint.html`
   - `http://localhost:3000` (if it's redundant)
5. **Keep these URLs:**
   - `https://upingtonmainz.com`
   - `https://upingtonmainz.com/admin.html`
   - `http://localhost:3000/admin.html` (for development)

### Step 2: Deploy Files
Upload all files to your web hosting service for upingtonmainz.com

### Step 3: Backend Configuration
If you're hosting the Node.js server on upingtonmainz.com:

1. **Update server.js** to use your domain
2. **Install dependencies:** `npm install express nodemailer`
3. **Start server:** `node server.js`
4. **Configure reverse proxy** (if needed) to route API calls

### Step 4: Test Production
1. Visit `https://upingtonmainz.com/admin.html`
2. Test SharePoint authentication
3. Test booking form submission
4. Test email notifications

## 🔒 Security Considerations

### HTTPS Requirements:
- All production URLs must use HTTPS
- Azure AD requires HTTPS for production redirects
- Email notifications will work from HTTPS domains

### CORS Configuration:
If your backend is on a different domain, configure CORS headers in server.js

## 🧪 Testing Both Environments

### Development (localhost:3000):
- `http://localhost:3000/admin.html` → Works
- Local Node.js server → Works
- SharePoint authentication → Works

### Production (upingtonmainz.com):
- `https://upingtonmainz.com/admin.html` → Works
- Production server or static hosting → Works
- SharePoint authentication → Works

## ⚡ Quick Fix for Current Setup

Your current Azure configuration is mostly correct! Just clean up by removing:
- `http://localhost:3000/admin-sharepoint.html`
- Duplicate `http://localhost:3000` entry

The dynamic redirect URI configuration I just added will automatically work for both:
- `http://localhost:3000/admin.html` (development)
- `https://upingtonmainz.com/admin.html` (production)

## 📞 Need Help?

If you encounter authentication issues after deployment:
1. Check browser console for MSAL errors
2. Verify all redirect URIs match exactly
3. Ensure HTTPS is properly configured
4. Test with a fresh browser session (clear cache)
