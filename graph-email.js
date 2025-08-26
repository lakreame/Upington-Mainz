// Modern email solution using Microsoft Graph API
// This bypasses SMTP authentication issues with organizational accounts

const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@microsoft/microsoft-graph-client');

// Custom authentication provider for server-to-server scenarios
class GraphAuthProvider {
    constructor(clientId, clientSecret, tenantId) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
    }

    async getAccessToken() {
        const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams();
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        params.append('scope', 'https://graph.microsoft.com/.default');
        params.append('grant_type', 'client_credentials');

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data.access_token;
    }
}

// Graph client setup
async function createGraphClient() {
    const authProvider = new GraphAuthProvider(
        'your-client-id',     // Azure App Registration Client ID
        'your-client-secret', // Azure App Registration Client Secret
        'ebb50a60-c0fc-4e5f-b52d-3a9f7890b416' // Your tenant ID
    );

    return Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                return await authProvider.getAccessToken();
            }
        }
    });
}

// Send email using Graph API
async function sendEmailViaGraph(to, subject, htmlContent, textContent) {
    try {
        const graphClient = await createGraphClient();
        
        const message = {
            subject: subject,
            body: {
                contentType: 'HTML',
                content: htmlContent
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ]
        };

        await graphClient
            .users('BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com')
            .sendMail({ message })
            .post();

        console.log('✅ Email sent successfully via Microsoft Graph API');
        return true;
    } catch (error) {
        console.error('❌ Failed to send email via Graph API:', error.message);
        return false;
    }
}

module.exports = { sendEmailViaGraph };
