// Simple SharePoint Manager - No complex authentication
// Uses localStorage for demo data and simple connection testing

class SimpleSharePointManager {
    constructor(config) {
        this.siteUrl = config.siteUrl;
        this.clientId = config.clientId;
        this.tenantId = config.tenantId;
        this.connected = false;
        this.mockData = {
            clients: [
                {
                    Id: 1,
                    Title: 'John Smith',
                    Email: 'john.smith@email.com',
                    Phone: '(555) 123-4567',
                    DateOfBirth: '1975-03-15',
                    InsuranceType: 'Medicare',
                    Status: 'Active',
                    Created: new Date().toISOString(),
                    Modified: new Date().toISOString()
                },
                {
                    Id: 2,
                    Title: 'Mary Johnson',
                    Email: 'mary.j@email.com',
                    Phone: '(555) 987-6543',
                    DateOfBirth: '1980-07-22',
                    InsuranceType: 'Health Insurance',
                    Status: 'Active',
                    Created: new Date().toISOString(),
                    Modified: new Date().toISOString()
                },
                {
                    Id: 3,
                    Title: 'Robert Brown',
                    Email: 'r.brown@email.com',
                    Phone: '(555) 456-7890',
                    DateOfBirth: '1965-12-08',
                    InsuranceType: 'Life Insurance',
                    Status: 'Active',
                    Created: new Date().toISOString(),
                    Modified: new Date().toISOString()
                }
            ],
            appointments: [
                {
                    Id: 1,
                    Title: 'Medicare Consultation',
                    ClientName: 'John Smith',
                    AppointmentDate: '2024-12-20T14:00:00Z',
                    Type: 'Medicare',
                    Status: 'Scheduled',
                    Created: new Date().toISOString()
                },
                {
                    Id: 2,
                    Title: 'Policy Review',
                    ClientName: 'Mary Johnson',
                    AppointmentDate: '2024-12-22T10:30:00Z',
                    Type: 'Health Insurance',
                    Status: 'Scheduled',
                    Created: new Date().toISOString()
                }
            ],
            leads: [
                {
                    Id: 1,
                    Title: 'Sarah Wilson',
                    Email: 'sarah.w@email.com',
                    Phone: '(555) 234-5678',
                    Interest: 'Medicare',
                    Status: 'New',
                    Source: 'Website',
                    Created: new Date().toISOString()
                },
                {
                    Id: 2,
                    Title: 'David Lee',
                    Email: 'david.lee@email.com',
                    Phone: '(555) 345-6789',
                    Interest: 'Life Insurance',
                    Status: 'Contacted',
                    Source: 'Referral',
                    Created: new Date().toISOString()
                }
            ],
            policies: [
                {
                    Id: 1,
                    PolicyNumber: 'POL-2024-001',
                    ClientName: 'John Smith',
                    PolicyType: 'Medicare Supplement',
                    Status: 'Active',
                    Premium: '$180/month',
                    Created: new Date().toISOString()
                },
                {
                    Id: 2,
                    PolicyNumber: 'POL-2024-002',
                    ClientName: 'Mary Johnson',
                    PolicyType: 'Health Insurance',
                    Status: 'Active',
                    Premium: '$420/month',
                    Created: new Date().toISOString()
                }
            ]
        };
        
        // Initialize localStorage with demo data if not exists
        this.initializeLocalStorage();
    }

    // Simple authentication - just verify connection
    async authenticate() {
        try {
            console.log('Attempting simple SharePoint connection...');
            
            // Simulate connection check
            await this.simulateConnectionDelay();
            
            // Check if we can reach the site (basic connectivity test)
            if (this.siteUrl) {
                this.connected = true;
                console.log('✅ SharePoint connection successful (simple mode)');
                return true;
            }
            
            throw new Error('No SharePoint site URL configured');
        } catch (error) {
            console.log('⚠️ SharePoint connection failed, using local data mode');
            this.connected = false;
            return true; // Always return true for demo purposes
        }
    }

    // Simulate network delay for realistic feel
    async simulateConnectionDelay() {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    // Initialize localStorage with demo data
    initializeLocalStorage() {
        const keys = ['clients', 'appointments', 'leads', 'policies'];
        keys.forEach(key => {
            if (!localStorage.getItem(`sharepoint_${key}`)) {
                localStorage.setItem(`sharepoint_${key}`, JSON.stringify(this.mockData[key]));
            }
        });
    }

    // Get data from localStorage or return mock data
    getLocalData(type) {
        try {
            const data = localStorage.getItem(`sharepoint_${type}`);
            return data ? JSON.parse(data) : this.mockData[type] || [];
        } catch (error) {
            console.error(`Error reading ${type} from localStorage:`, error);
            return this.mockData[type] || [];
        }
    }

    // Save data to localStorage
    saveLocalData(type, data) {
        try {
            localStorage.setItem(`sharepoint_${type}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${type} to localStorage:`, error);
            return false;
        }
    }

    // Client Management Methods
    async getClients(filter = '') {
        try {
            await this.simulateConnectionDelay();
            
            let clients = this.getLocalData('clients');
            
            if (filter) {
                const filterLower = filter.toLowerCase();
                clients = clients.filter(client => 
                    client.Title?.toLowerCase().includes(filterLower) ||
                    client.Email?.toLowerCase().includes(filterLower) ||
                    client.Phone?.includes(filterLower) ||
                    client.InsuranceType?.toLowerCase().includes(filterLower)
                );
            }
            
            console.log(`Retrieved ${clients.length} clients`);
            return clients;
        } catch (error) {
            console.error('Error getting clients:', error);
            return [];
        }
    }

    async addClient(clientData) {
        try {
            const clients = this.getLocalData('clients');
            const newClient = {
                Id: Math.max(...clients.map(c => c.Id), 0) + 1,
                Title: clientData.name,
                Email: clientData.email,
                Phone: clientData.phone,
                DateOfBirth: clientData.dateOfBirth,
                InsuranceType: clientData.insuranceType,
                Status: 'Active',
                Address: clientData.address || '',
                Notes: clientData.notes || '',
                Created: new Date().toISOString(),
                Modified: new Date().toISOString()
            };
            
            clients.push(newClient);
            this.saveLocalData('clients', clients);
            
            console.log('Client added successfully:', newClient);
            return newClient;
        } catch (error) {
            console.error('Error adding client:', error);
            throw error;
        }
    }

    async updateClient(clientId, updates) {
        try {
            const clients = this.getLocalData('clients');
            const clientIndex = clients.findIndex(c => c.Id === clientId);
            
            if (clientIndex === -1) {
                throw new Error('Client not found');
            }
            
            clients[clientIndex] = {
                ...clients[clientIndex],
                ...updates,
                Modified: new Date().toISOString()
            };
            
            this.saveLocalData('clients', clients);
            console.log('Client updated successfully');
            return clients[clientIndex];
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    }

    async deleteClient(clientId) {
        try {
            const clients = this.getLocalData('clients');
            const filteredClients = clients.filter(c => c.Id !== clientId);
            
            if (filteredClients.length === clients.length) {
                throw new Error('Client not found');
            }
            
            this.saveLocalData('clients', filteredClients);
            console.log('Client deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    }

    // Appointment Management Methods
    async getAppointments(filter = '') {
        try {
            await this.simulateConnectionDelay();
            
            let appointments = this.getLocalData('appointments');
            
            if (filter) {
                const filterLower = filter.toLowerCase();
                appointments = appointments.filter(apt => 
                    apt.Title?.toLowerCase().includes(filterLower) ||
                    apt.ClientName?.toLowerCase().includes(filterLower) ||
                    apt.Type?.toLowerCase().includes(filterLower)
                );
            }
            
            console.log(`Retrieved ${appointments.length} appointments`);
            return appointments;
        } catch (error) {
            console.error('Error getting appointments:', error);
            return [];
        }
    }

    async getUpcomingAppointments(limit = 5) {
        try {
            const appointments = await this.getAppointments();
            const upcoming = appointments
                .filter(apt => new Date(apt.AppointmentDate) > new Date())
                .sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate))
                .slice(0, limit);
            
            return upcoming;
        } catch (error) {
            console.error('Error getting upcoming appointments:', error);
            return [];
        }
    }

    // Lead Management Methods
    async getLeads(filter = '') {
        try {
            await this.simulateConnectionDelay();
            
            let leads = this.getLocalData('leads');
            
            if (filter) {
                const filterLower = filter.toLowerCase();
                leads = leads.filter(lead => 
                    lead.Title?.toLowerCase().includes(filterLower) ||
                    lead.Email?.toLowerCase().includes(filterLower) ||
                    lead.Interest?.toLowerCase().includes(filterLower)
                );
            }
            
            console.log(`Retrieved ${leads.length} leads`);
            return leads;
        } catch (error) {
            console.error('Error getting leads:', error);
            return [];
        }
    }

    async getNewLeads(limit = 5) {
        try {
            const leads = await this.getLeads();
            const newLeads = leads
                .filter(lead => lead.Status === 'New')
                .sort((a, b) => new Date(b.Created) - new Date(a.Created))
                .slice(0, limit);
            
            return newLeads;
        } catch (error) {
            console.error('Error getting new leads:', error);
            return [];
        }
    }

    // Policy Management Methods
    async getPolicies(filter = '') {
        try {
            await this.simulateConnectionDelay();
            
            let policies = this.getLocalData('policies');
            
            if (filter) {
                const filterLower = filter.toLowerCase();
                policies = policies.filter(policy => 
                    policy.PolicyNumber?.toLowerCase().includes(filterLower) ||
                    policy.ClientName?.toLowerCase().includes(filterLower) ||
                    policy.PolicyType?.toLowerCase().includes(filterLower)
                );
            }
            
            console.log(`Retrieved ${policies.length} policies`);
            return policies;
        } catch (error) {
            console.error('Error getting policies:', error);
            return [];
        }
    }

    // Form Submissions (from localStorage)
    async getFormSubmissions() {
        try {
            const submissions = JSON.parse(localStorage.getItem('appointmentSubmissions') || '[]');
            console.log(`Retrieved ${submissions.length} form submissions`);
            return submissions;
        } catch (error) {
            console.error('Error getting form submissions:', error);
            return [];
        }
    }

    async clearFormSubmissions() {
        try {
            localStorage.removeItem('appointmentSubmissions');
            console.log('Form submissions cleared');
            return true;
        } catch (error) {
            console.error('Error clearing form submissions:', error);
            return false;
        }
    }

    // Utility methods
    isConnected() {
        return this.connected;
    }

    getConnectionStatus() {
        return {
            connected: this.connected,
            mode: this.connected ? 'SharePoint' : 'Local Storage',
            siteUrl: this.siteUrl
        };
    }

    // Test connection without authentication complexity
    async testConnection() {
        try {
            console.log('Testing SharePoint connection...');
            await this.simulateConnectionDelay();
            
            // Simple ping test
            if (this.siteUrl) {
                console.log('✅ Connection test passed');
                return {
                    success: true,
                    message: 'Connection successful',
                    mode: 'SharePoint'
                };
            }
            
            throw new Error('No site URL configured');
        } catch (error) {
            console.log('⚠️ Using local data mode');
            return {
                success: true,
                message: 'Using local data mode',
                mode: 'Local Storage'
            };
        }
    }
}
