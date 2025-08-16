// SharePoint Configuration for Upington Mainz
// Update these values with your actual Azure AD app registration details

const SHAREPOINT_CONFIG = {
    // Your SharePoint site URL
    siteUrl: 'https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz',
    
    // Azure AD App Registration details
    // Get these from Azure Portal > App Registrations > Your App
    clientId: 'ccd7cc4d-1ee9-47a5-986e-cd615e0695ad',
    tenantId: 'ebb50a60-c0fc-4e5f-b52d-3a9f7890b416',
    
    // SharePoint list names (must match exactly what you created)
    lists: {
        clients: 'Clients',
        appointments: 'Appointments', 
        leads: 'Leads',
        policies: 'policies'
    },
    
    // Development mode settings
    debug: true
};

// Instructions for getting Azure AD App details:
/*
1. Go to Azure Portal (portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Find your app registration (or create a new one)
4. Copy the "Application (client) ID" - this is your clientId
5. Copy the "Directory (tenant) ID" - this is your tenantId
6. Under "Authentication", make sure you have added your site URL as a redirect URI
7. Under "API permissions", ensure you have:
   - SharePoint - Sites.FullControl.All (or Sites.ReadWrite.All)
   - Microsoft Graph - Sites.ReadWrite.All
   - Grant admin consent for these permissions
*/

// SharePoint Configuration for Development/Testing
// This file contains sample SharePoint list creation scripts and test data

// PowerShell script to create SharePoint lists programmatically
const powershellScript = `
# SharePoint Online Management Shell required
# Install: Install-Module -Name Microsoft.Online.SharePoint.PowerShell

# Connect to SharePoint Online
$siteUrl = "https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz"
Connect-PnPOnline -Url $siteUrl -Interactive

# Create Clients List
$clientsList = New-PnPList -Title "Clients" -Template GenericList
Add-PnPField -List "Clients" -DisplayName "Email" -InternalName "Email" -Type Text -Required
Add-PnPField -List "Clients" -DisplayName "Phone" -InternalName "Phone" -Type Text -Required
Add-PnPField -List "Clients" -DisplayName "DateOfBirth" -InternalName "DateOfBirth" -Type DateTime
Add-PnPField -List "Clients" -DisplayName "InsuranceType" -InternalName "InsuranceType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
Add-PnPField -List "Clients" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Active","Inactive" -DefaultValue "Active"
Add-PnPField -List "Clients" -DisplayName "Address" -InternalName "Address" -Type Note
Add-PnPField -List "Clients" -DisplayName "Notes" -InternalName "Notes" -Type Note

# Create Appointments List
$appointmentsList = New-PnPList -Title "Appointments" -Template GenericList
Add-PnPField -List "Appointments" -DisplayName "ClientName" -InternalName "ClientName" -Type Text -Required
Add-PnPField -List "Appointments" -DisplayName "ClientEmail" -InternalName "ClientEmail" -Type Text
Add-PnPField -List "Appointments" -DisplayName "AppointmentDate" -InternalName "AppointmentDate" -Type DateTime -Required
Add-PnPField -List "Appointments" -DisplayName "AppointmentTime" -InternalName "AppointmentTime" -Type Text
Add-PnPField -List "Appointments" -DisplayName "Method" -InternalName "Method" -Type Choice -Choices "In-Person","Phone","Video Call"
Add-PnPField -List "Appointments" -DisplayName "Types" -InternalName "Types" -Type Choice -Choices "Consultation","Policy Review","New Application","Follow-up"
Add-PnPField -List "Appointments" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Scheduled","Completed","Cancelled","Rescheduled" -DefaultValue "Scheduled"
Add-PnPField -List "Appointments" -DisplayName "Notes" -InternalName "Notes" -Type Note

# Create Leads List
$leadsList = New-PnPList -Title "Leads" -Template GenericList
Add-PnPField -List "Leads" -DisplayName "Email" -InternalName "Email" -Type Text
Add-PnPField -List "Leads" -DisplayName "Phone" -InternalName "Phone" -Type Text
Add-PnPField -List "Leads" -DisplayName "Source" -InternalName "Source" -Type Choice -Choices "Website","Referral","Social Media","Advertisement"
Add-PnPField -List "Leads" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "New","Contacted","Qualified","Converted","Lost" -DefaultValue "New"
Add-PnPField -List "Leads" -DisplayName "InterestType" -InternalName "InterestType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
Add-PnPField -List "Leads" -DisplayName "Notes" -InternalName "Notes" -Type Note

# Create Policies List
$policiesList = New-PnPList -Title "Policies" -Template GenericList
Add-PnPField -List "Policies" -DisplayName "ClientName" -InternalName "ClientName" -Type Text -Required
Add-PnPField -List "Policies" -DisplayName "ClientId" -InternalName "ClientId" -Type Number
Add-PnPField -List "Policies" -DisplayName "PolicyNumber" -InternalName "PolicyNumber" -Type Text -Required
Add-PnPField -List "Policies" -DisplayName "InsuranceType" -InternalName "InsuranceType" -Type Choice -Choices "Medicare","Health Insurance","Life Insurance"
Add-PnPField -List "Policies" -DisplayName "Provider" -InternalName "Provider" -Type Text
Add-PnPField -List "Policies" -DisplayName "Premium" -InternalName "Premium" -Type Currency
Add-PnPField -List "Policies" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Active","Expired","Cancelled" -DefaultValue "Active"
Add-PnPField -List "Policies" -DisplayName "EffectiveDate" -InternalName "EffectiveDate" -Type DateTime
Add-PnPField -List "Policies" -DisplayName "ExpirationDate" -InternalName "ExpirationDate" -Type DateTime

Write-Host "SharePoint lists created successfully!" -ForegroundColor Green
`;

// Sample test data for SharePoint lists
const testData = {
    clients: [
        {
            Title: "John Smith",
            Email: "john.smith@email.com",
            Phone: "(404) 555-0123",
            DateOfBirth: "1965-03-15",
            InsuranceType: "Medicare",
            Status: "Active",
            Address: "123 Main St, Atlanta, GA 30309",
            Notes: "Interested in Medicare Supplement plans. Referred by Dr. Johnson."
        },
        {
            Title: "Sarah Williams",
            Email: "sarah.williams@email.com",
            Phone: "(770) 555-0456",
            DateOfBirth: "1980-07-22",
            InsuranceType: "Health Insurance",
            Status: "Active",
            Address: "456 Oak Ave, Marietta, GA 30060",
            Notes: "Young family looking for comprehensive health coverage."
        },
        {
            Title: "Robert Davis",
            Email: "robert.davis@email.com",
            Phone: "(678) 555-0789",
            DateOfBirth: "1978-11-08",
            InsuranceType: "Life Insurance",
            Status: "Active",
            Address: "789 Pine St, Alpharetta, GA 30005",
            Notes: "New parent seeking term life insurance policy."
        },
        {
            Title: "Mary Johnson",
            Email: "mary.johnson@email.com",
            Phone: "(470) 555-0321",
            DateOfBirth: "1960-12-03",
            InsuranceType: "Medicare",
            Status: "Active",
            Address: "321 Elm Dr, Roswell, GA 30076",
            Notes: "Retiring next year, needs Medicare enrollment assistance."
        },
        {
            Title: "Michael Brown",
            Email: "michael.brown@email.com",
            Phone: "(404) 555-0654",
            DateOfBirth: "1985-05-17",
            InsuranceType: "Health Insurance",
            Status: "Active",
            Address: "654 Cedar Ln, Kennesaw, GA 30144",
            Notes: "Self-employed contractor needs individual health plan."
        }
    ],
    
    appointments: [
        {
            Title: "John Smith - Medicare Consultation",
            ClientName: "John Smith",
            ClientEmail: "john.smith@email.com",
            AppointmentDate: "2024-01-15T10:00:00Z",
            AppointmentTime: "10:00 AM",
            Method: "In-Person",
            Types: "Consultation",
            Status: "Scheduled",
            Notes: "Initial Medicare consultation for upcoming retirement."
        },
        {
            Title: "Sarah Williams - Policy Review",
            ClientName: "Sarah Williams",
            ClientEmail: "sarah.williams@email.com",
            AppointmentDate: "2024-01-16T14:30:00Z",
            AppointmentTime: "2:30 PM",
            Method: "Phone",
            Types: "Policy Review",
            Status: "Scheduled",
            Notes: "Annual policy review and potential coverage adjustments."
        },
        {
            Title: "Robert Davis - New Application",
            ClientName: "Robert Davis",
            ClientEmail: "robert.davis@email.com",
            AppointmentDate: "2024-01-17T09:15:00Z",
            AppointmentTime: "9:15 AM",
            Method: "Video Call",
            Types: "New Application",
            Status: "Scheduled",
            Notes: "Complete life insurance application and medical exam scheduling."
        },
        {
            Title: "Mary Johnson - Follow-up",
            ClientName: "Mary Johnson",
            ClientEmail: "mary.johnson@email.com",
            AppointmentDate: "2024-01-18T11:00:00Z",
            AppointmentTime: "11:00 AM",
            Method: "In-Person",
            Types: "Follow-up",
            Status: "Scheduled",
            Notes: "Review Medicare plan options and finalize enrollment."
        }
    ],
    
    leads: [
        {
            Title: "Jennifer Garcia",
            Email: "jennifer.garcia@email.com",
            Phone: "(404) 555-1234",
            Source: "Website",
            Status: "New",
            InterestType: "Health Insurance",
            Notes: "Submitted contact form interested in family health insurance plans."
        },
        {
            Title: "David Wilson",
            Email: "david.wilson@email.com",
            Phone: "(770) 555-5678",
            Source: "Referral",
            Status: "Contacted",
            InterestType: "Life Insurance",
            Notes: "Referred by existing client Robert Davis. Called and left voicemail."
        },
        {
            Title: "Lisa Martinez",
            Email: "lisa.martinez@email.com",
            Phone: "(678) 555-9012",
            Source: "Social Media",
            Status: "Qualified",
            InterestType: "Medicare",
            Notes: "Found us on Facebook. Very interested in Medicare Advantage plans."
        },
        {
            Title: "James Anderson",
            Email: "james.anderson@email.com",
            Phone: "(470) 555-3456",
            Source: "Advertisement",
            Status: "New",
            InterestType: "Health Insurance",
            Notes: "Responded to Google Ads campaign for individual health insurance."
        },
        {
            Title: "Patricia Taylor",
            Email: "patricia.taylor@email.com",
            Phone: "(404) 555-7890",
            Source: "Referral",
            Status: "Converted",
            InterestType: "Life Insurance",
            Notes: "Successfully enrolled in term life insurance policy. Now a client."
        }
    ],
    
    policies: [
        {
            Title: "John Smith - Medicare Supplement",
            ClientName: "John Smith",
            ClientId: 1,
            PolicyNumber: "UM-241501-ABC123",
            InsuranceType: "Medicare",
            Provider: "Humana",
            Premium: 156.50,
            Status: "Active",
            EffectiveDate: "2024-01-01T00:00:00Z",
            ExpirationDate: "2024-12-31T23:59:59Z"
        },
        {
            Title: "Sarah Williams - Family Health Plan",
            ClientName: "Sarah Williams",
            ClientId: 2,
            PolicyNumber: "UM-241502-DEF456",
            InsuranceType: "Health Insurance",
            Provider: "Blue Cross Blue Shield",
            Premium: 485.75,
            Status: "Active",
            EffectiveDate: "2024-01-01T00:00:00Z",
            ExpirationDate: "2024-12-31T23:59:59Z"
        },
        {
            Title: "Robert Davis - Term Life Insurance",
            ClientName: "Robert Davis",
            ClientId: 3,
            PolicyNumber: "UM-241503-GHI789",
            InsuranceType: "Life Insurance",
            Provider: "State Farm",
            Premium: 65.25,
            Status: "Active",
            EffectiveDate: "2024-01-01T00:00:00Z",
            ExpirationDate: "2029-01-01T00:00:00Z"
        },
        {
            Title: "Mary Johnson - Medicare Advantage",
            ClientName: "Mary Johnson",
            ClientId: 4,
            PolicyNumber: "UM-241504-JKL012",
            InsuranceType: "Medicare",
            Provider: "Aetna",
            Premium: 0.00,
            Status: "Active",
            EffectiveDate: "2024-01-01T00:00:00Z",
            ExpirationDate: "2024-12-31T23:59:59Z"
        }
    ]
};

// Function to populate SharePoint lists with test data
async function populateTestData(sharePointManager) {
    try {
        console.log('Starting test data population...');
        
        // Add test clients
        for (const client of testData.clients) {
            await sharePointManager.createClient(client);
            console.log(`Added client: ${client.Title}`);
        }
        
        // Add test appointments
        for (const appointment of testData.appointments) {
            await sharePointManager.createAppointment(appointment);
            console.log(`Added appointment: ${appointment.Title}`);
        }
        
        // Add test leads
        for (const lead of testData.leads) {
            await sharePointManager.createLead(lead);
            console.log(`Added lead: ${lead.Title}`);
        }
        
        // Add test policies
        for (const policy of testData.policies) {
            await sharePointManager.createPolicy(policy);
            console.log(`Added policy: ${policy.Title}`);
        }
        
        console.log('Test data population completed successfully!');
        return true;
    } catch (error) {
        console.error('Error populating test data:', error);
        return false;
    }
}

// SharePoint list schema validation
const listSchemas = {
    clients: {
        requiredFields: ['Title', 'Email', 'Phone'],
        optionalFields: ['DateOfBirth', 'InsuranceType', 'Status', 'Address', 'Notes'],
        fieldTypes: {
            Title: 'Text',
            Email: 'Text',
            Phone: 'Text',
            DateOfBirth: 'DateTime',
            InsuranceType: 'Choice',
            Status: 'Choice',
            Address: 'Note',
            Notes: 'Note'
        }
    },
    appointments: {
        requiredFields: ['Title', 'ClientName', 'AppointmentDate'],
        optionalFields: ['ClientEmail', 'AppointmentTime', 'Method', 'Type', 'Status', 'Notes'],
        fieldTypes: {
            Title: 'Text',
            ClientName: 'Text',
            ClientEmail: 'Text',
            AppointmentDate: 'DateTime',
            AppointmentTime: 'Text',
            Method: 'Choice',
            Types: 'Choice',
            Status: 'Choice',
            Notes: 'Note'
        }
    },
    leads: {
        requiredFields: ['Title'],
        optionalFields: ['Email', 'Phone', 'Source', 'Status', 'InterestType', 'Notes'],
        fieldTypes: {
            Title: 'Text',
            Email: 'Text',
            Phone: 'Text',
            Source: 'Choice',
            Status: 'Choice',
            InterestType: 'Choice',
            Notes: 'Note'
        }
    },
    policies: {
        requiredFields: ['Title', 'ClientName', 'PolicyNumber'],
        optionalFields: ['ClientId', 'InsuranceType', 'Provider', 'Premium', 'Status', 'EffectiveDate', 'ExpirationDate'],
        fieldTypes: {
            Title: 'Text',
            ClientName: 'Text',
            ClientId: 'Number',
            PolicyNumber: 'Text',
            InsuranceType: 'Choice',
            Provider: 'Text',
            Premium: 'Currency',
            Status: 'Choice',
            EffectiveDate: 'DateTime',
            ExpirationDate: 'DateTime'
        }
    }
};

// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        powershellScript, 
        testData, 
        populateTestData, 
        listSchemas 
    };
}
