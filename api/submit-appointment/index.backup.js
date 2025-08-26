// Backup of submit-appointment/index.js before SendGrid migration
// Created by GitHub Copilot on 2025-08-20

const nodemailer = require('nodemailer');
const { BlobServiceClient } = require('@azure/storage-blob');

async function sendEmailNotification(submission) {
    try {
        const emailTransporter = nodemailer.createTransport({
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
            console.log('⚠️ EMAIL_PASSWORD not configured - skipping email notification');
            console.log('📋 Submission details for manual processing:', {
                client: submission.clientName,
                email: submission.email,
                phone: submission.phone,
                date: submission.preferredDate,
                time: submission.preferredTime
            });
            throw new Error('Email configuration not available in Azure Functions');
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
