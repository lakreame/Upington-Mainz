require('../_env');

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function (context, req) {
    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: CORS }; return;
    }

    const { username, password } = req.body || {};

    if (!username || !password) {
        context.res = { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { ok: false, error: 'Missing credentials' } };
        return;
    }

    const key      = 'ADMIN_USER_' + username.toUpperCase().trim();
    const expected = process.env[key];

    if (expected && expected === password) {
        context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { ok: true, user: username.toLowerCase().trim() } };
    } else {
        context.res = { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { ok: false, error: 'Invalid username or password' } };
    }
};
