const nodemailer = require('nodemailer');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Submit appointment request received');
    
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

    if (req.method !== 'POST') {
        context.res = {
            ...context.res,
            status: 405,
            body: { error: 'Method not allowed' }
        };
        return;
    }

    try {
        const submission = {
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            clientName: req.body.clientName,
            email: req.body.email,
            phone: req.body.phone,
            appointmentType: req.body.appointmentType,
            insuranceType: req.body.insuranceType,
            preferredDate: req.body.preferredDate,
            preferredTime: req.body.preferredTime,
            meetingType: req.body.meetingType,
            address: req.body.address,
            county: req.body.county,
            status: 'New Appointment Request'
        };

        // Store submission in Azure Storage (instead of local file)
        await storeSubmission(submission);
        
        // Send email notification
        await sendEmailNotification(submission);
        
        context.log('📧 New submission received and processed:', submission.clientName);
        
        context.res = {
            ...context.res,
            status: 200,
            body: { 
                success: true, 
                message: `Appointment submission received for ${submission.clientName}`,
                id: submission.id 
            }
        };
        
    } catch (error) {
        context.log.error('Submission error:', error);
        context.res = {
            ...context.res,
            status: 500,
            body: { error: 'Failed to save submission' }
        };
    }
};

// Store submission in Azure Blob Storage
async function storeSubmission(submission) {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            console.log('⚠️ No storage connection string - using in-memory storage');
            return;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('submissions');
        
        // Ensure container exists
        await containerClient.createIfNotExists({ access: 'private' });
        
        const blobName = `submission-${submission.id}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.upload(
            JSON.stringify(submission, null, 2),
            JSON.stringify(submission, null, 2).length,
            {
                blobHTTPHeaders: { blobContentType: 'application/json' }
            }
        );
        
        console.log('✅ Submission stored in Azure Storage');
    } catch (error) {
        console.error('❌ Storage error:', error.message);
        // Don't throw - email should still work
    }
}

// Email notification function (adapted from your server.js)
async function sendEmailNotification(submission) {
    try {
        const emailTransporter = nodemailer.createTransporter({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Check if email password is configured
        if (!process.env.EMAIL_PASSWORD) {
            throw new Error('EMAIL_PASSWORD environment variable not configured');
        }

        const emailBody = `
New Appointment Request Received!

Client Details:
• Name: ${submission.clientName}
• Email: ${submission.email}
• Phone: ${submission.phone}

Appointment Details:
• Insurance Type: ${submission.insuranceType}
• Appointment Type: ${submission.appointmentType}
• Preferred Date: ${submission.preferredDate}
• Preferred Time: ${submission.preferredTime}
• Meeting Type: ${submission.meetingType}

Location:
• Address: ${submission.address}
• County: ${submission.county}

Submitted: ${new Date(submission.submittedAt).toLocaleString()}

Please log into your admin dashboard to review and respond to this request:
🔗 https://upingtonmainz.com/admin.html
        `.trim();

        const mailOptions = {
            from: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
            to: 'brettanya.brown@upingtonmainz.com',
            subject: `🆕 New Appointment Request - ${submission.clientName}`,
            text: emailBody,
            html: `
                <h2>🆕 New Appointment Request</h2>
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h3>Client Details:</h3>
                    <ul>
                        <li><strong>Name:</strong> ${submission.clientName}</li>
                        <li><strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a></li>
                        <li><strong>Phone:</strong> <a href="tel:${submission.phone}">${submission.phone}</a></li>
                    </ul>
                    
                    <h3>Appointment Details:</h3>
                    <ul>
                        <li><strong>Insurance Type:</strong> ${submission.insuranceType}</li>
                        <li><strong>Appointment Type:</strong> ${submission.appointmentType}</li>
                        <li><strong>Preferred Date:</strong> ${submission.preferredDate}</li>
                        <li><strong>Preferred Time:</strong> ${submission.preferredTime}</li>
                        <li><strong>Meeting Type:</strong> ${submission.meetingType}</li>
                    </ul>
                    
                    <h3>Location:</h3>
                    <ul>
                        <li><strong>Address:</strong> ${submission.address}</li>
                        <li><strong>County:</strong> ${submission.county}</li>
                    </ul>
                    
                    <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
                    
                    <p style="background: #f0f8ff; padding: 15px; border-radius: 5px;">
                        <strong>Next Steps:</strong> Log into your admin dashboard to review and respond to this request:<br>
                        <a href="https://upingtonmainz.com/admin.html" style="color: #1a56db; text-decoration: none; font-weight: bold;">🔗 Open Admin Dashboard</a>
                    </p>
                </div>
            `
        };

        console.log('📧 Attempting to send email notification...');
        console.log('📧 From:', mailOptions.from);
        console.log('📧 To:', mailOptions.to);
        
        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to brettanya.brown@upingtonmainz.com');
        
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        // Don't throw error - form submission should still succeed
    }
}
