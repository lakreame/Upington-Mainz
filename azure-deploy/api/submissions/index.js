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

    if (req.method === 'GET') {
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
    } else if (req.method === 'DELETE') {
        try {
            const submissionId = context.bindingData.id || req.params.id;
            if (!submissionId) {
                context.res = {
                    ...context.res,
                    status: 400,
                    body: { error: 'Submission ID is required' }
                };
                return;
            }

            await deleteSubmission(submissionId);
            
            context.res = {
                ...context.res,
                status: 200,
                body: { success: true }
            };
            
        } catch (error) {
            context.log.error('Delete submission error:', error);
            context.res = {
                ...context.res,
                status: 500,
                body: { error: 'Failed to delete submission' }
            };
        }
    } else {
        context.res = {
            ...context.res,
            status: 405,
            body: { error: 'Method not allowed' }
        };
        return;
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

// Delete submission from Azure Blob Storage
async function deleteSubmission(submissionId) {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('No storage connection string configured');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('submissions');
        
        const blobName = `submission-${submissionId}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.delete();
        console.log(`✅ Deleted submission ${submissionId} from storage`);
        
    } catch (error) {
        console.error('❌ Delete error:', error.message);
        throw error;
    }
}
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

    if (req.method === 'GET') {
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
    } else if (req.method === 'DELETE') {
        try {
            const submissionId = context.bindingData.id || req.params.id;
            if (!submissionId) {
                context.res = {
                    ...context.res,
                    status: 400,
                    body: { error: 'Submission ID is required' }
                };
                return;
            }

            await deleteSubmission(submissionId);
            
            context.res = {
                ...context.res,
                status: 200,
                body: { success: true }
            };
            
        } catch (error) {
            context.log.error('Delete submission error:', error);
            context.res = {
                ...context.res,
                status: 500,
                body: { error: 'Failed to delete submission' }
            };
        }
    } else {
        context.res = {
            ...context.res,
            status: 405,
            body: { error: 'Method not allowed' }
        };
        return;
    }
};

// Get submissions from Azure Blob Storage
async function getSubmissions() {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            console.log('⚠️ No storage connection string - returning sample data for testing');
            // Return sample data when Azure Storage not configured
            return [
                {
                    id: 'SAMPLE-001',
                    submittedAt: new Date().toISOString(),
                    clientName: 'Test Client',
                    email: 'test@example.com',
                    phone: '123-456-7890',
                    appointmentType: 'Initial Consultation',
                    insuranceType: 'Life Insurance',
                    preferredDate: '2025-08-20',
                    preferredTime: '10:00',
                    meetingType: 'In-Person',
                    address: 'Test Address',
                    county: 'Test County',
                    status: 'Azure Storage Not Configured'
                }
            ];
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

// Delete submission from Azure Blob Storage
async function deleteSubmission(submissionId) {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('No storage connection string configured');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('submissions');
        
        const blobName = `submission-${submissionId}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.delete();
        console.log(`✅ Deleted submission ${submissionId} from storage`);
        
    } catch (error) {
        console.error('❌ Delete error:', error.message);
        throw error;
    }
}
