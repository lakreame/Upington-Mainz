/**
 * Microsoft Bookings API Integration
 * Uses MSAL Node (ROPC flow) to authenticate as brettanya.brown@upingtonmainz.com
 * and proxy CRUD operations to Microsoft Graph Bookings API.
 *
 * Graph Bookings endpoints:
 *   GET    /solutions/bookingBusinesses
 *   GET    /solutions/bookingBusinesses/{id}/appointments
 *   POST   /solutions/bookingBusinesses/{id}/appointments
 *   PATCH  /solutions/bookingBusinesses/{id}/appointments/{aptId}
 *   DELETE /solutions/bookingBusinesses/{id}/appointments/{aptId}
 */

const msal = require('@azure/msal-node');

// ─── Configuration (read from .env) ──────────────────────
function cfg() {
    return {
        clientId:     process.env.BOOKINGS_CLIENT_ID     || 'ccd7cc4d-1ee9-47a5-986e-cd615e0695ad',
        clientSecret: process.env.BOOKINGS_CLIENT_SECRET || '',
        tenant:       process.env.BOOKINGS_TENANT        || 'upingtonmainz.com',
        username:     process.env.BOOKINGS_USERNAME      || 'brettanya.brown@upingtonmainz.com',
        password:     process.env.BOOKINGS_PASSWORD      || '',
        scopes: ['https://graph.microsoft.com/.default'],
    };
}

let _accessToken = null;
let _tokenExpiry = 0;
let _bookingBusinessId = null;
let _msalClient = null;
let _msalClientSecret = null;  // track which secret the client was built with

// ─── Helpers ─────────────────────────────────────────────

function getMsalClient() {
    const c = cfg();
    // Rebuild if secret changed
    if (!_msalClient || _msalClientSecret !== c.clientSecret) {
        _msalClient = new msal.ConfidentialClientApplication({
            auth: {
                clientId:     c.clientId,
                clientSecret: c.clientSecret,
                authority:    `https://login.microsoftonline.com/${c.tenant}`,
            }
        });
        _msalClientSecret = c.clientSecret;
        _accessToken = null;
    }
    return _msalClient;
}

async function getAccessToken() {
    const now = Date.now();
    if (_accessToken && now < _tokenExpiry - 60000) return _accessToken;

    const c = cfg();
    if (!c.clientSecret) throw new Error('BOOKINGS_CLIENT_SECRET is not set in .env');
    if (!c.password)     throw new Error('BOOKINGS_PASSWORD is not set in .env');

    try {
        const client = getMsalClient();
        const result = await client.acquireTokenByUsernamePassword({
            scopes:   c.scopes,
            username: c.username,
            password: c.password,
        });
        _accessToken = result.accessToken;
        _tokenExpiry = result.expiresOn ? result.expiresOn.getTime() : (now + 3600 * 1000);
        console.log('✅ Bookings: access token acquired');
        return _accessToken;
    } catch (err) {
        console.error('❌ Bookings token error:', err.message);
        _accessToken = null;
        throw new Error('Authentication failed – ' + err.message);
    }
}

async function graphFetch(path, options = {}) {
    const token = await getAccessToken();
    const url = path.startsWith('http')
        ? path
        : `https://graph.microsoft.com/v1.0${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (res.status === 204) return null;          // DELETE success
    const text = await res.text();
    if (!res.ok) {
        let msg = text;
        try { msg = JSON.parse(text).error?.message || text; } catch {}
        throw new Error(`Graph ${res.status}: ${msg}`);
    }
    return text ? JSON.parse(text) : null;
}

// ─── Business Discovery ──────────────────────────────────

async function getBookingBusinessId() {
    if (_bookingBusinessId) return _bookingBusinessId;
    const data = await graphFetch('/solutions/bookingBusinesses?$select=id,displayName');
    const businesses = data?.value || [];
    if (!businesses.length) throw new Error('No Bookings businesses found for this account.');

    // Pick the first business (most accounts have one)
    _bookingBusinessId = businesses[0].id;
    console.log(`📅 Bookings business: "${businesses[0].displayName}" (${_bookingBusinessId})`);
    return _bookingBusinessId;
}

// ─── Public API ──────────────────────────────────────────

/** Returns connection status + business name. */
async function testConnection() {
    try {
        await getAccessToken();
        const data = await graphFetch('/solutions/bookingBusinesses?$select=id,displayName&$top=1');
        const biz = data?.value?.[0];
        if (!biz) throw new Error('No Bookings business found for this account.');
        _bookingBusinessId = biz.id;
        return { success: true, connected: true, businessId: biz.id, businessName: biz.displayName };
    } catch (err) {
        return { success: false, connected: false, error: err.message };
    }
}

/** List all booking businesses. */
async function listBusinesses() {
    const data = await graphFetch('/solutions/bookingBusinesses?$select=id,displayName,email,phone,address');
    return data?.value || [];
}

/** List appointments (optionally between two ISO dates). */
async function listAppointments(startDate, endDate) {
    const biz = await getBookingBusinessId();
    let url = `/solutions/bookingBusinesses/${biz}/appointments?$orderby=startDateTime/dateTime desc&$top=200`;

    // Graph Bookings doesn't support $filter on dateTime well,
    // so we fetch up to 200 and filter client‑side.
    const data = await graphFetch(url);
    let apts = data?.value || [];

    if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date('2099-12-31');
        apts = apts.filter(a => {
            const d = new Date(a.startDateTime?.dateTime || a.start?.dateTime);
            return d >= start && d <= end;
        });
    }
    return apts;
}

/** Create an appointment in Bookings. */
async function createAppointment({ clientName, clientEmail, clientPhone, serviceId, start, end, notes, appointmentType }) {
    const biz = await getBookingBusinessId();

    // Build the appointment payload per Graph API spec
    const body = {
        '@odata.type': '#microsoft.graph.bookingAppointment',
        customerEmailAddress: clientEmail || '',
        customerName: clientName || 'Walk-in',
        customerPhone: clientPhone || '',
        startDateTime: {
            dateTime: start,
            timeZone: 'America/New_York'
        },
        endDateTime: {
            dateTime: end || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/New_York'
        },
        serviceNotes: notes || '',
        optOutOfCustomerEmail: false,
        isLocationOnline: false
    };

    if (serviceId) body.serviceId = serviceId;

    const result = await graphFetch(`/solutions/bookingBusinesses/${biz}/appointments`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return result;
}

/** Update an existing appointment. */
async function updateAppointment(appointmentId, updates) {
    const biz = await getBookingBusinessId();

    const body = {};
    if (updates.clientName !== undefined) body.customerName = updates.clientName;
    if (updates.clientEmail !== undefined) body.customerEmailAddress = updates.clientEmail;
    if (updates.clientPhone !== undefined) body.customerPhone = updates.clientPhone;
    if (updates.start !== undefined) {
        body.startDateTime = { dateTime: updates.start, timeZone: 'America/New_York' };
    }
    if (updates.end !== undefined) {
        body.endDateTime = { dateTime: updates.end, timeZone: 'America/New_York' };
    }
    if (updates.notes !== undefined) body.serviceNotes = updates.notes;
    if (updates.serviceId !== undefined) body.serviceId = updates.serviceId;

    return graphFetch(`/solutions/bookingBusinesses/${biz}/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

/** Cancel / delete an appointment. */
async function deleteAppointment(appointmentId) {
    const biz = await getBookingBusinessId();
    await graphFetch(`/solutions/bookingBusinesses/${biz}/appointments/${appointmentId}`, {
        method: 'DELETE',
    });
    return { success: true };
}

/** Get a single appointment by ID. */
async function getAppointment(appointmentId) {
    const biz = await getBookingBusinessId();
    return graphFetch(`/solutions/bookingBusinesses/${biz}/appointments/${appointmentId}`);
}

/** List services from the booking business (useful for service picker). */
async function listServices() {
    const biz = await getBookingBusinessId();
    const data = await graphFetch(`/solutions/bookingBusinesses/${biz}/services?$select=id,displayName,defaultDuration`);
    return data?.value || [];
}

// ─── Express Router Factory ──────────────────────────────

function createBookingsRouter(express) {
    const router = express.Router();

    // Test connection (reads credentials from .env)
    router.get('/test', async (req, res) => {
        try {
            const result = await testConnection();
            res.json(result);
        } catch (e) { res.status(500).json({ success: false, error: e.message }); }
    });

    // List businesses
    router.get('/businesses', async (req, res) => {
        try {
            res.json({ businesses: await listBusinesses() });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // List services
    router.get('/services', async (req, res) => {
        try {
            res.json({ services: await listServices() });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // List appointments
    router.get('/appointments', async (req, res) => {
        try {
            const { start, end } = req.query;
            res.json({ appointments: await listAppointments(start, end) });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Get single appointment
    router.get('/appointments/:id', async (req, res) => {
        try {
            res.json(await getAppointment(req.params.id));
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Create appointment
    router.post('/appointments', async (req, res) => {
        try {
            const apt = await createAppointment(req.body);
            res.status(201).json(apt);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Update appointment
    router.patch('/appointments/:id', async (req, res) => {
        try {
            await updateAppointment(req.params.id, req.body);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Delete appointment
    router.delete('/appointments/:id', async (req, res) => {
        try {
            await deleteAppointment(req.params.id);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    return router;
}

module.exports = { createBookingsRouter, testConnection };
