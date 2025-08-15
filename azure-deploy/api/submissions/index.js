const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Get submissions request received');
    
    // CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    };

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    if (req.method !== 'GET') {
        context.res = {
            ...context.res,
            status: 405,
            body: { error: 'Method not allowed' }
        };
        return;
    }

    try {
        const submissions = await getSubmissions();
        
        context.res = {
            ...context.res,
            status: 200,
            body: submissions
        };
        
    } catch (error) {
        context.log.error('Get submissions error:', error);
        context.res = {
            ...context.res,
            status: 500,
            body: []
        };
    }
};

// Get submissions from Azure Blob Storage
async function getSubmissions() {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            console.log('⚠️ No storage connection string - returning empty array');
            return [];
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('submissions');
        
        const submissions = [];
        
        // List all blobs in the container
        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.name.startsWith('submission-') && blob.name.endsWith('.json')) {
                try {
                    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
                    const downloadResponse = await blockBlobClient.download();
                    const content = await streamToString(downloadResponse.readableStreamBody);
                    const submission = JSON.parse(content);
                    submissions.push(submission);
                } catch (blobError) {
                    console.error(`Error reading blob ${blob.name}:`, blobError.message);
                }
            }
        }
        
        // Sort by submitted date (newest first)
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        console.log(`✅ Retrieved ${submissions.length} submissions from storage`);
        return submissions;
        
    } catch (error) {
        console.error('❌ Storage error:', error.message);
        return [];
    }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}
