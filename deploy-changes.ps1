# Deploy Changes to Live Website
# This script syncs your changes from the root directory to azure-deploy and pushes to GitHub

Write-Host "=== Upington Mainz Website Deployment ===" -ForegroundColor Green
Write-Host ""

# Copy files to deployment folder
Write-Host "📁 Copying files to azure-deploy folder..." -ForegroundColor Yellow
Copy-Item "*.html" "azure-deploy\" -Force
Copy-Item "assets" "azure-deploy\" -Recurse -Force
Copy-Item "js" "azure-deploy\" -Recurse -Force

Write-Host "✅ Files copied successfully" -ForegroundColor Green
Write-Host ""

# Git operations
Write-Host "📤 Pushing changes to GitHub..." -ForegroundColor Yellow
git add .
$commitMessage = "Update website - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMessage
git push

Write-Host "✅ Changes deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your website will be updated at: https://upingtonmainz.com" -ForegroundColor Cyan
Write-Host "⏱️  Changes typically take 1-2 minutes to appear live" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Monitor deployment: https://github.com/lakreame/Upington-Mainz/actions" -ForegroundColor Cyan
