require('dotenv').config();
const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const nodemailer = require('nodemailer');
const { createBookingsRouter } = require('./bookings-api');
const { getPool, sql } = require('./db');
const { syncClient, syncAppointment, syncLead, syncPolicy } = require('./sharepoint-sync');

const app = express();
const port = process.env.PORT || 8080;

// Middleware (NO static here — registered AFTER routes so API paths take priority)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for Azure AD
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ── SQL connection is initialised at startup ───────────────────────────────
getPool().catch(err => {
    console.error('❌ Could not connect to Azure SQL:', err.message);
});

// Email configuration 
let emailTransporter = null;

try {
    // Office 365 with Authenticated SMTP (credentials from .env)
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.office365.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    console.log('📧 Email transporter configured for Office 365');

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

// ═══════════════════════════════════════════════════════════════════════════
// SUBMISSIONS  (public booking form submissions)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/submit-appointment  — public booking form
app.post('/api/submit-appointment', async (req, res) => {
    try {
        const id  = Date.now().toString();
        const now = new Date().toISOString();
        const s   = req.body;
        const pool = await getPool();

        await pool.request()
            .input('Id',              sql.NVarChar, id)
            .input('SubmittedAt',     sql.DateTime2, new Date(now))
            .input('ClientName',      sql.NVarChar, s.clientName     || '')
            .input('Email',           sql.NVarChar, s.email          || '')
            .input('Phone',           sql.NVarChar, s.phone          || '')
            .input('AppointmentType', sql.NVarChar, s.appointmentType || '')
            .input('InsuranceType',   sql.NVarChar, s.insuranceType   || '')
            .input('PreferredDate',   sql.NVarChar, s.preferredDate   || '')
            .input('PreferredTime',   sql.NVarChar, s.preferredTime   || '')
            .input('MeetingType',     sql.NVarChar, s.meetingType     || '')
            .input('Address',         sql.NVarChar, s.address         || '')
            .input('County',          sql.NVarChar, s.county          || '')
            .input('Status',          sql.NVarChar, 'New Appointment Request')
            .query(`INSERT INTO Submissions
                (Id,SubmittedAt,ClientName,Email,Phone,AppointmentType,
                 InsuranceType,PreferredDate,PreferredTime,MeetingType,Address,County,Status)
                VALUES
                (@Id,@SubmittedAt,@ClientName,@Email,@Phone,@AppointmentType,
                 @InsuranceType,@PreferredDate,@PreferredTime,@MeetingType,@Address,@County,@Status)`);

        const sub = { id, submittedAt: now, ...s, status: 'New Appointment Request' };
        await sendEmailNotification(sub);
        console.log('📧 New submission from:', s.clientName);
        res.json({ success: true, id });
    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).json({ error: 'Failed to save submission' });
    }
});

// GET /api/submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Submissions ORDER BY SubmittedAt DESC');
        // camelCase field names to match the frontend's existing expectations
        const rows = result.recordset.map(r => ({
            id:              r.Id,
            submittedAt:     r.SubmittedAt,
            clientName:      r.ClientName,
            email:           r.Email,
            phone:           r.Phone,
            appointmentType: r.AppointmentType,
            insuranceType:   r.InsuranceType,
            preferredDate:   r.PreferredDate,
            preferredTime:   r.PreferredTime,
            meetingType:     r.MeetingType,
            address:         r.Address,
            county:          r.County,
            status:          r.Status
        }));
        res.json(rows);
    } catch (err) {
        console.error('Get submissions error:', err);
        res.json([]);
    }
});

// DELETE /api/submissions/:id
app.delete('/api/submissions/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', sql.NVarChar, req.params.id)
            .query('DELETE FROM Submissions WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) {
        console.error('Delete submission error:', err);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

// PUT /api/submissions/:id  (status update from admin)
app.put('/api/submissions/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id',     sql.NVarChar, req.params.id)
            .input('Status', sql.NVarChar, req.body.status || 'Reviewed')
            .query('UPDATE Submissions SET Status = @Status WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) {
        console.error('Update submission error:', err);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/clients', async (req, res) => {
    try {
        const pool = await getPool();
        const q    = req.query.search ? `%${req.query.search}%` : null;
        const result = q
            ? await pool.request()
                .input('q', sql.NVarChar, q)
                .query(`SELECT * FROM Clients
                        WHERE Title LIKE @q OR Email LIKE @q OR Phone LIKE @q OR InsuranceType LIKE @q
                        ORDER BY Created DESC`)
            : await pool.request().query('SELECT * FROM Clients ORDER BY Created DESC');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/clients', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        const result = await pool.request()
            .input('Title',         sql.NVarChar, r.Title         || '')
            .input('Email',         sql.NVarChar, r.Email         || '')
            .input('Phone',         sql.NVarChar, r.Phone         || '')
            .input('DateOfBirth',   sql.Date,     r.DateOfBirth   || null)
            .input('Address',       sql.NVarChar, r.Address       || '')
            .input('InsuranceType', sql.NVarChar, r.InsuranceType || '')
            .input('Status',        sql.NVarChar, r.Status        || 'Active')
            .input('Notes',         sql.NVarChar, r.Notes         || '')
            .query(`INSERT INTO Clients (Title,Email,Phone,DateOfBirth,Address,InsuranceType,Status,Notes)
                    OUTPUT INSERTED.*
                    VALUES (@Title,@Email,@Phone,@DateOfBirth,@Address,@InsuranceType,@Status,@Notes)`);
        syncClient(result.recordset[0]);
        res.json(result.recordset[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        await pool.request()
            .input('Id',            sql.Int,      parseInt(req.params.id))
            .input('Title',         sql.NVarChar, r.Title         || '')
            .input('Email',         sql.NVarChar, r.Email         || '')
            .input('Phone',         sql.NVarChar, r.Phone         || '')
            .input('DateOfBirth',   sql.Date,     r.DateOfBirth   || null)
            .input('Address',       sql.NVarChar, r.Address       || '')
            .input('InsuranceType', sql.NVarChar, r.InsuranceType || '')
            .input('Status',        sql.NVarChar, r.Status        || 'Active')
            .input('Notes',         sql.NVarChar, r.Notes         || '')
            .query(`UPDATE Clients SET Title=@Title,Email=@Email,Phone=@Phone,DateOfBirth=@DateOfBirth,
                    Address=@Address,InsuranceType=@InsuranceType,Status=@Status,Notes=@Notes,
                    Modified=SYSUTCDATETIME() WHERE Id=@Id`);
        syncClient(req.body);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Clients WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/appointments', async (req, res) => {
    try {
        const pool   = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Appointments ORDER BY AppointmentDate ASC');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        const result = await pool.request()
            .input('Title',           sql.NVarChar, r.Title           || '')
            .input('ClientName',      sql.NVarChar, r.ClientName      || '')
            .input('Email',           sql.NVarChar, r.Email           || '')
            .input('Phone',           sql.NVarChar, r.Phone           || '')
            .input('AppointmentDate', sql.DateTime2, r.AppointmentDate ? new Date(r.AppointmentDate) : null)
            .input('EndDate',         sql.DateTime2, r.EndDate         ? new Date(r.EndDate)         : null)
            .input('Type',            sql.NVarChar, r.Type            || '')
            .input('Status',          sql.NVarChar, r.Status          || 'Scheduled')
            .input('Notes',           sql.NVarChar, r.Notes           || '')
            .query(`INSERT INTO Appointments (Title,ClientName,Email,Phone,AppointmentDate,EndDate,Type,Status,Notes)
                    OUTPUT INSERTED.*
                    VALUES (@Title,@ClientName,@Email,@Phone,@AppointmentDate,@EndDate,@Type,@Status,@Notes)`);
        syncAppointment(result.recordset[0]);
        res.json(result.recordset[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        await pool.request()
            .input('Id',             sql.Int,      parseInt(req.params.id))
            .input('Title',          sql.NVarChar, r.Title           || '')
            .input('ClientName',     sql.NVarChar, r.ClientName      || '')
            .input('Email',          sql.NVarChar, r.Email           || '')
            .input('Phone',          sql.NVarChar, r.Phone           || '')
            .input('AppointmentDate',sql.DateTime2, r.AppointmentDate ? new Date(r.AppointmentDate) : null)
            .input('EndDate',        sql.DateTime2, r.EndDate         ? new Date(r.EndDate)         : null)
            .input('Type',           sql.NVarChar, r.Type            || '')
            .input('Status',         sql.NVarChar, r.Status          || 'Scheduled')
            .input('Notes',          sql.NVarChar, r.Notes           || '')
            .query(`UPDATE Appointments SET Title=@Title,ClientName=@ClientName,Email=@Email,Phone=@Phone,
                    AppointmentDate=@AppointmentDate,EndDate=@EndDate,Type=@Type,Status=@Status,Notes=@Notes,
                    Modified=SYSUTCDATETIME() WHERE Id=@Id`);
        syncAppointment(req.body);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Appointments WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/leads', async (req, res) => {
    try {
        const pool   = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Leads ORDER BY Created DESC');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/leads', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        const result = await pool.request()
            .input('Title',    sql.NVarChar, r.Title    || '')
            .input('Email',    sql.NVarChar, r.Email    || '')
            .input('Phone',    sql.NVarChar, r.Phone    || '')
            .input('Source',   sql.NVarChar, r.Source   || '')
            .input('Interest', sql.NVarChar, r.Interest || '')
            .input('Status',   sql.NVarChar, r.Status   || 'New')
            .input('Notes',    sql.NVarChar, r.Notes    || '')
            .query(`INSERT INTO Leads (Title,Email,Phone,Source,Interest,Status,Notes)
                    OUTPUT INSERTED.*
                    VALUES (@Title,@Email,@Phone,@Source,@Interest,@Status,@Notes)`);
        syncLead(result.recordset[0]);
        res.json(result.recordset[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        await pool.request()
            .input('Id',       sql.Int,      parseInt(req.params.id))
            .input('Title',    sql.NVarChar, r.Title    || '')
            .input('Email',    sql.NVarChar, r.Email    || '')
            .input('Phone',    sql.NVarChar, r.Phone    || '')
            .input('Source',   sql.NVarChar, r.Source   || '')
            .input('Interest', sql.NVarChar, r.Interest || '')
            .input('Status',   sql.NVarChar, r.Status   || 'New')
            .input('Notes',    sql.NVarChar, r.Notes    || '')
            .query(`UPDATE Leads SET Title=@Title,Email=@Email,Phone=@Phone,Source=@Source,
                    Interest=@Interest,Status=@Status,Notes=@Notes,Modified=SYSUTCDATETIME()
                    WHERE Id=@Id`);
        syncLead(req.body);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Leads WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POLICIES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/policies', async (req, res) => {
    try {
        const pool   = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Policies ORDER BY Created DESC');
        res.json(result.recordset);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/policies', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        const result = await pool.request()
            .input('PolicyNumber', sql.NVarChar, r.PolicyNumber || '')
            .input('ClientName',   sql.NVarChar, r.ClientName   || '')
            .input('PolicyType',   sql.NVarChar, r.PolicyType   || '')
            .input('Premium',      sql.NVarChar, r.Premium      || '')
            .input('Status',       sql.NVarChar, r.Status       || 'Active')
            .input('StartDate',    sql.Date,     r.StartDate    || null)
            .input('EndDate',      sql.Date,     r.EndDate      || null)
            .input('Carrier',      sql.NVarChar, r.Carrier      || '')
            .input('Notes',        sql.NVarChar, r.Notes        || '')
            .query(`INSERT INTO Policies (PolicyNumber,ClientName,PolicyType,Premium,Status,StartDate,EndDate,Carrier,Notes)
                    OUTPUT INSERTED.*
                    VALUES (@PolicyNumber,@ClientName,@PolicyType,@Premium,@Status,@StartDate,@EndDate,@Carrier,@Notes)`);
        syncPolicy({ ...result.recordset[0], Title: result.recordset[0].PolicyNumber });
        res.json(result.recordset[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.put('/api/policies/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const r = req.body;
        await pool.request()
            .input('Id',           sql.Int,      parseInt(req.params.id))
            .input('PolicyNumber', sql.NVarChar, r.PolicyNumber || '')
            .input('ClientName',   sql.NVarChar, r.ClientName   || '')
            .input('PolicyType',   sql.NVarChar, r.PolicyType   || '')
            .input('Premium',      sql.NVarChar, r.Premium      || '')
            .input('Status',       sql.NVarChar, r.Status       || 'Active')
            .input('StartDate',    sql.Date,     r.StartDate    || null)
            .input('EndDate',      sql.Date,     r.EndDate      || null)
            .input('Carrier',      sql.NVarChar, r.Carrier      || '')
            .input('Notes',        sql.NVarChar, r.Notes        || '')
            .query(`UPDATE Policies SET PolicyNumber=@PolicyNumber,ClientName=@ClientName,PolicyType=@PolicyType,
                    Premium=@Premium,Status=@Status,StartDate=@StartDate,EndDate=@EndDate,Carrier=@Carrier,
                    Notes=@Notes,Modified=SYSUTCDATETIME() WHERE Id=@Id`);
        syncPolicy({ ...req.body, Title: req.body.PolicyNumber });
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/policies/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Policies WHERE Id = @Id');
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
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
            from: process.env.SMTP_USER,
            to: process.env.SMTP_FROM || process.env.SMTP_USER,
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

// ── Admin login (credentials validated server-side against .env) ──────
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ ok: false, error: 'Missing credentials' });
    const key = 'ADMIN_USER_' + username.toUpperCase().trim();
    const expected = process.env[key];
    if (expected && expected === password) {
        res.json({ ok: true, user: username.toLowerCase().trim() });
    } else {
        res.status(401).json({ ok: false, error: 'Invalid username or password' });
    }
});

// Microsoft Bookings API routes
app.use('/api/bookings', createBookingsRouter(express));

// Static files served LAST so API routes always take priority
app.use(express.static(__dirname));

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
