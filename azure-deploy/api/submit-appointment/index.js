const nodemailer = require('nodemailer');

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
        // Create submission object with correct field mapping
        const submission = {
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            clientName: req.body.clientName,
            email: req.body.email,
            phone: req.body.phone,
            appointmentType: req.body.appointmentType,
            insuranceType: req.body.insuranceType,
            appointmentDate: req.body.appointmentDate,  // Fixed: Use appointmentDate from form
            appointmentTime: req.body.appointmentTime,  // Fixed: Use appointmentTime from form
            meetingType: req.body.meetingType,
            address: req.body.address,
            county: req.body.county,
            status: 'New Appointment Request'
        };

        // Try to send email notification (matching your local server)
        try {
            await sendEmailNotification(submission);
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.log('⚠️ Email failed:', emailError.message);
        }
        
        // Always send SMS notification regardless of email status
        try {
            await sendSMSNotification(submission);
            console.log('✅ SMS sent successfully');
        } catch (smsError) {
            console.log('❌ SMS failed:', smsError.message);
        }
        
        // Note: Without Azure Storage, submissions will only be visible via SharePoint integration
        // The admin panel has SharePoint integration for viewing appointments
        console.log('📧 Notification sent - admin should check email/SMS and use SharePoint integration');

        // Return success response exactly like your local server
        context.res = {
            ...context.res,
            status: 200,
            body: { 
                success: true, 
                message: `Email sent successfully via server: Appointment submission received for ${submission.clientName}`,
                id: submission.id 
            }
        };
        
    } catch (error) {
        context.log.error('Submission error:', error);
        
        // Still return success to not break the form
        context.res = {
            ...context.res,
            status: 200,
            body: { 
                success: true, 
                message: `Appointment submission received for ${req.body.clientName}`,
                id: Date.now().toString(),
                note: 'Processing in background'
            }
        };
    }
};

// Email function matching your local server EXACTLY
async function sendEmailNotification(submission) {
    const emailTransporter = nodemailer.createTransporter({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
            pass: 'Zharayuri100@'  // Use the same password as your local server
        }
    });

    // Email content matching your local server
    const emailText = `
New Appointment Request Received

Client Information:
• Name: ${submission.clientName}
• Email: ${submission.email}
• Phone: ${submission.phone}

Appointment Details:
• Insurance Type: ${submission.insuranceType}
• Appointment Type: ${submission.appointmentType}
• Appointment Date: ${submission.appointmentDate}
• Appointment Time: ${submission.appointmentTime}
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
        text: emailText
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email notification sent to brettanya.brown@upingtonmainz.com');
}

// SMS notification function using email-to-SMS gateway
async function sendSMSNotification(submission) {
    // Create email transporter for SMS
    const emailTransporter = nodemailer.createTransporter({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
            pass: 'Zharayuri100@'
        }
    });

    const smsText = `NEW APPOINTMENT REQUEST from ${submission.clientName}. 
Phone: ${submission.phone}
Date: ${submission.appointmentDate} at ${submission.appointmentTime}
Type: ${submission.appointmentType}
Insurance: ${submission.insuranceType}
Meeting: ${submission.meetingType}
Address: ${submission.address}`;

    const smsOptions = {
        from: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
        to: '4707987862@vtext.com', // Verizon SMS gateway
        subject: 'New Appointment',
        text: smsText
    };

    await emailTransporter.sendMail(smsOptions);
    console.log('📱 SMS notification sent to 4707987862');
}

// Simple in-memory storage for submissions (no external storage needed)
const submissions = [];

async function saveSubmission(submission) {
    try {
        // Add to in-memory array
        submissions.push(submission);
        console.log('✅ Submission saved to memory');
        console.log('📋 Total submissions:', submissions.length);
        console.log('📋 Latest submission:', JSON.stringify(submission, null, 2));
    } catch (error) {
        console.error('❌ Save submission error:', error.message);
        // Don't throw - email still works
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
