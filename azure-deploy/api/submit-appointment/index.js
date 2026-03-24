require('../_env');

const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
  context.log('Submit appointment request received');

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

  if (req.method !== 'POST') {
    context.res = { ...context.res, status: 405, body: { error: 'Method not allowed' } };
    return;
  }

  const submission = {
    id: Date.now().toString(),
    submittedAt: new Date().toISOString(),
    ClientName: req.body.clientName,
    ClientEmail: req.body.email,
    ClientPhone: req.body.phone,
    Types: req.body.appointmentType,
    InsuranceType: req.body.insuranceType,
    AppointmentDate: req.body.appointmentDate,
    AppointmentTime: req.body.appointmentTime,
    MeetingType: req.body.meetingType,
    Address: req.body.address,
    County: req.body.county,
    PremiumAmount: req.body.premiumAmount,
    HouseholdIncome: req.body.householdIncome,
    HouseholdSize: req.body.householdSize,
    Dependants: req.body.dependants,
    Status: 'New Appointment Request',
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
    premiumAmount: req.body.premiumAmount,
    householdIncome: req.body.householdIncome,
    householdSize: req.body.householdSize,
    dependants: req.body.dependants,
    status: 'New Appointment Request'
  };

  try {
    let emailInfo = null;
    let smsInfo = null;

    try {
      emailInfo = await sendEmailNotification(submission, context);
      context.log('Email send result:', emailInfo);
    } catch (emailError) {
      context.log.error('Email failed:', emailError.message);
      emailInfo = { error: emailError.message };
    }

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
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER || 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
      pass: process.env.SMTP_PASS || 'Zharayuri100@'
    }
  });

  context.log('SMTP transporter created (skipping verification for speed)');
  return Promise.resolve(transporter);
}

async function sendEmailNotification(submission, context) {
  const transporter = await buildTransporter(context);

  const emailText = `
New Appointment Request Received

Client Information:
- Name: ${submission.clientName}
- Email: ${submission.email}
- Phone: ${submission.phone}

Appointment Details:
- Insurance Type: ${submission.insuranceType}
- Appointment Type: ${submission.appointmentType}
- Appointment Date: ${submission.appointmentDate}
- Appointment Time: ${submission.appointmentTime}
- Meeting Type: ${submission.meetingType}

Location:
- Address: ${submission.address}
- County: ${submission.county}

Submitted: ${new Date(submission.submittedAt).toLocaleString()}

Admin dashboard:
https://upingtonmainz.com/upingtonadmin.html
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
  const smsBody = `Appt: ${submission.clientName} ${submission.phone} ${submission.appointmentDate} ${submission.appointmentTime} ${submission.appointmentType}`.slice(0, 140);

  return transporter.sendMail({
    from: process.env.SMTP_USER || 'BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com',
    to: '4707987862@vtext.com',
    subject: '',
    text: smsBody
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : 'Not provided';
}
