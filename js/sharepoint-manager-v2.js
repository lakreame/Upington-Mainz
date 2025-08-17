// Enhanced SharePoint Integration Library for Upington Mainz
// This library provides easy access to SharePoint lists using Microsoft Graph API

class SharePointManager {
    constructor(config) {
        this.siteUrl = config.siteUrl;
        this.clientId = config.clientId;
        this.tenantId = config.tenantId;
        this.accessToken = null;
        this.siteId = null;
        this.lists = {
            clients: config.lists.clients || 'Clients',
            appointments: config.lists.appointments || 'Appointments',
            leads: config.lists.leads || 'Leads',
            policies: config.lists.policies || 'Policies'
        };
        this.debug = config.debug || false;
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[SharePoint Manager] ${message}`, data || '');
        }
    }

    // Authentication using Microsoft Graph API
    async authenticate() {
        try {
            this.log('Starting authentication...');
            
            // MSAL configuration
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
            
            // Handle redirect promise first (in case we're returning from auth)
            try {
                const redirectResult = await this.msalInstance.handleRedirectPromise();
                if (redirectResult) {
                    this.log('Redirect authentication successful!');
                    this.accessToken = redirectResult.accessToken;
                    
                    // Clean up the URL by removing the authorization code
                    this.cleanupUrlAfterAuth();
                    
                    // Get site ID for Graph API calls
                    await this.getSiteId();
                    
                    return true;
                }
            } catch (redirectError) {
                this.log('Redirect handling error:', redirectError.message);
            }
            
            const loginRequest = {
                scopes: [
                    "https://graph.microsoft.com/Sites.ReadWrite.All",
                    "https://graph.microsoft.com/User.Read",
                    "https://graph.microsoft.com/Calendars.ReadWrite"
                ]
            };

            let authResult;
            try {
                // Try silent authentication first
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.log('Attempting silent authentication...');
                    const silentRequest = {
                        ...loginRequest,
                        account: accounts[0]
                    };
                    authResult = await this.msalInstance.acquireTokenSilent(silentRequest);
                } else {
                    throw new Error('No cached accounts found');
                }
            } catch (silentError) {
                this.log('Silent authentication failed, trying popup login:', silentError.message);
                // Use popup instead of redirect to avoid page reload issues
                authResult = await this.msalInstance.loginPopup(loginRequest);
            }
            
            this.accessToken = authResult.accessToken;
            this.log('Authentication successful!');
            
            // Get site ID for Graph API calls
            await this.getSiteId();
            
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            this.log('Authentication error:', error.message);
            return false;
        }
    }

    // Clean up URL after authentication to remove authorization codes
    cleanupUrlAfterAuth() {
        try {
            // Check if there are auth-related parameters in the URL (both search params and hash)
            const url = new URL(window.location.href);
            const hash = window.location.hash;
            
            // Check search parameters
            const hasSearchParams = url.searchParams.has('code') || 
                                   url.searchParams.has('state') || 
                                   url.searchParams.has('session_state') ||
                                   url.searchParams.has('client_info');
            
            // Check hash parameters (common with OAuth redirects)
            const hasHashParams = hash.includes('code=') || 
                                 hash.includes('state=') || 
                                 hash.includes('session_state=') ||
                                 hash.includes('client_info=');
            
            if (hasSearchParams || hasHashParams) {
                // Remove all auth-related search parameters
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                url.searchParams.delete('session_state');
                url.searchParams.delete('client_info');
                
                // Create clean URL (remove hash entirely for OAuth redirects)
                const cleanUrl = url.pathname + (url.search || '');
                window.history.replaceState({}, document.title, cleanUrl);
                
                this.log('URL cleaned up after authentication (removed hash and search params)');
            }
        } catch (error) {
            console.error('Error cleaning up URL:', error);
        }
    }

    // Get SharePoint site ID using Graph API
    async getSiteId() {
        try {
            this.log('Getting SharePoint site ID...');
            
            // Extract hostname and site path from URL
            const url = new URL(this.siteUrl);
            const hostname = url.hostname;
            const sitePath = url.pathname;
            
            // Use Graph API to get site info
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;
            
            const response = await fetch(graphUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const siteData = await response.json();
                this.siteId = siteData.id;
                this.log('Site ID obtained:', this.siteId);
                return this.siteId;
            } else {
                throw new Error(`Failed to get site ID: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to get site ID:', error);
            throw error;
        }
    }

    // Generic method to make Microsoft Graph API calls
    async makeGraphRequest(endpoint, method = 'GET', data = null) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login first.');
        }

        const url = endpoint.startsWith('https://') ? endpoint : `https://graph.microsoft.com/v1.0/${endpoint}`;
        
        this.log(`Making Graph API request: ${method} ${url}`);
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'
            }
        };

        if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            this.log(`API request failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Graph API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const result = await response.json();
        this.log('API response received:', result);
        return result;
    }

    // Get SharePoint list items using Graph API
    async getListItems(listName, select = null, filter = null, orderBy = null) {
        if (!this.siteId) {
            throw new Error('Site ID not available. Please authenticate first.');
        }

        let endpoint = `sites/${this.siteId}/lists/${listName}/items`;
        const params = [];
        
        if (select) {
            params.push(`$select=${select}`);
        }
        if (filter) {
            params.push(`$filter=${filter}`);
        }
        if (orderBy) {
            params.push(`$orderby=${orderBy}`);
        }
        
        // Always expand fields to get actual values
        params.push('$expand=fields');
        
        if (params.length > 0) {
            endpoint += '?' + params.join('&');
        }

        try {
            const result = await this.makeGraphRequest(endpoint);
            return result.value || [];
        } catch (error) {
            this.log(`Error getting list items from ${listName}:`, error.message);
            throw error;
        }
    }

    // Create item in SharePoint list
    async createListItem(listName, itemData) {
        if (!this.siteId) {
            throw new Error('Site ID not available. Please authenticate first.');
        }

        const endpoint = `sites/${this.siteId}/lists/${listName}/items`;
        
        const payload = {
            fields: itemData
        };

        try {
            const result = await this.makeGraphRequest(endpoint, 'POST', payload);
            this.log(`Created item in ${listName}:`, result);
            return result;
        } catch (error) {
            this.log(`Error creating item in ${listName}:`, error.message);
            throw error;
        }
    }

    // Update item in SharePoint list
    async updateListItem(listName, itemId, itemData) {
        if (!this.siteId) {
            throw new Error('Site ID not available. Please authenticate first.');
        }

        const endpoint = `sites/${this.siteId}/lists/${listName}/items/${itemId}/fields`;

        try {
            const result = await this.makeGraphRequest(endpoint, 'PATCH', itemData);
            this.log(`Updated item ${itemId} in ${listName}:`, result);
            return result;
        } catch (error) {
            this.log(`Error updating item ${itemId} in ${listName}:`, error.message);
            throw error;
        }
    }

    // Delete item from SharePoint list
    async deleteListItem(listName, itemId) {
        if (!this.siteId) {
            throw new Error('Site ID not available. Please authenticate first.');
        }

        const endpoint = `sites/${this.siteId}/lists/${listName}/items/${itemId}`;

        try {
            await this.makeGraphRequest(endpoint, 'DELETE');
            this.log(`Deleted item ${itemId} from ${listName}`);
            return true;
        } catch (error) {
            this.log(`Error deleting item ${itemId} from ${listName}:`, error.message);
            throw error;
        }
    }

    // Client Management Methods
    async getClients(filter = '') {
        try {
            this.log('Getting clients...');
            // Don't use orderby with non-indexed fields to avoid errors
            const items = await this.getListItems(this.lists.clients, null, filter, null);
            
            return items.map(item => ({
                Id: item.id,
                Title: item.fields.Title || item.fields.title || '',
                Email: item.fields.Email || item.fields.email || '',
                Phone: item.fields.Phone || item.fields.phone || '',
                DateOfBirth: item.fields.DateOfBirth || item.fields.dateOfBirth || '',
                InsuranceType: item.fields.InsuranceType || item.fields.insuranceType || '',
                Status: item.fields.Status || item.fields.status || '',
                Created: item.fields.Created || item.createdDateTime,
                Modified: item.fields.Modified || item.lastModifiedDateTime
            }));
        } catch (error) {
            console.error('Error getting clients:', error);
            throw error;
        }
    }

    async createClient(clientData) {
        try {
            this.log('Creating client:', clientData);
            const result = await this.createListItem(this.lists.clients, clientData);
            return result;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    }

    async updateClient(clientId, clientData) {
        try {
            this.log('Updating client:', { clientId, clientData });
            const result = await this.updateListItem(this.lists.clients, clientId, clientData);
            return result;
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    }

    async deleteClient(clientId) {
        try {
            this.log('Deleting client:', clientId);
            const result = await this.deleteListItem(this.lists.clients, clientId);
            return result;
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    }

    // Appointment Management Methods
    async getAppointments(filter = '') {
        try {
            this.log('Getting appointments...');
            const items = await this.getListItems(this.lists.appointments, null, filter, null);
            
            return items.map(item => ({
                Id: item.id,
                Title: item.fields.Title || item.fields.title || '',
                ClientName: item.fields.ClientName || item.fields.clientName || '',
                AppointmentDate: item.fields.AppointmentDate || item.fields.appointmentDate || '',
                AppointmentTime: item.fields.AppointmentTime || item.fields.appointmentTime || '',
                Type: item.fields.Type || item.fields.type || '',
                Status: item.fields.Status || item.fields.status || '',
                Notes: item.fields.Notes || item.fields.notes || '',
                Created: item.fields.Created || item.createdDateTime,
                Modified: item.fields.Modified || item.lastModifiedDateTime
            }));
        } catch (error) {
            console.error('Error getting appointments:', error);
            throw error;
        }
    }

    async createAppointment(appointmentData) {
        try {
            this.log('Creating appointment:', appointmentData);
            const result = await this.createListItem(this.lists.appointments, appointmentData);
            return result;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    async updateAppointment(appointmentId, updateData) {
        try {
            this.log('Updating appointment:', appointmentId, updateData);
            const result = await this.updateListItem(this.lists.appointments, appointmentId, updateData);
            return result;
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    // Lead Management Methods
    async getLeads(filter = '') {
        try {
            this.log('Getting leads...');
            const items = await this.getListItems(this.lists.leads, null, filter, null);
            
            return items.map(item => ({
                Id: item.id,
                Title: item.fields.Title || item.fields.title || '',
                Email: item.fields.Email || item.fields.email || '',
                Phone: item.fields.Phone || item.fields.phone || '',
                Source: item.fields.Source || item.fields.source || '',
                Status: item.fields.Status || item.fields.status || '',
                Notes: item.fields.Notes || item.fields.notes || '',
                Created: item.fields.Created || item.createdDateTime,
                Modified: item.fields.Modified || item.lastModifiedDateTime
            }));
        } catch (error) {
            console.error('Error getting leads:', error);
            throw error;
        }
    }

    async createLead(leadData) {
        try {
            this.log('Creating lead:', leadData);
            const result = await this.createListItem(this.lists.leads, leadData);
            return result;
        } catch (error) {
            console.error('Error creating lead:', error);
            throw error;
        }
    }

    // Policy Management Methods
    async getPolicies(filter = '') {
        try {
            this.log('Getting policies...');
            const items = await this.getListItems(this.lists.policies, null, filter, null);
            
            return items.map(item => ({
                Id: item.id,
                Title: item.fields.Title || item.fields.title || '',
                ClientName: item.fields.ClientName || item.fields.clientName || '',
                PolicyType: item.fields.PolicyType || item.fields.policyType || '',
                PolicyNumber: item.fields.PolicyNumber || item.fields.policyNumber || '',
                PremiumAmount: item.fields.PremiumAmount || item.fields.premiumAmount || '',
                Status: item.fields.Status || item.fields.status || '',
                StartDate: item.fields.StartDate || item.fields.startDate || '',
                EndDate: item.fields.EndDate || item.fields.endDate || '',
                Created: item.fields.Created || item.createdDateTime,
                Modified: item.fields.Modified || item.lastModifiedDateTime
            }));
        } catch (error) {
            console.error('Error getting policies:', error);
            throw error;
        }
    }

    async createPolicy(policyData) {
        try {
            this.log('Creating policy:', policyData);
            const result = await this.createListItem(this.lists.policies, policyData);
            return result;
        } catch (error) {
            console.error('Error creating policy:', error);
            throw error;
        }
    }

    // Utility method to test connection
    async testConnection() {
        try {
            this.log('Testing SharePoint connection...');
            
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }

            if (!this.siteId) {
                await this.getSiteId();
            }

            // Try to get site information
            const siteInfo = await this.makeGraphRequest(`sites/${this.siteId}`);
            this.log('Site connection test successful:', siteInfo.displayName);
            
            return {
                success: true,
                siteName: siteInfo.displayName,
                siteId: this.siteId
            };
        } catch (error) {
            this.log('Connection test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get dashboard data with aggregated statistics
    async getDashboardData() {
        try {
            this.log('Loading dashboard data...');
            
            // Get all data in parallel for better performance
            const [clients, appointments, leads, policies] = await Promise.all([
                this.getClients(),
                this.getAppointments(),
                this.getLeads(),
                this.getPolicies()
            ]);

            // Calculate totals
            const totals = {
                clients: clients.length,
                appointments: appointments.length,
                leads: leads.length,
                policies: policies.length
            };

            // Get recent data (last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const recent = {
                upcomingAppointments: appointments.filter(apt => {
                    const aptDate = new Date(apt.Date || apt.AppointmentDate);
                    return aptDate >= new Date();
                }).length,
                newLeads: leads.filter(lead => {
                    const leadDate = new Date(lead.Created || lead.fields?.Created);
                    return leadDate >= thirtyDaysAgo;
                }).length,
                activePolicies: policies.filter(policy => {
                    return policy.Status === 'Active' || policy.PolicyStatus === 'Active';
                }).length
            };

            // Get recent appointments (next 10)
            const recentAppointments = appointments
                .filter(apt => {
                    const aptDate = new Date(apt.Date || apt.AppointmentDate);
                    return aptDate >= new Date();
                })
                .sort((a, b) => new Date(a.Date || a.AppointmentDate) - new Date(b.Date || b.AppointmentDate))
                .slice(0, 10);

            // Get recent leads (last 10)
            const recentLeads = leads
                .sort((a, b) => new Date(b.Created || b.fields?.Created) - new Date(a.Created || a.fields?.Created))
                .slice(0, 10);

            this.log('Dashboard data loaded successfully');
            
            return {
                totals,
                recent,
                recentAppointments,
                recentLeads
            };
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.log('Dashboard data loading failed:', error.message);
            throw error;
        }
    }

    // Debug method to inspect available fields in a list
    async debugListFields(listName) {
        try {
            this.log(`Debugging fields for list: ${listName}`);
            
            if (!this.siteId) {
                throw new Error('Site ID not available. Please authenticate first.');
            }

            // Get a single item to see available fields
            const endpoint = `sites/${this.siteId}/lists/${listName}/items?$top=1&$expand=fields`;
            const result = await this.makeGraphRequest(endpoint);
            
            if (result.value && result.value.length > 0) {
                const fields = result.value[0].fields;
                this.log(`Available fields in ${listName}:`, Object.keys(fields));
                return Object.keys(fields);
            } else {
                this.log(`No items found in ${listName} to inspect fields`);
                return [];
            }
        } catch (error) {
            this.log(`Error debugging fields for ${listName}:`, error.message);
            throw error;
        }
    }
}
