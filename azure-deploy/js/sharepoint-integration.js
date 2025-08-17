// SharePoint Integration Configuration for Upington Mainz Admin Dashboard
// This file configures SharePoint connectivity with Azure Function proxy support

const SHAREPOINT_CONFIG = {
    // Production SharePoint site
    siteUrl: 'https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz',
    
    // Azure Function proxy endpoint (when deployed)
    proxyUrl: 'https://upington-mainz-functions.azurewebsites.net/api/sharepoint',
    
    // Fallback to direct SharePoint (will likely fail due to CORS)
    useProxy: true,
    
    // Azure AD App Configuration
    clientId: 'ccd7cc4d-1ee9-47a5-986e-cd615e0695ad',
    
    // SharePoint list configurations
    lists: {
        clients: {
            name: 'Clients',
            fields: ['Title', 'Email', 'Phone', 'Status', 'DateCreated', 'AssignedAgent']
        },
        appointments: {
            name: 'Appointments',
            fields: ['Title', 'ClientName', 'DateTime', 'Type', 'Status', 'Notes']
        },
        leads: {
            name: 'Leads',
            fields: ['Title', 'Email', 'Phone', 'Source', 'Status', 'Notes', 'DateCreated']
        },
        policies: {
            name: 'Policies',
            fields: ['Title', 'PolicyNumber', 'ClientName', 'Type', 'Premium', 'Status', 'StartDate', 'EndDate']
        }
    },
    
    // Connection status
    connectionStatus: 'unknown', // 'connected', 'error', 'unknown'
    lastTestTime: null
};

// SharePoint API Helper Functions
class SharePointConnector {
    constructor() {
        this.baseUrl = SHAREPOINT_CONFIG.useProxy ? SHAREPOINT_CONFIG.proxyUrl : SHAREPOINT_CONFIG.siteUrl;
        this.isProxy = SHAREPOINT_CONFIG.useProxy;
    }
    
    // Test connection to SharePoint
    async testConnection() {
        try {
            const endpoint = this.isProxy ? 
                `${this.baseUrl}/web` : 
                `${this.baseUrl}/_api/web`;
                
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: this.getHeaders(),
                mode: this.isProxy ? 'cors' : 'no-cors'
            });
            
            if (this.isProxy && response.ok) {
                const data = await response.json();
                SHAREPOINT_CONFIG.connectionStatus = 'connected';
                SHAREPOINT_CONFIG.lastTestTime = new Date().toISOString();
                return {
                    success: true,
                    message: 'SharePoint connection successful',
                    data: data
                };
            } else if (!this.isProxy) {
                // For direct connection, we can't really test due to CORS
                // but we can check if the request was made
                SHAREPOINT_CONFIG.connectionStatus = 'cors-blocked';
                return {
                    success: false,
                    message: 'Direct SharePoint connection blocked by CORS policy',
                    suggestion: 'Use Azure Function proxy for server-side authentication'
                };
            } else {
                SHAREPOINT_CONFIG.connectionStatus = 'error';
                return {
                    success: false,
                    message: `Connection failed: ${response.status} ${response.statusText}`,
                    suggestion: 'Check Azure Function deployment and configuration'
                };
            }
        } catch (error) {
            SHAREPOINT_CONFIG.connectionStatus = 'error';
            return {
                success: false,
                message: error.message,
                suggestion: 'Check network connectivity and Azure Function deployment'
            };
        }
    }
    
    // Get appropriate headers for requests
    getHeaders() {
        const headers = {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
        };
        
        if (this.isProxy) {
            // Azure Function will handle authentication
            headers['X-SharePoint-Site'] = SHAREPOINT_CONFIG.siteUrl;
        }
        
        return headers;
    }
    
    // Get items from SharePoint list
    async getListItems(listName) {
        try {
            const endpoint = this.isProxy ?
                `${this.baseUrl}/lists/${listName}/items` :
                `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
                
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    items: this.isProxy ? data : data.d.results
                };
            } else {
                return {
                    success: false,
                    error: `Failed to get items: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Add item to SharePoint list
    async addListItem(listName, itemData) {
        try {
            const endpoint = this.isProxy ?
                `${this.baseUrl}/lists/${listName}/items` :
                `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'X-HTTP-Method': 'POST'
                },
                body: JSON.stringify(this.isProxy ? itemData : { __metadata: { type: `SP.Data.${listName}ListItem` }, ...itemData })
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    item: this.isProxy ? data : data.d
                };
            } else {
                return {
                    success: false,
                    error: `Failed to add item: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Update item in SharePoint list
    async updateListItem(listName, itemId, itemData) {
        try {
            const endpoint = this.isProxy ?
                `${this.baseUrl}/lists/${listName}/items/${itemId}` :
                `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'X-HTTP-Method': 'MERGE',
                    'If-Match': '*'
                },
                body: JSON.stringify(this.isProxy ? itemData : { __metadata: { type: `SP.Data.${listName}ListItem` }, ...itemData })
            });
            
            if (response.ok || response.status === 204) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: `Failed to update item: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Delete item from SharePoint list
    async deleteListItem(listName, itemId) {
        try {
            const endpoint = this.isProxy ?
                `${this.baseUrl}/lists/${listName}/items/${itemId}` :
                `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;
                
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    ...this.getHeaders(),
                    'If-Match': '*'
                }
            });
            
            if (response.ok || response.status === 204) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: `Failed to delete item: ${response.status} ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create global instance
window.sharePointConnector = new SharePointConnector();

// Data Sync Helper Functions
class DataSyncManager {
    constructor() {
        this.syncInProgress = false;
        this.lastSyncTime = localStorage.getItem('lastSyncTime');
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
    }
    
    // Sync data from localStorage to SharePoint
    async syncToSharePoint() {
        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return;
        }
        
        this.syncInProgress = true;
        const results = {
            clients: { success: 0, errors: 0 },
            appointments: { success: 0, errors: 0 },
            leads: { success: 0, errors: 0 },
            policies: { success: 0, errors: 0 }
        };
        
        try {
            // Sync each entity type
            for (const [entityType, _] of Object.entries(SHAREPOINT_CONFIG.lists)) {
                const localData = JSON.parse(localStorage.getItem(entityType) || '[]');
                const syncedIds = JSON.parse(localStorage.getItem(`${entityType}_synced`) || '[]');
                
                for (const item of localData) {
                    if (!syncedIds.includes(item.id)) {
                        const result = await window.sharePointConnector.addListItem(
                            SHAREPOINT_CONFIG.lists[entityType].name,
                            this.transformForSharePoint(entityType, item)
                        );
                        
                        if (result.success) {
                            syncedIds.push(item.id);
                            results[entityType].success++;
                        } else {
                            console.error(`Failed to sync ${entityType} item:`, result.error);
                            results[entityType].errors++;
                        }
                    }
                }
                
                localStorage.setItem(`${entityType}_synced`, JSON.stringify(syncedIds));
            }
            
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            this.lastSyncTime = new Date().toISOString();
            
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.syncInProgress = false;
        }
        
        return results;
    }
    
    // Sync data from SharePoint to localStorage
    async syncFromSharePoint() {
        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return;
        }
        
        this.syncInProgress = true;
        const results = {
            clients: { loaded: 0, errors: 0 },
            appointments: { loaded: 0, errors: 0 },
            leads: { loaded: 0, errors: 0 },
            policies: { loaded: 0, errors: 0 }
        };
        
        try {
            for (const [entityType, config] of Object.entries(SHAREPOINT_CONFIG.lists)) {
                const result = await window.sharePointConnector.getListItems(config.name);
                
                if (result.success) {
                    const transformedData = result.items.map(item => 
                        this.transformFromSharePoint(entityType, item)
                    );
                    
                    localStorage.setItem(entityType, JSON.stringify(transformedData));
                    results[entityType].loaded = transformedData.length;
                } else {
                    console.error(`Failed to load ${entityType}:`, result.error);
                    results[entityType].errors++;
                }
            }
            
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            this.lastSyncTime = new Date().toISOString();
            
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.syncInProgress = false;
        }
        
        return results;
    }
    
    // Transform data for SharePoint format
    transformForSharePoint(entityType, item) {
        switch (entityType) {
            case 'clients':
                return {
                    Title: item.name,
                    Email: item.email,
                    Phone: item.phone || '',
                    Status: item.status,
                    AssignedAgent: item.assignedAgent || ''
                };
            case 'appointments':
                return {
                    Title: `${item.client} - ${item.type}`,
                    ClientName: item.client,
                    DateTime: item.datetime,
                    Type: item.type,
                    Status: item.status,
                    Notes: item.notes || ''
                };
            case 'leads':
                return {
                    Title: item.name,
                    Email: item.email,
                    Phone: item.phone || '',
                    Source: item.source,
                    Status: item.status,
                    Notes: item.notes || ''
                };
            case 'policies':
                return {
                    Title: `${item.client} - ${item.type}`,
                    PolicyNumber: item.policyNumber,
                    ClientName: item.client,
                    Type: item.type,
                    Premium: item.premium.toString(),
                    Status: item.status,
                    StartDate: item.startDate,
                    EndDate: item.endDate
                };
            default:
                return item;
        }
    }
    
    // Transform data from SharePoint format
    transformFromSharePoint(entityType, item) {
        const baseItem = {
            id: item.Id || item.ID || Date.now().toString(),
            createdAt: item.Created || new Date().toISOString()
        };
        
        switch (entityType) {
            case 'clients':
                return {
                    ...baseItem,
                    name: item.Title,
                    email: item.Email,
                    phone: item.Phone,
                    status: item.Status,
                    assignedAgent: item.AssignedAgent
                };
            case 'appointments':
                return {
                    ...baseItem,
                    client: item.ClientName,
                    datetime: item.DateTime,
                    type: item.Type,
                    status: item.Status,
                    notes: item.Notes
                };
            case 'leads':
                return {
                    ...baseItem,
                    name: item.Title,
                    email: item.Email,
                    phone: item.Phone,
                    source: item.Source,
                    status: item.Status,
                    notes: item.Notes
                };
            case 'policies':
                return {
                    ...baseItem,
                    client: item.ClientName,
                    policyNumber: item.PolicyNumber,
                    type: item.Type,
                    premium: parseFloat(item.Premium || '0'),
                    status: item.Status,
                    startDate: item.StartDate,
                    endDate: item.EndDate
                };
            default:
                return baseItem;
        }
    }
    
    // Check if sync is needed
    shouldSync() {
        if (!this.lastSyncTime) return true;
        
        const lastSync = new Date(this.lastSyncTime);
        const now = new Date();
        return (now - lastSync) > this.syncInterval;
    }
    
    // Get sync status
    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            shouldSync: this.shouldSync(),
            connectionStatus: SHAREPOINT_CONFIG.connectionStatus
        };
    }
}

// Create global instance
window.dataSyncManager = new DataSyncManager();

// Auto-sync functionality
function initializeAutoSync() {
    // Check connection on page load
    window.sharePointConnector.testConnection().then(result => {
        console.log('SharePoint connection test:', result);
        
        if (result.success) {
            // Try to sync from SharePoint if connection is successful
            window.dataSyncManager.syncFromSharePoint().then(syncResult => {
                console.log('Initial sync from SharePoint:', syncResult);
            });
        }
    });
    
    // Set up periodic sync (if connection is available)
    setInterval(() => {
        if (SHAREPOINT_CONFIG.connectionStatus === 'connected' && 
            window.dataSyncManager.shouldSync()) {
            
            window.dataSyncManager.syncToSharePoint().then(result => {
                console.log('Automatic sync to SharePoint:', result);
            });
        }
    }, window.dataSyncManager.syncInterval);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoSync);
} else {
    initializeAutoSync();
}
