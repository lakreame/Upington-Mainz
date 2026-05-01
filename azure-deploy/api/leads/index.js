const { getPool, sql } = require('../_db');

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function (context, req) {
    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: CORS }; return;
    }

    const id = context.bindingData.id ? parseInt(context.bindingData.id) : null;
    const r  = req.body || {};

    try {
        const pool = await getPool();

        if (req.method === 'GET') {
            const result = await pool.request()
                .query('SELECT * FROM Leads ORDER BY Created DESC');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset };
            return;
        }

        if (req.method === 'POST') {
            const firstName = (r.firstName || '').trim();
            const lastName  = (r.lastName  || '').trim();
            const title     = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';

            const result = await pool.request()
                .input('Title',                sql.NVarChar, title)
                .input('Email',                sql.NVarChar, r.email   || r.Email   || '')
                .input('Phone',                sql.NVarChar, r.phone   || r.Phone   || '')
                .input('Source',               sql.NVarChar, r.source  || r.Source  || 'Website')
                .input('Status',               sql.NVarChar, r.status  || r.Status  || 'New')
                .input('Notes',                sql.NVarChar, r.notes   || r.Notes   || '')
                .input('ConsentNonMarketing',  sql.Bit,      r.consentNonMarketing  ? 1 : 0)
                .input('ConsentMarketing',     sql.Bit,      r.consentMarketing     ? 1 : 0)
                .query(`INSERT INTO Leads (Title, Email, Phone, Source, Status, Notes, ConsentNonMarketing, ConsentMarketing)
                        OUTPUT INSERTED.*
                        VALUES (@Title, @Email, @Phone, @Source, @Status, @Notes, @ConsentNonMarketing, @ConsentMarketing)`);
            context.res = { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset[0] };
            return;
        }

        if (req.method === 'PUT' && id) {
            await pool.request()
                .input('Id',     sql.Int,      id)
                .input('Status', sql.NVarChar, r.status || r.Status || 'New')
                .input('Notes',  sql.NVarChar, r.notes  || r.Notes  || '')
                .query('UPDATE Leads SET Status = @Status, Notes = @Notes WHERE Id = @Id');
            context.res = { status: 200, headers: CORS, body: { success: true } };
            return;
        }

        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM Leads WHERE Id = @Id');
            context.res = { status: 200, headers: CORS, body: { success: true } };
            return;
        }

        context.res = { status: 405, headers: CORS, body: { error: 'Method not allowed' } };
    } catch (err) {
        context.log.error('Leads API error:', err);
        context.res = { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { error: err.message } };
    }
};
