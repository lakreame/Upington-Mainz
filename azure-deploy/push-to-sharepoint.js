/**
 * push-to-sharepoint.js
 * One-shot: reads all rows from Azure SQL and upserts them into SharePoint lists.
 * Safe to run multiple times.
 *
 * Usage: node push-to-sharepoint.js
 */
require('dotenv').config();
const { getPool, sql } = require('./db');
const { syncClient, syncAppointment, syncLead, syncPolicy } = require('./sharepoint-sync');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
    console.log('📤 Pushing SQL data → SharePoint...');
    try {
        const pool = await getPool();

        // Clients
        const clients = (await pool.request().query('SELECT * FROM Clients')).recordset;
        console.log(`\nClients (${clients.length})`);
        for (const c of clients) { syncClient(c); await delay(700); }

        // Appointments
        const appts = (await pool.request().query('SELECT * FROM Appointments')).recordset;
        console.log(`Appointments (${appts.length})`);
        for (const a of appts) { syncAppointment(a); await delay(700); }

        // Leads
        const leads = (await pool.request().query('SELECT * FROM Leads')).recordset;
        console.log(`Leads (${leads.length})`);
        for (const l of leads) { syncLead(l); await delay(700); }

        // Policies
        const policies = (await pool.request().query('SELECT * FROM Policies')).recordset;
        console.log(`Policies (${policies.length})`);
        for (const p of policies) { syncPolicy({ ...p, Title: p.PolicyNumber }); await delay(700); }

        // Wait for all background syncs to finish
        console.log('\nWaiting for sync requests to complete...');
        await delay(15000);
        console.log('✅ Done.');
        process.exit(0);
    } catch (err) {
        console.error('❌', err);
        process.exit(1);
    }
})();
