/**
 * sharepoint-sync.js
 * Background sync: Azure SQL  →  SharePoint lists  (fire-and-forget)
 * Uses the same Graph token as bookings-api.js.
 *
 * All functions return silently on error — a failed SP sync never
 * blocks or fails the primary SQL operation.
 */

const msal = require('@azure/msal-node');

// ── Token cache (shared with bookings-api pattern) ───────────────────────
let _token = null;
let _tokenExpiry = 0;

function cfg() {
    return {
        clientId:     process.env.BOOKINGS_CLIENT_ID,
        clientSecret: process.env.BOOKINGS_CLIENT_SECRET,
        tenant:       process.env.BOOKINGS_TENANT       || 'upingtonmainz.com',
        username:     process.env.BOOKINGS_USERNAME,
        password:     process.env.BOOKINGS_PASSWORD,
    };
}

async function getToken() {
    const now = Date.now();
    if (_token && now < _tokenExpiry - 60000) return _token;
    const c = cfg();
    if (!c.clientSecret || !c.password) throw new Error('SP sync: missing credentials');
    const msalApp = new msal.ConfidentialClientApplication({
        auth: {
            clientId:     c.clientId,
            clientSecret: c.clientSecret,
            authority:    `https://login.microsoftonline.com/${c.tenant}`,
        }
    });
    const result = await msalApp.acquireTokenByUsernamePassword({
        scopes:   ['https://graph.microsoft.com/.default'],
        username: c.username,
        password: c.password,
    });
    _token = result.accessToken;
    _tokenExpiry = result.expiresOn ? result.expiresOn.getTime() : now + 3600000;
    return _token;
}

async function gFetch(path, opts = {}) {
    const token = await getToken();
    const url   = path.startsWith('http') ? path : `https://graph.microsoft.com/v1.0${path}`;
    const res   = await fetch(url, {
        ...opts,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (res.status === 204) return null;
    const text = await res.text();
    if (!res.ok) throw new Error(`Graph ${res.status}: ${text.substring(0, 200)}`);
    return text ? JSON.parse(text) : null;
}

// ── Site / list helpers ──────────────────────────────────────────────────
let _siteId = null;
const SP_HOST = 'upingtonmainzllc1.sharepoint.com';
const SP_PATH = '/sites/UpingtonMainz';

async function getSiteId() {
    if (_siteId) return _siteId;
    const data = await gFetch(`/sites/${SP_HOST}:${SP_PATH}`);
    _siteId = data.id;
    return _siteId;
}

async function getListId(siteId, listName) {
    const data = await gFetch(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'&$select=id,displayName`);
    const list = (data?.value || [])[0];
    if (!list) throw new Error(`SharePoint list "${listName}" not found`);
    return list.id;
}

// ── Field maps: SQL row → SharePoint list item fields ───────────────────
function clientFields(r) {
    return {
        Title:          r.Title         || '',
        Email:          r.Email         || '',
        Phone:          r.Phone         || '',
        DateOfBirth:    r.DateOfBirth   || null,
        Address:        r.Address       || '',
        InsuranceType:  r.InsuranceType || '',
        Status:         r.Status        || 'Active',
        Notes:          r.Notes         || '',
    };
}
function appointmentFields(r) {
    return {
        Title:           r.Title           || (r.ClientName ? r.ClientName + ' Appointment' : 'Appointment'),
        ClientName:      r.ClientName      || '',
        Email:           r.Email           || '',
        Phone:           r.Phone           || '',
        AppointmentDate: r.AppointmentDate || null,
        EndDate:         r.EndDate         || null,
        Type:            r.Type            || '',
        Status:          r.Status          || 'Scheduled',
        Notes:           r.Notes           || '',
    };
}
function leadFields(r) {
    return {
        Title:    r.Title    || '',
        Email:    r.Email    || '',
        Phone:    r.Phone    || '',
        Source:   r.Source   || '',
        Interest: r.Interest || '',
        Status:   r.Status   || 'New',
        Notes:    r.Notes    || '',
    };
}
function policyFields(r) {
    // Premium col in SP is Number type — strip non-numeric chars for storage
    const premiumNum = parseFloat(String(r.Premium || '0').replace(/[^0-9.]/g, '')) || null;
    return {
        Title:      r.PolicyNumber  || r.Title || '',
        ClientName: r.ClientName    || '',
        PolicyType: r.PolicyType    || '',
        Premium:    premiumNum,
        Status:     r.Status        || 'Active',
        Carrier:    r.Carrier       || '',
    };
}

// ── Public API (fire-and-forget wrappers) ────────────────────────────────

/**
 * Push a single item to a SharePoint list.
 * Never throws — logs errors silently.
 */
async function pushItem(listName, fieldsMap, row) {
    try {
        const siteId  = await getSiteId();
        const listId  = await getListId(siteId, listName);
        const fields  = fieldsMap(row);
        await gFetch(`/sites/${siteId}/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ fields })
        });
        console.log(`📤 SP sync: added to ${listName} — ${row.Title || row.ClientName || ''}`);
    } catch (err) {
        console.warn(`⚠️  SP sync skipped (${listName}):`, err.message);
    }
}

/**
 * Update an existing SharePoint list item whose Title matches sql row Title /
 * ClientName — creates a new item if no match found.
 */
async function syncItem(listName, fieldsMap, row) {
    try {
        const siteId = await getSiteId();
        const listId = await getListId(siteId, listName);
        const name   = row.Title || row.ClientName || row.PolicyNumber || '';
        const existing = await gFetch(
            `/sites/${siteId}/lists/${listId}/items?$filter=fields/Title eq '${encodeURIComponent(name)}'&$select=id`,
            { headers: { 'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly' } }
        );
        const item = (existing?.value || [])[0];
        const fields = fieldsMap(row);
        if (item) {
            await gFetch(`/sites/${siteId}/lists/${listId}/items/${item.id}/fields`, {
                method: 'PATCH',
                body: JSON.stringify(fields)
            });
            console.log(`📤 SP sync: updated ${listName} — ${name}`);
        } else {
            await gFetch(`/sites/${siteId}/lists/${listId}/items`, {
                method: 'POST',
                body: JSON.stringify({ fields })
            });
            console.log(`📤 SP sync: created in ${listName} — ${name}`);
        }
    } catch (err) {
        console.warn(`⚠️  SP sync skipped (${listName}):`, err.message);
    }
}

// ── Convenience exports ──────────────────────────────────────────────────

/** Sync a Client row to SharePoint */
function syncClient(row)      { syncItem('Clients',      clientFields,      row).catch(()=>{}); }
/** Sync an Appointment row to SharePoint */
function syncAppointment(row) { syncItem('Appointments', appointmentFields, row).catch(()=>{}); }
/** Sync a Lead row to SharePoint */
function syncLead(row)        { syncItem('Leads',        leadFields,        row).catch(()=>{}); }
/** Sync a Policy row to SharePoint */
function syncPolicy(row)      { syncItem('Policies',     policyFields,      row).catch(()=>{}); }

module.exports = { syncClient, syncAppointment, syncLead, syncPolicy, pushItem };
