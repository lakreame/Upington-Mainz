# SharePoint Lists Creation Script
# Run this in PowerShell to create the required lists for Upington Mainz

# First, install PnP PowerShell if you haven't already:
# Install-Module -Name PnP.PowerShell -Force

# Connect to your SharePoint site
$siteUrl = "https://upingtonmainzllc1.sharepoint.com"
Connect-PnPOnline -Url $siteUrl -Interactive

Write-Host "Creating SharePoint Lists for Upington Mainz..." -ForegroundColor Green

# Create Clients List
Write-Host "Creating Clients list..." -ForegroundColor Yellow
$clientsList = New-PnPList -Title "Clients" -Template GenericList -ErrorAction SilentlyContinue
if ($clientsList) {
    Add-PnPField -List "Clients" -DisplayName "Email" -InternalName "Email" -Type Text
    Add-PnPField -List "Clients" -DisplayName "Phone" -InternalName "Phone" -Type Text
    Add-PnPField -List "Clients" -DisplayName "DateOfBirth" -InternalName "DateOfBirth" -Type DateTime
    Add-PnPField -List "Clients" -DisplayName "InsuranceType" -InternalName "InsuranceType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
    Add-PnPField -List "Clients" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Active","Inactive" -DefaultValue "Active"
    Write-Host "✅ Clients list created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Clients list may already exist" -ForegroundColor Yellow
}

# Create Appointments List
Write-Host "Creating Appointments list..." -ForegroundColor Yellow
$appointmentsList = New-PnPList -Title "Appointments" -Template GenericList -ErrorAction SilentlyContinue
if ($appointmentsList) {
    Add-PnPField -List "Appointments" -DisplayName "ClientName" -InternalName "ClientName" -Type Text
    Add-PnPField -List "Appointments" -DisplayName "ClientEmail" -InternalName "ClientEmail" -Type Text
    Add-PnPField -List "Appointments" -DisplayName "AppointmentDate" -InternalName "AppointmentDate" -Type DateTime
    Add-PnPField -List "Appointments" -DisplayName "AppointmentTime" -InternalName "AppointmentTime" -Type Text
    Add-PnPField -List "Appointments" -DisplayName "Method" -InternalName "Method" -Type Choice -Choices "In-Person","Phone","Video Call"
    Add-PnPField -List "Appointments" -DisplayName "Types" -InternalName "Types" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance","Consultation"
    Add-PnPField -List "Appointments" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Scheduled","Completed","Cancelled" -DefaultValue "Scheduled"
    Add-PnPField -List "Appointments" -DisplayName "Notes" -InternalName "Notes" -Type Note
    Write-Host "✅ Appointments list created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Appointments list may already exist" -ForegroundColor Yellow
}

# Create Leads List
Write-Host "Creating Leads list..." -ForegroundColor Yellow
$leadsList = New-PnPList -Title "Leads" -Template GenericList -ErrorAction SilentlyContinue
if ($leadsList) {
    Add-PnPField -List "Leads" -DisplayName "Email" -InternalName "Email" -Type Text
    Add-PnPField -List "Leads" -DisplayName "Phone" -InternalName "Phone" -Type Text
    Add-PnPField -List "Leads" -DisplayName "Source" -InternalName "Source" -Type Choice -Choices "Website","Referral","Cold Call","Social Media"
    Add-PnPField -List "Leads" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "New","Contacted","Qualified","Converted" -DefaultValue "New"
    Add-PnPField -List "Leads" -DisplayName "InterestType" -InternalName "InterestType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
    Add-PnPField -List "Leads" -DisplayName "Notes" -InternalName "Notes" -Type Note
    Write-Host "✅ Leads list created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Leads list may already exist" -ForegroundColor Yellow
}

# Create Policies List
Write-Host "Creating Policies list..." -ForegroundColor Yellow
$policiesList = New-PnPList -Title "Policies" -Template GenericList -ErrorAction SilentlyContinue
if ($policiesList) {
    Add-PnPField -List "Policies" -DisplayName "ClientId" -InternalName "ClientId" -Type Number
    Add-PnPField -List "Policies" -DisplayName "PolicyNumber" -InternalName "PolicyNumber" -Type Text
    Add-PnPField -List "Policies" -DisplayName "InsuranceType" -InternalName "InsuranceType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
    Add-PnPField -List "Policies" -DisplayName "StartDate" -InternalName "StartDate" -Type DateTime
    Add-PnPField -List "Policies" -DisplayName "ExpirationDate" -InternalName "ExpirationDate" -Type DateTime
    Write-Host "✅ Policies list created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Policies list may already exist" -ForegroundColor Yellow
}

Write-Host "`n🎉 All lists creation completed!" -ForegroundColor Green
Write-Host "You can now test your SharePoint integration at http://localhost:3000/sharepoint-debug.html" -ForegroundColor Cyan

# Disconnect
Disconnect-PnPOnline
