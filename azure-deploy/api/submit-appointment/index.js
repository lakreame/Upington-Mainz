const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
  context.log('Submit appointment request received');

  // CORS
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };
  if (req.method === 'OPTIONS') { context.res.status = 200; return; }
  if (req.method !== 'POST') {
    context.res = { ...context.res, status: 405, body: { error: 'Method not allowed' } };
    return;
  }

  const submission = {
    id: Date.now().toString(),
    submittedAt: new Date().toISOString(),
    clientName: req.body.clientName,
    email: req.body.email,
    phone: req.body.phone,
    appointmentType: req.body.appointmentType,
    insuranceType: req.body.insuranceType,
    appointmentDate: req.body.appointmentDate,
    appointmentTime: req.body.appointmentTime,
    meetingType: req.body.meetingType,
    address: req.body.address,
    county: req.body.county,
    status: 'New Appointment Request'
  };

  try {
    let emailInfo = null;
    let smsInfo = null;
    
    // Try email notification
    try {
      emailInfo = await sendEmailNotification(submission, context);
      context.log('Email send result:', emailInfo);
    } catch (emailError) {
      context.log.error('Email failed:', emailError.message);
      emailInfo = { error: emailError.message };
    }

    // Try SMS notification
    try {
      smsInfo = await sendSMSNotification(submission, context);
      context.log('SMS send result:', smsInfo);
    } catch (smsError) {
      context.log.error('SMS failed:', smsError.message);
      smsInfo = { error: smsError.message };
    }

    context.res = {
      ...context.res,
      status: 200,
      body: {
        success: true,
        message: `Notifications sent for ${submission.clientName}`,
        id: submission.id,
        emailMessageId: emailInfo?.messageId || null,
        smsMessageId: smsInfo?.messageId || null,
        emailError: emailInfo?.error || null,
        smsError: smsInfo?.error || null
      }
    };
  } catch (err) {
    context.log.error('General error:', err);
    // Always return 200 to not break the form - the appointment is still saved to SharePoint
    context.res = {
      ...context.res,
      status: 200,
      body: { 
        success: true, 
        message: `Appointment received for ${submission.clientName}`,
        id: submission.id,
        note: 'Notifications may have failed but appointment was recorded'
      }
    };
  }
};

function buildTransporter(context) {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,          // STARTTLS on 587
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER || 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com', // fallback for now
      pass: process.env.SMTP_PASS || 'Zharayuri100@'  // fallback for now
    }
  });
  
  // Skip verification to avoid blocking - just return the transporter
  context.log('SMTP transporter created (skipping verification for speed)');
  return Promise.resolve(transporter);
}

async function sendEmailNotification(submission, context) {
  const transporter = await buildTransporter(context);

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

Admin dashboard:
https://upingtonmainz.com/admin.html
`.trim();

  return transporter.sendMail({
    from: process.env.SMTP_USER || 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
    to: 'brettanya.brown@upingtonmainz.com',
    subject: `New Appointment Request - ${submission.clientName}`,
    text: emailText
  });
}

async function sendSMSNotification(submission, context) {
  const transporter = await buildTransporter(context);
  // Keep SMS body short to avoid filtering
  const smsBody = `Appt: ${submission.clientName} ${submission.phone} ${submission.appointmentDate} ${submission.appointmentTime} ${submission.appointmentType}`.slice(0, 140);

  return transporter.sendMail({
    from: process.env.SMTP_USER || 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
    to: '4707987862@vtext.com', // Try vzwpix.com if delivery issues
    subject: '',                 // Some gateways ignore subject
    text: smsBody
  });
}
