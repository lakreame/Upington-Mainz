const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  context.log('Get submissions request received');

  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  if (req.method === 'GET') {
    try {
      const submissions = await getSubmissions();
      context.res = { ...context.res, status: 200, body: submissions };
    } catch (error) {
      context.log.error('Get submissions error:', error);
      context.res = { ...context.res, status: 500, body: [] };
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const submissionId = context.bindingData.id || req.params?.id;
      if (!submissionId) {
        context.res = {
          ...context.res,
          status: 400,
          body: { error: 'Submission ID is required' }
        };
        return;
      }

      await deleteSubmission(submissionId);
      context.res = { ...context.res, status: 200, body: { success: true } };
    } catch (error) {
      context.log.error('Delete submission error:', error);
      context.res = {
        ...context.res,
        status: 500,
        body: { error: 'Failed to delete submission' }
      };
    }
    return;
  }

  context.res = {
    ...context.res,
    status: 405,
    body: { error: 'Method not allowed' }
  };
};

async function getSubmissions() {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      console.log('No storage connection string configured; returning empty list');
      return [];
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('submissions');

    const submissions = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.startsWith('submission-') && blob.name.endsWith('.json')) {
        try {
          const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
          const downloadResponse = await blockBlobClient.download();
          const content = await streamToString(downloadResponse.readableStreamBody);
          submissions.push(JSON.parse(content));
        } catch (blobError) {
          console.error(`Error reading blob ${blob.name}:`, blobError.message);
        }
      }
    }

    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return submissions;
  } catch (error) {
    console.error('Storage error:', error.message);
    return [];
  }
}

async function deleteSubmission(submissionId) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('No storage connection string configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('submissions');

  const blobName = `submission-${submissionId}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', data => chunks.push(data.toString()));
    readableStream.on('end', () => resolve(chunks.join('')));
    readableStream.on('error', reject);
  });
}
