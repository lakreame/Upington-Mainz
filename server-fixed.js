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

// IMPORTANT: Configure your email credentials here
// For security, you should use environment variables or a config file
try {
    // Option 1: Outlook/Office 365 (recommended for business)
    emailTransporter = nodemailer.createTransporter({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: 'brettanya.brown@upingtonmainz.com', // Replace with actual email
            pass: 'YOUR_EMAIL_PASSWORD_HERE' // Replace with actual password
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    // Option 2: Gmail (if using Gmail for business)
    // Uncomment below and comment out the Outlook config above:
    /*
    emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: 'brettanya.brown@upingtonmainz.com',
            pass: 'YOUR_GMAIL_APP_PASSWORD' // Generate app password in Gmail settings
        }
    });
    */

    console.log('📧 Email transporter configured');
    
    // Test the email configuration
    emailTransporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email configuration test failed:', error.message);
            console.log('📝 Please update email credentials in server.js');
            emailTransporter = null; // Disable email if config is wrong
        } else {
            console.log('✅ Email server is ready to send notifications');
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
• Type: ${submission.appointmentType}
• Preferred Date: ${submission.preferredDate}
• Preferred Time: ${submission.preferredTime}
• Meeting Type: ${submission.meetingType}

Location:
• Address: ${submission.address}
• County: ${submission.county}

Submitted: ${new Date(submission.submittedAt).toLocaleString()}

Please log into your admin dashboard to review and respond to this request.
        `.trim();

        const mailOptions = {
            from: 'brettanya.brown@upingtonmainz.com',
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
                        <li><strong>Type:</strong> ${submission.appointmentType}</li>
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
                        <strong>Next Steps:</strong> Log into your admin dashboard to review and respond to this request.
                    </p>
                </div>
            `
        };

        // Log email attempt
        console.log('📧 Attempting to send email notification...');
        console.log('📧 To:', mailOptions.to);
        console.log('📧 Subject:', mailOptions.subject);
        
        if (emailTransporter) {
            await emailTransporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully to brettanya.brown@upingtonmainz.com');
        } else {
            console.log('❌ Email transporter not configured - email NOT sent');
            console.log('📝 Please configure email credentials in server.js to enable notifications');
            console.log('📧 Email content (for reference):');
            console.log(emailBody);
        }
        
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        console.log('📝 Check email configuration and credentials');
        // Don't throw error - form submission should still succeed
    }
}

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}/`);
    console.log(`📋 Admin dashboard: http://localhost:${port}/admin.html`);
    console.log(`📝 Booking form: http://localhost:${port}/book.html`);
    console.log('🔧 Press Ctrl+C to stop');
    console.log('');
    console.log('📧 EMAIL SETUP REQUIRED:');
    console.log('   Update email credentials in server.js to enable notifications');
    console.log('   Email will be sent to: brettanya.brown@upingtonmainz.com');
});
