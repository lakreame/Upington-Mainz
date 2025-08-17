const { Client } = require('@azure/msal-node');
const { AuthenticationProvider } = require('@microsoft/microsoft-graph-client');

// Azure Function to proxy SharePoint requests and handle authentication
module.exports = async function (context, req) {
    context.log('SharePoint Proxy Function triggered');

    // Enable CORS
    context.res.headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res = { status: 200 };
        return;
    }

    try {
        const path = req.params.path || '';
        const method = req.method;
        const body = req.body;

        // SharePoint site configuration
        const siteUrl = 'https://upingtonmainzllc1.sharepoint.com/sites/UpingtonMainz';
        const clientId = process.env.SHAREPOINT_CLIENT_ID;
        const clientSecret = process.env.SHAREPOINT_CLIENT_SECRET;
        const tenantId = process.env.SHAREPOINT_TENANT_ID;

        if (!clientId || !clientSecret || !tenantId) {
            context.res = {
                status: 500,
                body: { error: 'SharePoint configuration missing in environment variables' }
            };
            return;
        }

        // Get access token using client credentials flow
        const clientApp = new Client({
            auth: {
                clientId: clientId,
                clientSecret: clientSecret,
                authority: `https://login.microsoftonline.com/${tenantId}`
            }
        });

        const clientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };

        const response = await clientApp.acquireTokenSilent(clientCredentialRequest);
        const accessToken = response.accessToken;

        // Build SharePoint REST API URL
        let apiUrl;
        if (path.startsWith('sites/')) {
            // Microsoft Graph API
            apiUrl = `https://graph.microsoft.com/v1.0/${path}`;
        } else {
            // SharePoint REST API
            apiUrl = `${siteUrl}/_api/${path}`;
        }

        context.log(`Making request to: ${apiUrl}`);

        // Make the SharePoint API call
        const fetch = require('node-fetch');
        const apiResponse = await fetch(apiUrl, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': method !== 'GET' ? await getRequestDigest(siteUrl, accessToken) : undefined
            },
            body: method !== 'GET' ? JSON.stringify(body) : undefined
        });

        const apiData = await apiResponse.json();

        context.res = {
            status: apiResponse.status,
            body: apiData
        };

    } catch (error) {
        context.log.error('SharePoint Proxy Error:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'SharePoint API call failed', 
                details: error.message 
            }
        };
    }
};

// Helper function to get request digest for POST/PUT/DELETE operations
async function getRequestDigest(siteUrl, accessToken) {
    const fetch = require('node-fetch');
    
    try {
        const response = await fetch(`${siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json;odata=verbose'
            }
        });

        const data = await response.json();
        return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
        console.error('Failed to get request digest:', error);
        return '';
    }
}
