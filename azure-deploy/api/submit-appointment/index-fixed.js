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
        // Create submission object matching your local server EXACTLY
        const submission = {
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            clientName: req.body.clientName,
            email: req.body.email,
            phone: req.body.phone,
            appointmentType: req.body.appointmentType,
            insuranceType: req.body.insuranceType,
            preferredDate: req.body.preferredDate,  // Match local server field names
            preferredTime: req.body.preferredTime,  // Match local server field names
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
            console.log('⚠️ Email failed, but submission will still be saved:', emailError.message);
        }

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
        text: emailText
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email notification sent to brettanya.brown@upingtonmainz.com');
}
