const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for Azure AD
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Store submissions in a JSON file
const submissionsFile = path.join(__dirname, 'submissions.json');

// Ensure submissions file exists
if (!fs.existsSync(submissionsFile)) {
    fs.writeFileSync(submissionsFile, '[]');
}

// Email configuration 
let emailTransporter = null;

try {
    // Office 365 with Authenticated SMTP (✅ Security Defaults Disabled!)
    emailTransporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,            // STARTTLS on 587
        requireTLS: true,         // enforce TLS upgrade
        auth: {
            user: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
            pass: 'Zharayuri100@' // Correct password for organizational account
        }
        // no custom tls.ciphers; let Nodemailer negotiate modern TLS
    });

    console.log('📧 Email transporter configured for Office 365');

    // Option 2: Gmail (BACKUP - No longer needed since Office 365 works!)
    /*
    // Option 2: Gmail (BACKUP - No longer needed since Office 365 works!)
    /*
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-gmail@gmail.com',     // Replace with your Gmail
            pass: 'your-gmail-app-password'   // Gmail App Password
        }
    });
    */

    console.log('📧 Email transporter configured with Office 365 Authenticated SMTP');

    // Option 2: Gmail (BACKUP - Works immediately with App Password)
    /*
    // Create Gmail account and enable 2FA, then create App Password
    /*
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-gmail@gmail.com',     // Replace with Gmail account
            pass: 'your-gmail-app-password'   // Replace with Gmail App Password
        }
    });
    */

    console.log('📧 Email transporter configured with Office 365 App Password');
    
    // Test the email configuration
    emailTransporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email configuration test failed:', error.message);
            console.log('📝 Please check email credentials in server.js');
            emailTransporter = null;
        } else {
            console.log('✅ Email server is ready to send notifications to brettanya.brown@upingtonmainz.com');
        }
    });
    
} catch (error) {
    console.error('❌ Email setup failed:', error.message);
    console.log('📨 Emails will be logged only (no actual sending)');
}

// API endpoint to submit appointment
app.post('/api/submit-appointment', async (req, res) => {
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

        // Read existing submissions
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        
        // Add new submission
        submissions.push(submission);
        
        // Write back to file
        fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
        
        // Send email notification
        await sendEmailNotification(submission);
        
        console.log('📧 New submission received and processed:', submission.clientName);
        
        res.json({ success: true, id: submission.id });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Failed to save submission' });
    }
});

// Get submissions for admin
app.get('/api/submissions', (req, res) => {
    try {
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        res.json(submissions);
    } catch (error) {
        console.error('Get submissions error:', error);
        res.json([]);
    }
});

// Delete submission
app.delete('/api/submissions/:id', (req, res) => {
    try {
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        const filtered = submissions.filter(s => s.id !== req.params.id);
        fs.writeFileSync(submissionsFile, JSON.stringify(filtered, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

// Email notification function
async function sendEmailNotification(submission) {
    try {
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

Please log into your admin dashboard to review and respond to this request.
        `.trim();

        const mailOptions = {
            from: 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com', // Use authenticated email as sender
            to: 'brettanya.brown@upingtonmainz.com', // Send notifications to your preferred email
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
        console.log('📧 Subject:', mailOptions.subject);
        
        if (emailTransporter) {
            await emailTransporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully to brettanya.brown@upingtonmainz.com');
        } else {
            console.log('❌ Email transporter not configured - email NOT sent');
            console.log('📧 Email content would have been:');
            console.log(emailBody);
        }
        
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        // Don't throw error - form submission should still succeed
    }
}

app.listen(port, () => {
    console.log('='.repeat(60));
    console.log('🚀 Upington Mainz Server Running');
    console.log('='.repeat(60));
    console.log(`📋 Admin dashboard: http://localhost:${port}/admin.html`);
    console.log(`📝 Booking form: http://localhost:${port}/book.html`);
    console.log('📧 Email notifications: brettanya.brown@upingtonmainz.com');
    console.log('🔧 Press Ctrl+C to stop');
    console.log('='.repeat(60));
});
