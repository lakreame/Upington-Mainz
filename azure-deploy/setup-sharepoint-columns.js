/**
 * setup-sharepoint-columns.js
 * Adds missing columns (site columns) to each SharePoint list so sync can work.
 *
 * Usage: node setup-sharepoint-columns.js
 *
 * Safe to run multiple times — skips columns that already exist.
 */
require('dotenv').config();
const msal = require('@azure/msal-node');

const SP_HOST = 'upingtonmainzllc1.sharepoint.com';
const SP_PATH = '/sites/UpingtonMainz';

// ── Auth ─────────────────────────────────────────────────────────────────────
async function getToken() {
    const app = new msal.ConfidentialClientApplication({
        auth: {
            clientId:     process.env.BOOKINGS_CLIENT_ID,
            clientSecret: process.env.BOOKINGS_CLIENT_SECRET,
            authority:    `https://login.microsoftonline.com/${process.env.BOOKINGS_TENANT || 'upingtonmainz.com'}`,
        }
    });
    const r = await app.acquireTokenByUsernamePassword({
        scopes:   ['https://graph.microsoft.com/.default'],
        username: process.env.BOOKINGS_USERNAME,
        password: process.env.BOOKINGS_PASSWORD,
    });
    return r.accessToken;
}

let token;
async function g(path, opts = {}) {
    const url = path.startsWith('http') ? path : `https://graph.microsoft.com/v1.0${path}`;
    const res = await fetch(url, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (res.status === 204) return null;
    const txt = await res.text();
    if (!res.ok) throw new Error(`${res.status}: ${txt.substring(0, 300)}`);
    return txt ? JSON.parse(txt) : null;
}

// ── Column schema per list ────────────────────────────────────────────────────
const LIST_COLUMNS = {
    Clients: [
        { name: 'Email',         displayName: 'Email',          type: 'text' },
        { name: 'Phone',         displayName: 'Phone',          type: 'text' },
        { name: 'DateOfBirth',   displayName: 'DateOfBirth',    type: 'dateTime' },
        { name: 'Address',       displayName: 'Address',        type: 'text' },
        { name: 'InsuranceType', displayName: 'InsuranceType',  type: 'text' },
        { name: 'Status',        displayName: 'Status',         type: 'text' },
        { name: 'Notes',         displayName: 'Notes',          type: 'text' },
    ],
    Appointments: [
        { name: 'ClientName',      displayName: 'ClientName',       type: 'text' },
        { name: 'Email',           displayName: 'Email',            type: 'text' },
        { name: 'Phone',           displayName: 'Phone',            type: 'text' },
        { name: 'AppointmentDate', displayName: 'AppointmentDate',  type: 'dateTime' },
        { name: 'EndDate',         displayName: 'EndDate',          type: 'dateTime' },
        { name: 'Type',            displayName: 'Type',             type: 'text' },
        { name: 'Status',          displayName: 'Status',           type: 'text' },
        { name: 'Notes',           displayName: 'Notes',            type: 'text' },
    ],
    Leads: [
        { name: 'Email',    displayName: 'Email',    type: 'text' },
        { name: 'Phone',    displayName: 'Phone',    type: 'text' },
        { name: 'Source',   displayName: 'Source',   type: 'text' },
        { name: 'Interest', displayName: 'Interest', type: 'text' },
        { name: 'Status',   displayName: 'Status',   type: 'text' },
        { name: 'Notes',    displayName: 'Notes',    type: 'text' },
    ],
    Policies: [
        { name: 'PolicyNumber', displayName: 'PolicyNumber', type: 'text' },
        { name: 'ClientName',   displayName: 'ClientName',   type: 'text' },
        { name: 'PolicyType',   displayName: 'PolicyType',   type: 'text' },
        { name: 'Premium',      displayName: 'Premium',      type: 'text' },
        { name: 'Carrier',      displayName: 'Carrier',      type: 'text' },
        { name: 'Status',       displayName: 'Status',       type: 'text' },
        { name: 'Notes',        displayName: 'Notes',        type: 'text' },
    ],
};

function colBody(col) {
    const base = { name: col.name, displayName: col.displayName, enforceUniqueValues: false, indexed: false };
    switch (col.type) {
        case 'text':     return { ...base, text: {} };
        case 'dateTime': return { ...base, dateTime: { displayAs: 'default', format: 'dateOnly' } };
        case 'number':   return { ...base, number: {} };
        default:         return { ...base, text: {} };
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
    console.log('🔧 Setting up SharePoint list columns...');
    token = await getToken();

    // Get site ID
    const site = await g(`/sites/${SP_HOST}:${SP_PATH}`);
    const siteId = site.id;
    console.log(`Site ID: ${siteId}`);

    for (const [listName, columns] of Object.entries(LIST_COLUMNS)) {
        console.log(`\n── ${listName} ──`);

        // Find list
        let listId;
        try {
            const lists = await g(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'&$select=id,displayName`);
            const lst = (lists?.value || [])[0];
            if (!lst) {
                // Create the list
                console.log(`  Creating list "${listName}"...`);
                const newList = await g(`/sites/${siteId}/lists`, {
                    method: 'POST',
                    body: JSON.stringify({ displayName: listName, list: { template: 'genericList' } })
                });
                listId = newList.id;
                console.log(`  ✅ List created: ${listId}`);
            } else {
                listId = lst.id;
                console.log(`  List found: ${listId}`);
            }
        } catch (err) {
            console.warn(`  ⚠️  Could not get/create list ${listName}:`, err.message);
            continue;
        }

        // Get existing columns
        const existingCols = await g(`/sites/${siteId}/lists/${listId}/columns?$select=name`);
        const existing = new Set((existingCols?.value || []).map(c => c.name.toLowerCase()));

        for (const col of columns) {
            if (existing.has(col.name.toLowerCase())) {
                console.log(`  skip (exists): ${col.name}`);
                continue;
            }
            try {
                await g(`/sites/${siteId}/lists/${listId}/columns`, {
                    method: 'POST',
                    body: JSON.stringify(colBody(col))
                });
                console.log(`  ✅ Added column: ${col.name}`);
            } catch (err) {
                console.warn(`  ⚠️  Column ${col.name}: ${err.message.substring(0, 120)}`);
            }
        }
    }

    console.log('\n✅ List setup complete.');
    process.exit(0);
})().catch(err => {
    console.error('❌', err);
    process.exit(1);
});
