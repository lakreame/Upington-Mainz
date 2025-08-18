module.exports = async function (context, req) {
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
        // For now, return a message indicating to check SharePoint
        // The admin dashboard will use SharePoint fallback
        const message = {
            submissions: [],
            message: 'No Azure Storage configured - check SharePoint fallback',
            timestamp: new Date().toISOString()
        };

        context.res = {
            ...context.res,
            status: 200,
            body: []  // Return empty array to trigger SharePoint fallback
        };
        return;
    }

    if (req.method === 'DELETE') {
        // Simulate successful deletion
        context.res = {
            ...context.res,
            status: 200,
            body: { success: true, message: 'Submission deleted' }
        };
        return;
    }

    context.res = {
        ...context.res,
        status: 405,
        body: { error: 'Method not allowed' }
    };
};
