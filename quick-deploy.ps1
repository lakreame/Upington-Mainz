# Quick Azure Deployment Script
Write-Host "Deploying to Azure Static Web Apps..." -ForegroundColor Green

# Deployment details
$deploymentToken = "042a3f12b7f778650c0d8d98de1126eac1f43c9efa4e6186799b15bdfd12ef2c01-45389771-eea1-45ae-a914-ed94bc2bd685010152503910cf10"
$deployUrl = "https://upington-mainz-app.scm.azurestaticapps.net/api/zipdeploy"

# Check if zip exists
if (Test-Path "azure-swa-deploy.zip") {
    Write-Host "Found deployment package" -ForegroundColor Green
    
    # Upload using PowerShell
    try {
        Write-Host "Uploading files..." -ForegroundColor Yellow
        
        # Read file as byte array
        $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path "azure-swa-deploy.zip"))
        
        # Create web request
        $uri = $deployUrl
        $headers = @{
            "Authorization" = "Bearer $deploymentToken"
            "Content-Type" = "application/zip"
        }
        
        # Upload
        $response = Invoke-RestMethod -Uri $uri -Method Post -Body $fileBytes -Headers $headers -ContentType "application/zip"
        
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host "Your site should be live at: https://ambitious-water-03910cf10.azurestaticapps.net" -ForegroundColor Cyan
        
    } catch {
        Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Try the GitHub Actions method instead" -ForegroundColor Yellow
    }
} else {
    Write-Host "azure-swa-deploy.zip not found!" -ForegroundColor Red
}

Write-Host "If deployment succeeded, check your site in a few minutes" -ForegroundColor Green
