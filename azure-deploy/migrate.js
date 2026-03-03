// migrate.js — One-time schema setup for Azure SQL
// Run once:  node migrate.js
// Safe to re-run — uses IF NOT EXISTS guards on every object.

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { getPool } = require('./db');

async function run() {
    console.log('🔧 Connecting to Azure SQL…');
    const pool = await getPool();
    console.log('✅ Connected.\n');

    // ────────────────────────────────────────
    // CREATE TABLES
    // ────────────────────────────────────────
    const tables = [
        {
            name: 'Clients',
            ddl: `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clients')
            CREATE TABLE Clients (
                Id           INT IDENTITY(1,1) PRIMARY KEY,
                Title        NVARCHAR(255)     NOT NULL,
                Email        NVARCHAR(255),
                Phone        NVARCHAR(50),
                DateOfBirth  DATE,
                Address      NVARCHAR(500),
                InsuranceType NVARCHAR(100),
                Status       NVARCHAR(50)      DEFAULT 'Active',
                Notes        NVARCHAR(MAX),
                Created      DATETIME2         DEFAULT SYSUTCDATETIME(),
                Modified     DATETIME2         DEFAULT SYSUTCDATETIME()
            );`
        },
        {
            name: 'Appointments',
            ddl: `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
            CREATE TABLE Appointments (
                Id              INT IDENTITY(1,1) PRIMARY KEY,
                Title           NVARCHAR(255),
                ClientName      NVARCHAR(255),
                Email           NVARCHAR(255),
                Phone           NVARCHAR(50),
                AppointmentDate DATETIME2,
                EndDate         DATETIME2,
                Type            NVARCHAR(100),
                Status          NVARCHAR(50)  DEFAULT 'Scheduled',
                Notes           NVARCHAR(MAX),
                Created         DATETIME2     DEFAULT SYSUTCDATETIME(),
                Modified        DATETIME2     DEFAULT SYSUTCDATETIME()
            );`
        },
        {
            name: 'Leads',
            ddl: `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Leads')
            CREATE TABLE Leads (
                Id       INT IDENTITY(1,1) PRIMARY KEY,
                Title    NVARCHAR(255)     NOT NULL,
                Email    NVARCHAR(255),
                Phone    NVARCHAR(50),
                Source   NVARCHAR(100),
                Interest NVARCHAR(100),
                Status   NVARCHAR(50)      DEFAULT 'New',
                Notes    NVARCHAR(MAX),
                Created  DATETIME2         DEFAULT SYSUTCDATETIME(),
                Modified DATETIME2         DEFAULT SYSUTCDATETIME()
            );`
        },
        {
            name: 'Policies',
            ddl: `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Policies')
            CREATE TABLE Policies (
                Id           INT IDENTITY(1,1) PRIMARY KEY,
                PolicyNumber NVARCHAR(100),
                ClientName   NVARCHAR(255),
                PolicyType   NVARCHAR(100),
                Premium      NVARCHAR(50),
                Status       NVARCHAR(50)  DEFAULT 'Active',
                StartDate    DATE,
                EndDate      DATE,
                Carrier      NVARCHAR(100),
                Notes        NVARCHAR(MAX),
                Created      DATETIME2     DEFAULT SYSUTCDATETIME(),
                Modified     DATETIME2     DEFAULT SYSUTCDATETIME()
            );`
        },
        {
            name: 'Submissions',
            ddl: `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Submissions')
            CREATE TABLE Submissions (
                Id              NVARCHAR(50)  PRIMARY KEY,
                SubmittedAt     DATETIME2     DEFAULT SYSUTCDATETIME(),
                ClientName      NVARCHAR(255),
                Email           NVARCHAR(255),
                Phone           NVARCHAR(50),
                AppointmentType NVARCHAR(100),
                InsuranceType   NVARCHAR(100),
                PreferredDate   NVARCHAR(50),
                PreferredTime   NVARCHAR(50),
                MeetingType     NVARCHAR(50),
                Address         NVARCHAR(500),
                County          NVARCHAR(100),
                Status          NVARCHAR(100) DEFAULT 'New Appointment Request'
            );`
        }
    ];

    for (const t of tables) {
        await pool.request().query(t.ddl);
        console.log(`✅ Table ready: ${t.name}`);
    }

    // ────────────────────────────────────────
    // MIGRATE EXISTING submissions.json → SQL
    // ────────────────────────────────────────
    const submissionsFile = path.join(__dirname, 'submissions.json');
    if (fs.existsSync(submissionsFile)) {
        try {
            const rows = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
            if (rows.length > 0) {
                console.log(`\n📦 Migrating ${rows.length} row(s) from submissions.json…`);
                for (const s of rows) {
                    // Skip if already exists
                    const check = await pool.request()
                        .input('Id', s.id)
                        .query('SELECT 1 FROM Submissions WHERE Id = @Id');
                    if (check.recordset.length > 0) continue;

                    await pool.request()
                        .input('Id',              s.id             || Date.now().toString())
                        .input('SubmittedAt',     s.submittedAt    || new Date().toISOString())
                        .input('ClientName',      s.clientName     || '')
                        .input('Email',           s.email          || '')
                        .input('Phone',           s.phone          || '')
                        .input('AppointmentType', s.appointmentType || '')
                        .input('InsuranceType',   s.insuranceType   || '')
                        .input('PreferredDate',   s.preferredDate   || '')
                        .input('PreferredTime',   s.preferredTime   || '')
                        .input('MeetingType',     s.meetingType     || '')
                        .input('Address',         s.address         || '')
                        .input('County',          s.county          || '')
                        .input('Status',          s.status          || 'New Appointment Request')
                        .query(`INSERT INTO Submissions
                            (Id,SubmittedAt,ClientName,Email,Phone,AppointmentType,
                             InsuranceType,PreferredDate,PreferredTime,MeetingType,Address,County,Status)
                            VALUES
                            (@Id,@SubmittedAt,@ClientName,@Email,@Phone,@AppointmentType,
                             @InsuranceType,@PreferredDate,@PreferredTime,@MeetingType,@Address,@County,@Status)`);
                }
                console.log('✅ submissions.json data migrated.');
            } else {
                console.log('ℹ️  submissions.json is empty — nothing to migrate.');
            }
        } catch (err) {
            console.error('⚠️  Could not migrate submissions.json:', err.message);
        }
    }

    console.log('\n🎉 Migration complete. You can now start the server: node server.js');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
