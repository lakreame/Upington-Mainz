# Google Search Console Troubleshooting Guide

## Current Issues (from Screenshot)

### 1. Root Sitemap (/) - "1 error"
**Status:** Error detected
**Possible Causes:**
- Server configuration issue
- Redirect loop
- Missing index.html handling
- SSL certificate problems

### 2. /index.html - "Couldn't fetch"
**Status:** Cannot access the page
**Possible Causes:**
- Server not serving index.html directly
- 404 error on /index.html path
- Server redirect configuration

## Immediate Actions Required

### 1. Verify Live URLs
Test these URLs manually in browser:
- [ ] https://upingtonmainz.com/
- [ ] https://upingtonmainz.com/index.html
- [ ] https://upingtonmainz.com/sitemap.xml
- [ ] https://upingtonmainz.com/robots.txt

### 2. Check Server Configuration
Ensure your hosting provider/Azure App Service:
- [ ] Serves index.html as default document
- [ ] Handles both "/" and "/index.html" properly
- [ ] Returns proper HTTP headers
- [ ] Has SSL certificate properly configured

### 3. URL Testing in Google Search Console
Use the "URL Inspection" tool to test:
1. https://upingtonmainz.com/
2. https://upingtonmainz.com/index.html
3. Check for any crawling errors

### 4. Re-submit Sitemap
After fixes, re-submit the sitemap:
1. Go to Sitemaps section
2. Remove current sitemap
3. Add sitemap.xml again
4. Wait 24-48 hours for processing

## Server Configuration Check

### Azure Static Web Apps (.htaccess might not apply)
If using Azure SWA, create `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/",
      "serve": "/index.html"
    }
  ],
  "mimeTypes": {
    ".xml": "text/xml"
  }
}
```

### Traditional Web Server
Ensure .htaccess is working with these rules:
```apache
DirectoryIndex index.html
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

## Validation Steps

### 1. Test Sitemap Directly
Visit: https://upingtonmainz.com/sitemap.xml
- Should display XML content
- No 404 or server errors

### 2. Test Robots.txt
Visit: https://upingtonmainz.com/robots.txt
- Should display text content
- Contains sitemap reference

### 3. Test Homepage Variants
Both should work:
- https://upingtonmainz.com/
- https://upingtonmainz.com/index.html

## Next Steps After Fixes

1. **Wait 24-48 hours** for Google to re-crawl
2. **Monitor Search Console** for updates
3. **Check Coverage report** for indexing status
4. **Submit for indexing** individual important pages

## Expected Timeline
- **Immediate:** URL fixes should work right away
- **24-48 hours:** Google re-crawls and updates status
- **1 week:** Full sitemap processing and indexing

---
*Created: August 15, 2025*
*Update this document as issues are resolved*
