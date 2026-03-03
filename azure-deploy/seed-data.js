/**
 * seed-data.js
 * Inserts realistic test data into Azure SQL and pushes each row to SharePoint lists.
 *
 * Usage: node seed-data.js
 *
 * Safe to run multiple times — checks for existing rows first.
 */

require('dotenv').config();
const { getPool, sql } = require('./db');
const { syncClient, syncAppointment, syncLead, syncPolicy } = require('./sharepoint-sync');

const today   = new Date();
const d = (daysOffset, h = 10, m = 0) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + daysOffset);
    dt.setHours(h, m, 0, 0);
    return dt;
};

// ─── Seed records ────────────────────────────────────────────────────────────

const CLIENTS = [
    { Title: 'John Smith',   Email: 'john.smith@email.com',   Phone: '(555) 201-1001', DateOfBirth: '1978-04-12', Address: '124 Elm Street, Dallas TX 75201', InsuranceType: 'Auto',          Status: 'Active',   Notes: 'Existing client since 2022.' },
    { Title: 'Mary Johnson', Email: 'mary.johnson@email.com', Phone: '(555) 202-2002', DateOfBirth: '1985-09-23', Address: '850 Oak Ave, Houston TX 77001',   InsuranceType: 'Home',          Status: 'Active',   Notes: 'Interested in bundling auto.' },
    { Title: 'Robert Brown', Email: 'r.brown@email.com',      Phone: '(555) 203-3003', DateOfBirth: '1965-12-05', Address: '33 Pine Rd, Austin TX 78701',     InsuranceType: 'Life',          Status: 'Active',   Notes: 'Term life policy renewal due Q3.' },
    { Title: 'Sarah Wilson', Email: 'sarah.wilson@email.com', Phone: '(555) 204-4004', DateOfBirth: '1991-07-18', Address: '7 Maple Dr, San Antonio TX 78201', InsuranceType: 'Commercial',   Status: 'Prospect', Notes: 'Referred by Robert Brown.' },
];

const APPOINTMENTS = [
    { ClientName: 'John Smith',   Email: 'john.smith@email.com',   Phone: '(555) 201-1001', AppointmentDate: d(1, 10).toISOString(),  EndDate: d(1, 11).toISOString(),  Type: 'Policy Review',      Status: 'Scheduled', Notes: 'Annual auto policy review.' },
    { ClientName: 'Mary Johnson', Email: 'mary.johnson@email.com', Phone: '(555) 202-2002', AppointmentDate: d(2, 14).toISOString(),  EndDate: d(2, 15).toISOString(),  Type: 'New Client',         Status: 'Scheduled', Notes: 'Bundle quote — home + auto.' },
    { ClientName: 'Robert Brown', Email: 'r.brown@email.com',      Phone: '(555) 203-3003', AppointmentDate: d(-1, 9).toISOString(), EndDate: d(-1, 10).toISOString(), Type: 'Policy Review',      Status: 'Completed', Notes: 'Term life renewal discussed.' },
    { ClientName: 'Sarah Wilson', Email: 'sarah.wilson@email.com', Phone: '(555) 204-4004', AppointmentDate: d(5, 11).toISOString(),  EndDate: d(5, 12).toISOString(),  Type: 'Consultation',       Status: 'Scheduled', Notes: 'Commercial GL quote.' },
];

const LEADS = [
    { Title: 'David Martinez', Email: 'david.m@email.com',   Phone: '(555) 301-1001', Source: 'Website',   Interest: 'Auto Insurance',        Status: 'New',         Notes: 'Filled out web form 6/10.' },
    { Title: 'Linda Davis',    Email: 'linda.d@email.com',   Phone: '(555) 302-2002', Source: 'Referral',  Interest: 'Home Insurance',        Status: 'Contacted',   Notes: 'Called twice — follow up Fri.' },
    { Title: 'Carlos Ruiz',    Email: 'carlos.r@email.com',  Phone: '(555) 303-3003', Source: 'Google Ad', Interest: 'Life Insurance',         Status: 'Qualified',   Notes: 'Budget around $200/mo.' },
    { Title: 'Jessica Lee',    Email: 'jessica.l@email.com', Phone: '(555) 304-4004', Source: 'Facebook',  Interest: 'Commercial Insurance',   Status: 'New',         Notes: 'Small business owner — 5 employees.' },
];

const POLICIES = [
    { PolicyNumber: 'POL-2024-0001', ClientName: 'John Smith',   PolicyType: 'Auto', Premium: '$127/mo', Carrier: 'Progressive', StartDate: '2024-01-01', EndDate: '2025-01-01', Status: 'Active', Notes: 'Full coverage — 2021 F-150.' },
    { PolicyNumber: 'POL-2024-0002', ClientName: 'Mary Johnson', PolicyType: 'Home', Premium: '$184/mo', Carrier: 'State Farm',  StartDate: '2024-03-15', EndDate: '2025-03-15', Status: 'Active', Notes: 'Dwelling + liability.' },
    { PolicyNumber: 'POL-2023-0031', ClientName: 'Robert Brown', PolicyType: 'Life', Premium: '$310/mo', Carrier: 'Nationwide',  StartDate: '2023-07-01', EndDate: '2033-07-01', Status: 'Active', Notes: '10yr term — $500k face value.' },
];

const SUBMISSIONS = [
    { ClientName: 'Chris Taylor',  Email: 'chris.t@email.com', Phone: '(555) 401-1001', AppointmentType: 'Policy Review',    InsuranceType: 'Auto', PreferredDate: 'ASAP',   PreferredTime: 'Morning', MeetingType: 'In-Person', Status: 'New Appointment Request' },
    { ClientName: 'Ana Gonzalez',  Email: 'ana.g@email.com',   Phone: '(555) 402-2002', AppointmentType: 'New Client Consult', InsuranceType: 'Home', PreferredDate: 'ASAP',   PreferredTime: 'Afternoon', MeetingType: 'Phone', Status: 'New Appointment Request' },
];

// ─── DB helpers ──────────────────────────────────────────────────────────────

async function exists(pool, table, column, value) {
    const res = await pool.request()
        .input('val', sql.NVarChar, value)
        .query(`SELECT 1 FROM [${table}] WHERE [${column}] = @val`);
    return res.recordset.length > 0;
}

async function seedClients(pool) {
    console.log('\n── Seeding Clients ─────────────────────');
    for (const c of CLIENTS) {
        if (await exists(pool, 'Clients', 'Email', c.Email)) {
            console.log(`  skip (exists): ${c.Title}`);
            continue;
        }
        await pool.request()
            .input('Title',         sql.NVarChar, c.Title)
            .input('Email',         sql.NVarChar, c.Email)
            .input('Phone',         sql.NVarChar, c.Phone)
            .input('DateOfBirth',   sql.Date,     c.DateOfBirth || null)
            .input('Address',       sql.NVarChar, c.Address)
            .input('InsuranceType', sql.NVarChar, c.InsuranceType)
            .input('Status',        sql.NVarChar, c.Status)
            .input('Notes',         sql.NVarChar, c.Notes)
            .query(`INSERT INTO Clients (Title, Email, Phone, DateOfBirth, Address, InsuranceType, Status, Notes)
                    VALUES (@Title, @Email, @Phone, @DateOfBirth, @Address, @InsuranceType, @Status, @Notes)`);
        console.log(`  ✅ inserted: ${c.Title}`);
        syncClient(c);
    }
}

async function seedAppointments(pool) {
    console.log('\n── Seeding Appointments ────────────────');
    for (const a of APPOINTMENTS) {
        if (await exists(pool, 'Appointments', 'Email', a.Email)) {
            // allow multiple appts per email — check by email+date combo
            const res = await pool.request()
                .input('Email', sql.NVarChar, a.Email)
                .input('AppointmentDate', sql.DateTime2, a.AppointmentDate)
                .query('SELECT 1 FROM Appointments WHERE Email = @Email AND AppointmentDate = @AppointmentDate');
            if (res.recordset.length > 0) {
                console.log(`  skip (exists): ${a.ClientName} @ ${a.AppointmentDate}`);
                continue;
            }
        }
        await pool.request()
            .input('ClientName',      sql.NVarChar,  a.ClientName)
            .input('Email',           sql.NVarChar,  a.Email)
            .input('Phone',           sql.NVarChar,  a.Phone)
            .input('AppointmentDate', sql.DateTime2, a.AppointmentDate)
            .input('EndDate',         sql.DateTime2, a.EndDate)
            .input('Type',            sql.NVarChar,  a.Type)
            .input('Status',          sql.NVarChar,  a.Status)
            .input('Notes',           sql.NVarChar,  a.Notes)
            .query(`INSERT INTO Appointments (ClientName, Email, Phone, AppointmentDate, EndDate, Type, Status, Notes)
                    VALUES (@ClientName, @Email, @Phone, @AppointmentDate, @EndDate, @Type, @Status, @Notes)`);
        console.log(`  ✅ inserted: ${a.ClientName} — ${a.Type}`);
        syncAppointment({ ...a, Title: `${a.ClientName} — ${a.Type}` });
    }
}

async function seedLeads(pool) {
    console.log('\n── Seeding Leads ───────────────────────');
    for (const l of LEADS) {
        if (await exists(pool, 'Leads', 'Email', l.Email)) {
            console.log(`  skip (exists): ${l.Title}`);
            continue;
        }
        await pool.request()
            .input('Title',    sql.NVarChar, l.Title)
            .input('Email',    sql.NVarChar, l.Email)
            .input('Phone',    sql.NVarChar, l.Phone)
            .input('Source',   sql.NVarChar, l.Source)
            .input('Interest', sql.NVarChar, l.Interest)
            .input('Status',   sql.NVarChar, l.Status)
            .input('Notes',    sql.NVarChar, l.Notes)
            .query(`INSERT INTO Leads (Title, Email, Phone, Source, Interest, Status, Notes)
                    VALUES (@Title, @Email, @Phone, @Source, @Interest, @Status, @Notes)`);
        console.log(`  ✅ inserted: ${l.Title}`);
        syncLead(l);
    }
}

async function seedPolicies(pool) {
    console.log('\n── Seeding Policies ────────────────────');
    for (const p of POLICIES) {
        if (await exists(pool, 'Policies', 'PolicyNumber', p.PolicyNumber)) {
            console.log(`  skip (exists): ${p.PolicyNumber}`);
            continue;
        }
        await pool.request()
            .input('PolicyNumber', sql.NVarChar, p.PolicyNumber)
            .input('ClientName',   sql.NVarChar, p.ClientName)
            .input('PolicyType',   sql.NVarChar, p.PolicyType)
            .input('Premium',      sql.NVarChar, p.Premium)
            .input('Carrier',      sql.NVarChar, p.Carrier)
            .input('StartDate',    sql.Date,     p.StartDate    || null)
            .input('EndDate',      sql.Date,     p.EndDate      || null)
            .input('Status',       sql.NVarChar, p.Status)
            .input('Notes',        sql.NVarChar, p.Notes)
            .query(`INSERT INTO Policies (PolicyNumber, ClientName, PolicyType, Premium, Carrier, StartDate, EndDate, Status, Notes)
                    VALUES (@PolicyNumber, @ClientName, @PolicyType, @Premium, @Carrier, @StartDate, @EndDate, @Status, @Notes)`);
        console.log(`  ✅ inserted: ${p.PolicyNumber} — ${p.ClientName}`);
        syncPolicy({ ...p, Title: p.PolicyNumber });
    }
}

async function seedSubmissions(pool) {
    console.log('\n── Seeding Submissions ─────────────────');
    const { v4: uuidv4 } = require('crypto');
    for (const s of SUBMISSIONS) {
        if (await exists(pool, 'Submissions', 'Email', s.Email)) {
            console.log(`  skip (exists): ${s.ClientName}`);
            continue;
        }
        const id = require('crypto').randomUUID ? require('crypto').randomUUID() : `SEED-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await pool.request()
            .input('Id',              sql.NVarChar, id)
            .input('ClientName',      sql.NVarChar, s.ClientName)
            .input('Email',           sql.NVarChar, s.Email)
            .input('Phone',           sql.NVarChar, s.Phone)
            .input('AppointmentType', sql.NVarChar, s.AppointmentType)
            .input('InsuranceType',   sql.NVarChar, s.InsuranceType)
            .input('PreferredDate',   sql.NVarChar, s.PreferredDate)
            .input('PreferredTime',   sql.NVarChar, s.PreferredTime)
            .input('MeetingType',     sql.NVarChar, s.MeetingType)
            .input('Status',          sql.NVarChar, s.Status)
            .query(`INSERT INTO Submissions (Id, ClientName, Email, Phone, AppointmentType, InsuranceType, PreferredDate, PreferredTime, MeetingType, Status)
                    VALUES (@Id, @ClientName, @Email, @Phone, @AppointmentType, @InsuranceType, @PreferredDate, @PreferredTime, @MeetingType, @Status)`);
        console.log(`  ✅ inserted submission: ${s.ClientName}`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
    console.log('🌱 Upington-Mainz seed script starting...');
    try {
        const pool = await getPool();
        await seedClients(pool);
        await seedAppointments(pool);
        await seedLeads(pool);
        await seedPolicies(pool);
        await seedSubmissions(pool);
        console.log('\n✅ Seed complete. SharePoint sync running in background...');
        // wait a moment for background SP syncs
        await new Promise(r => setTimeout(r, 8000));
        console.log('✅ All done.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
})();
