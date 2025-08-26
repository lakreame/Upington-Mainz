
const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    context.log('Submit appointment request received');
    let body = req.body;

    // Fallback: try to parse raw body if not already parsed
    if (!body && req.rawBody) {
        try {
            body = JSON.parse(req.rawBody);
        } catch (e) {
            context.log('Failed to parse rawBody:', e.message);
        }
    }
    context.log('Request body:', body);

    // Check for missing body
    if (!body) {
        context.res = {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: { success: false, message: 'Missing request body.' }
        };
        return;
    }

    // Extract submission data from request
    const submission = body;
    submission.submittedAt = Date.now();

    // Send email notification
    await sendEmailNotification(submission);

    // Respond to client
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: { success: true, message: 'Appointment submitted successfully.' }
    };
};

async function sendEmailNotification(submission) {
    try {
        // Configure nodemailer transport (use your SMTP credentials)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'your@email.com',
                pass: process.env.SMTP_PASS || 'yourpassword'
            }
        });

        const mailOptions = {
            from: 'no-reply@upingtonmainz.com',
            to: 'brettanya.brown@upingtonmainz.com',
            subject: `🆕 New Appointment Request - ${submission.fullName || submission.clientName}`,
            text: `New Appointment Request Received!

Client Details:
• Name: ${submission.fullName || submission.clientName}
• Email: ${submission.email}
• Phone: ${submission.phone}

Appointment Details:
• Insurance Type: ${submission.insuranceType}
• Appointment Type: ${submission.appointmentType}
• Preferred Date: ${submission.date || submission.preferredDate}
• Preferred Time: ${submission.time || submission.preferredTime}
• Meeting Type: ${submission.meetingType}

Location:
• Address: ${submission.address}
• County: ${submission.county}

Submitted: ${new Date(submission.submittedAt).toLocaleString()}

Please log into your admin dashboard to review and respond to this request:
🔗 https://upingtonmainz.com/admin.html`
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via nodemailer');
    } catch (error) {
        console.error('❌ Nodemailer email sending failed:', error.message);
        // Don't throw error - form submission should still succeed
    }
}
