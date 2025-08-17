// SharePoint Integration Library for Upington Mainz
// This library provides easy access to SharePoint lists for client data management

class SharePointManager {
    constructor(config) {
        this.siteUrl = config.siteUrl;
        this.clientId = config.clientId;
        this.tenantId = config.tenantId;
        this.accessToken = null;
        this.lists = {
            clients: config.lists.clients || 'Clients',
            appointments: config.lists.appointments || 'Appointments',
            leads: config.lists.leads || 'Leads',
            policies: config.lists.policies || 'Policies'
        };
    }

    // Authentication using Microsoft Graph API
    async authenticate() {
        try {
            // Use MSAL (Microsoft Authentication Library) for authentication
            const msalConfig = {
                auth: {
                    clientId: this.clientId,
                    authority: `https://login.microsoftonline.com/${this.tenantId}`,
                    redirectUri: window.location.href
                },
                cache: {
                    cacheLocation: "localStorage",
                    storeAuthStateInCookie: false
                }
            };

            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            await this.msalInstance.initialize();
            
            const loginRequest = {
                scopes: [
                    "https://graph.microsoft.com/Sites.ReadWrite.All",
                    "https://graph.microsoft.com/User.Read"
                ]
            };

            try {
                // Try silent authentication first
                const silentRequest = {
                    ...loginRequest,
                    account: this.msalInstance.getAllAccounts()[0]
                };
                
                if (silentRequest.account) {
                    const response = await this.msalInstance.acquireTokenSilent(silentRequest);
                    this.accessToken = response.accessToken;
                } else {
                    throw new Error('No account found, need interactive login');
                }
            } catch (silentError) {
                console.log('Silent authentication failed, trying interactive:', silentError);
                // Fall back to interactive login
                const response = await this.msalInstance.loginPopup(loginRequest);
                this.accessToken = response.accessToken;
            }
            
            console.log('SharePoint authentication successful');
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    // Generic method to make Microsoft Graph API calls for SharePoint
    async makeGraphRequest(endpoint, method = 'GET', data = null) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login first.');
        }

        const url = `https://graph.microsoft.com/v1.0${endpoint}`;
        console.log(`Making Graph API request: ${method} ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            console.log(`Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Graph API error:', errorText);
                
                // Try to parse JSON error for more details
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('Graph API error details:', errorJson);
                } catch (parseError) {
                    // Error text is not JSON, log as is
                }
                
                throw new Error(`Graph API error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('Graph API response:', result);
                return result;
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error('Graph API request failed:', error);
            throw error;
        }
    }

    // Get SharePoint site ID for Graph API calls
    async getSiteId() {
        if (this.siteId) return this.siteId;
        
        // Extract site path from URL
        const siteUrl = new URL(this.siteUrl);
        const sitePath = siteUrl.pathname;
        
        try {
            const response = await this.makeGraphRequest(`/sites/${siteUrl.hostname}:${sitePath}`);
            this.siteId = response.id;
            return this.siteId;
        } catch (error) {
            console.error('Failed to get site ID:', error);
            throw error;
        }
    }

    // Get list ID for a specific list name
    async getListId(listName) {
        const siteId = await this.getSiteId();
        try {
            const response = await this.makeGraphRequest(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'`);
            if (response.value && response.value.length > 0) {
                return response.value[0].id;
            } else {
                throw new Error(`List '${listName}' not found`);
            }
        } catch (error) {
            console.error(`Failed to get list ID for ${listName}:`, error);
            throw error;
        }
    }

    // Generic method to make SharePoint REST API calls (keeping for backward compatibility)
    async makeSharePointRequest(endpoint, method = 'GET', data = null) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login first.');
        }

        // Handle different endpoint formats
        let url;
        if (endpoint.startsWith('_api/')) {
            url = `${this.siteUrl}/${endpoint}`;
        } else if (endpoint.startsWith('http')) {
            url = endpoint; // Full URL provided
        } else {
            url = `${this.siteUrl}/_api/web/${endpoint}`;
        }
        
        console.log(`Making SharePoint request: ${method} ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
        };

        if (method === 'POST' || method === 'MERGE') {
            try {
                const digest = await this.getRequestDigest();
                headers['X-RequestDigest'] = digest;
            } catch (digestError) {
                console.error('Failed to get request digest:', digestError);
                throw new Error('Failed to get request digest for write operations');
            }
        }

        const config = {
            method: method,
            headers: headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            console.log(`Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('SharePoint API error:', errorText);
                
                // Try to parse JSON error for more details
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('SharePoint API error details:', errorJson);
                } catch (parseError) {
                    // Error text is not JSON, log as is
                }
                
                throw new Error(`SharePoint API error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('SharePoint response:', result);
                return result;
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error('SharePoint request failed:', error);
            throw error;
        }
    }

    // Get request digest for POST operations
    async getRequestDigest() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const url = `${this.siteUrl}/_api/contextinfo`;
        console.log('Getting request digest from:', url);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                }
            });

            console.log(`Digest response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to get request digest:', errorText);
                throw new Error(`Failed to get request digest: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Digest response:', data);
            
            if (data && data.d && data.d.GetContextWebInformation) {
                return data.d.GetContextWebInformation.FormDigestValue;
            } else {
                throw new Error('Invalid digest response format');
            }
        } catch (error) {
            console.error('Request digest error:', error);
            throw error;
        }
    }

    // Client Management Methods
    async getClients(filter = '') {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.clients);
            
            let endpoint = `/sites/${siteId}/lists/${listId}/items?$expand=fields`;
            
            const result = await this.makeGraphRequest(endpoint);
            if (result && result.value) {
                // Transform Graph API response to match SharePoint REST format
                return result.value.map(item => ({
                    Id: item.id,
                    Title: item.fields.Title || '',
                    Email: item.fields.Email || '',
                    Phone: item.fields.Phone || '',
                    DateOfBirth: item.fields.DateOfBirth || '',
                    InsuranceType: item.fields.InsuranceType || '',
                    Status: item.fields.Status || 'Active',
                    Created: item.createdDateTime,
                    Modified: item.lastModifiedDateTime
                }));
            } else {
                console.warn('Unexpected response format:', result);
                return [];
            }
        } catch (error) {
            console.error('Error getting clients:', error);
            throw error;
        }
    }

    async createClient(clientData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.clients);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items`;
            const data = {
                fields: {
                    Title: clientData.name,
                    Email: clientData.email,
                    Phone: clientData.phone,
                    DateOfBirth: clientData.dateOfBirth,
                    InsuranceType: clientData.insuranceType,
                    Status: clientData.status || 'Active',
                    Address: clientData.address,
                    Notes: clientData.notes
                }
            };

            console.log('Creating client with Graph API:', data);
            const result = await this.makeGraphRequest(endpoint, 'POST', data);
            console.log('Client created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    }

    async updateClient(clientId, clientData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.clients);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items/${clientId}/fields`;
            
            console.log('Updating client with Graph API:', clientData);
            const result = await this.makeGraphRequest(endpoint, 'PATCH', clientData);
            console.log('Client updated successfully:', result);
            return result;
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    }

    // Appointment Management Methods
    async getAppointments(filter = '') {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.appointments);
            
            let endpoint = `/sites/${siteId}/lists/${listId}/items?$expand=fields`;
            
            const result = await this.makeGraphRequest(endpoint);
            if (result && result.value) {
                // Transform Graph API response to match SharePoint REST format
                return result.value.map(item => ({
                    Id: item.id,
                    Title: item.fields.Title || '',
                    ClientName: item.fields.ClientName || '',
                    ClientEmail: item.fields.ClientEmail || '',  // Added ClientEmail field
                    AppointmentDate: item.fields.AppointmentDate || '',
                    AppointmentTime: item.fields.AppointmentTime || '',
                    Method: item.fields.Method || '',
                    Types: item.fields.Types || '',
                    Status: item.fields.Status || 'Scheduled',
                    Notes: item.fields.Notes || '',
                    Created: item.createdDateTime
                })).sort((a, b) => new Date(b.AppointmentDate) - new Date(a.AppointmentDate));
            } else {
                console.warn('Unexpected response format:', result);
                return [];
            }
        } catch (error) {
            console.error('Error getting appointments:', error);
            throw error;
        }
    }

    async createAppointment(appointmentData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.appointments);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items`;
            const data = {
                fields: {
                    Title: `${appointmentData.ClientName || appointmentData.clientName} - ${appointmentData.Types || appointmentData.types || appointmentData.AppointmentType}`,
                    ClientName: appointmentData.ClientName || appointmentData.clientName,
                    ClientEmail: appointmentData.ClientEmail || appointmentData.email,  // Fixed: Use ClientEmail instead of Email
                    AppointmentDate: appointmentData.Date || appointmentData.date || appointmentData.preferredDate,
                    AppointmentTime: appointmentData.Time || appointmentData.time || appointmentData.preferredTime,
                    Method: appointmentData.MeetingType || appointmentData.meetingType || appointmentData.method,
                    Types: appointmentData.AppointmentType || appointmentData.types,
                    Status: appointmentData.Status || appointmentData.status || 'New Appointment Request',
                    Notes: appointmentData.Notes || appointmentData.notes
                }
            };

            console.log('Creating appointment with Graph API:', data);
            const result = await this.makeGraphRequest(endpoint, 'POST', data);
            console.log('Appointment created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    async updateAppointment(appointmentId, updateData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.appointments);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items/${appointmentId}/fields`;
            
            console.log('Updating appointment with Graph API:', updateData);
            const result = await this.makeGraphRequest(endpoint, 'PATCH', updateData);
            console.log('Appointment updated successfully:', result);
            return result;
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    // Lead Management Methods
    async getLeads(filter = '') {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.leads);
            
            let endpoint = `/sites/${siteId}/lists/${listId}/items?$expand=fields`;
            
            const result = await this.makeGraphRequest(endpoint);
            if (result && result.value) {
                // Transform Graph API response to match SharePoint REST format
                return result.value.map(item => ({
                    Id: item.id,
                    Title: item.fields.Title || '',
                    Email: item.fields.Email || '',
                    Phone: item.fields.Phone || '',
                    Source: item.fields.Source || '',
                    Status: item.fields.Status || 'New',
                    InterestType: item.fields.InterestType || '',
                    Notes: item.fields.Notes || '',
                    Created: item.createdDateTime
                })).sort((a, b) => new Date(b.Created) - new Date(a.Created));
            } else {
                console.warn('Unexpected response format:', result);
                return [];
            }
        } catch (error) {
            console.error('Error getting leads:', error);
            throw error;
        }
    }

    async createLead(leadData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.leads);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items`;
            const data = {
                fields: {
                    Title: leadData.name,
                    Email: leadData.email,
                    Phone: leadData.phone,
                    Source: leadData.source,
                    Status: leadData.status || 'New',
                    InterestType: leadData.interestType,
                    Notes: leadData.notes
                }
            };

            console.log('Creating lead with Graph API:', data);
            const result = await this.makeGraphRequest(endpoint, 'POST', data);
            console.log('Lead created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating lead:', error);
            throw error;
        }
    }

    // Policy Management Methods
    async getPolicies(clientId = null) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.policies);
            
            let endpoint = `/sites/${siteId}/lists/${listId}/items?$expand=fields`;
            
            const result = await this.makeGraphRequest(endpoint);
            if (result && result.value) {
                // Transform Graph API response to match SharePoint REST format
                let policies = result.value.map(item => ({
                    Id: item.id,
                    Title: item.fields.Title || '',
                    ClientName: item.fields.ClientName || '',
                    PolicyNumber: item.fields.PolicyNumber || '',
                    InsuranceType: item.fields.InsuranceType || '',
                    Provider: item.fields.Provider || '',
                    Premium: item.fields.Premium || '',
                    Status: item.fields.Status || 'Active',
                    EffectiveDate: item.fields.EffectiveDate || '',
                    ExpirationDate: item.fields.ExpirationDate || ''
                }));
                
                // Filter by clientId if provided
                if (clientId) {
                    policies = policies.filter(policy => policy.ClientId === clientId);
                }
                
                return policies;
            } else {
                console.warn('Unexpected response format:', result);
                return [];
            }
        } catch (error) {
            console.error('Error getting policies:', error);
            throw error;
        }
    }

    async createPolicy(policyData) {
        try {
            const siteId = await this.getSiteId();
            const listId = await this.getListId(this.lists.policies);
            
            const endpoint = `/sites/${siteId}/lists/${listId}/items`;
            const data = {
                fields: {
                    Title: `${policyData.clientName} - ${policyData.insuranceType}`,
                    ClientName: policyData.clientName,
                    ClientId: policyData.clientId,
                    PolicyNumber: policyData.policyNumber,
                    InsuranceType: policyData.insuranceType,
                    Provider: policyData.provider,
                    Premium: policyData.premium,
                    Status: policyData.status || 'Active',
                    EffectiveDate: policyData.effectiveDate,
                    ExpirationDate: policyData.expirationDate
                }
            };

            console.log('Creating policy with Graph API:', data);
            const result = await this.makeGraphRequest(endpoint, 'POST', data);
            console.log('Policy created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating policy:', error);
            throw error;
        }
    }

    // Analytics and Reporting
    async getDashboardData() {
        try {
            const [clients, appointments, leads, policies] = await Promise.all([
                this.getClients(),
                this.getAppointments(),
                this.getLeads(),
                this.getPolicies()
            ]);

            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

            return {
                totals: {
                    clients: clients ? clients.length : 0,
                    appointments: appointments ? appointments.length : 0,
                    leads: leads ? leads.length : 0,
                    policies: policies ? policies.length : 0
                },
                recent: {
                    newClients: clients.filter(c => new Date(c.Created) >= thirtyDaysAgo).length,
                    upcomingAppointments: appointments.filter(a => 
                        new Date(a.AppointmentDate) >= today && a.Status === 'Scheduled'
                    ).length,
                    newLeads: leads.filter(l => new Date(l.Created) >= thirtyDaysAgo).length,
                    activePolicies: policies.filter(p => p.Status === 'Active').length
                },
                recentAppointments: appointments
                    .filter(a => new Date(a.AppointmentDate) >= today)
                    .sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate))
                    .slice(0, 5),
                recentLeads: leads
                    .filter(l => l.Status === 'New')
                    .slice(0, 5)
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return null;
        }
    }

    // Search functionality
    async searchClients(searchTerm) {
        const filter = `substringof('${searchTerm}',Title) or substringof('${searchTerm}',Email) or substringof('${searchTerm}',Phone)`;
        return await this.getClients(filter);
    }

    async searchAppointments(searchTerm) {
        const filter = `substringof('${searchTerm}',ClientName) or substringof('${searchTerm}',Type)`;
        return await this.getAppointments(filter);
    }
}

// Utility functions for SharePoint integration
class SharePointUtils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getStatusBadgeClass(status) {
        const statusClasses = {
            'Active': 'bg-green-100 text-green-800',
            'Inactive': 'bg-gray-100 text-gray-800',
            'Scheduled': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800',
            'New': 'bg-yellow-100 text-yellow-800',
            'Contacted': 'bg-blue-100 text-blue-800',
            'Converted': 'bg-green-100 text-green-800',
            'Lost': 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    static generatePolicyNumber() {
        const prefix = 'UM';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SharePointManager, SharePointUtils };
}
