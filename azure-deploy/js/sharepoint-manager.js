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
                    redirectUri: "http://localhost:3000/admin.html"
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

    // Generic method to make SharePoint REST API calls
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
                throw new Error(`SharePoint API error: ${response.status} ${response.statusText}`);
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
        let endpoint = `lists/getbytitle('${this.lists.clients}')/items`;
        if (filter) {
            endpoint += `?$filter=${filter}`;
        }
        endpoint += filter ? '&' : '?';
        endpoint += '$select=Id,Title,Email,Phone,DateOfBirth,InsuranceType,Status,Created,Modified';
        
        try {
            const result = await this.makeSharePointRequest(endpoint);
            if (result && result.d && result.d.results) {
                return result.d.results;
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
        const endpoint = `lists/getbytitle('${this.lists.clients}')/items`;
        const data = {
            __metadata: { type: `SP.Data.${this.lists.clients}ListItem` },
            Title: clientData.name,
            Email: clientData.email,
            Phone: clientData.phone,
            DateOfBirth: clientData.dateOfBirth,
            InsuranceType: clientData.insuranceType,
            Status: clientData.status || 'Active',
            Address: clientData.address,
            Notes: clientData.notes
        };

        const result = await this.makeSharePointRequest(endpoint, 'POST', data);
        return result.d;
    }

    async updateClient(clientId, clientData) {
        const endpoint = `lists/getbytitle('${this.lists.clients}')/items(${clientId})`;
        const data = {
            __metadata: { type: `SP.Data.${this.lists.clients}ListItem` },
            ...clientData
        };

        const result = await this.makeSharePointRequest(endpoint, 'MERGE', data);
        return result;
    }

    // Appointment Management Methods
    async getAppointments(filter = '') {
        let endpoint = `lists/getbytitle('${this.lists.appointments}')/items`;
        if (filter) {
            endpoint += `?$filter=${filter}`;
        }
        endpoint += filter ? '&' : '?';
        endpoint += '$select=Id,Title,ClientName,AppointmentDate,AppointmentTime,Method,Types,Status,Notes,Created';
        endpoint += '&$orderby=AppointmentDate desc';
        
        try {
            const result = await this.makeSharePointRequest(endpoint);
            if (result && result.d && result.d.results) {
                return result.d.results;
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
        const endpoint = `lists/getbytitle('${this.lists.appointments}')/items`;
        const data = {
            __metadata: { type: `SP.Data.${this.lists.appointments}ListItem` },
            Title: `${appointmentData.clientName} - ${appointmentData.types}`,
            ClientName: appointmentData.clientName,
            ClientEmail: appointmentData.clientEmail,
            AppointmentDate: appointmentData.date,
            AppointmentTime: appointmentData.time,
            Method: appointmentData.method,
            Types: appointmentData.types,
            Status: appointmentData.status || 'Scheduled',
            Notes: appointmentData.notes
        };

        const result = await this.makeSharePointRequest(endpoint, 'POST', data);
        return result.d;
    }

    // Lead Management Methods
    async getLeads(filter = '') {
        let endpoint = `lists/getbytitle('${this.lists.leads}')/items`;
        if (filter) {
            endpoint += `?$filter=${filter}`;
        }
        endpoint += filter ? '&' : '?';
        endpoint += '$select=Id,Title,Email,Phone,Source,Status,InterestType,Created,Notes';
        endpoint += '&$orderby=Created desc';
        
        try {
            const result = await this.makeSharePointRequest(endpoint);
            if (result && result.d && result.d.results) {
                return result.d.results;
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
        const endpoint = `lists/getbytitle('${this.lists.leads}')/items`;
        const data = {
            __metadata: { type: `SP.Data.${this.lists.leads}ListItem` },
            Title: leadData.name,
            Email: leadData.email,
            Phone: leadData.phone,
            Source: leadData.source,
            Status: leadData.status || 'New',
            InterestType: leadData.interestType,
            Notes: leadData.notes
        };

        const result = await this.makeSharePointRequest(endpoint, 'POST', data);
        return result.d;
    }

    // Policy Management Methods
    async getPolicies(clientId = null) {
        let endpoint = `lists/getbytitle('${this.lists.policies}')/items`;
        let filter = '';
        
        if (clientId) {
            filter = `ClientId eq ${clientId}`;
        }
        
        if (filter) {
            endpoint += `?$filter=${filter}&`;
        } else {
            endpoint += '?';
        }
        endpoint += '$select=Id,Title,ClientName,PolicyNumber,InsuranceType,Provider,Premium,Status,EffectiveDate,ExpirationDate';
        
        const result = await this.makeSharePointRequest(endpoint);
        return result.d.results;
    }

    async createPolicy(policyData) {
        const endpoint = `lists/getbytitle('${this.lists.policies}')/items`;
        const data = {
            __metadata: { type: `SP.Data.${this.lists.policies}ListItem` },
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
        };

        const result = await this.makeSharePointRequest(endpoint, 'POST', data);
        return result.d;
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
