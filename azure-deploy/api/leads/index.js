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
            context.res = { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset[0] };
            return;
        }

        if (req.method === 'PUT' && id) {
            await pool.request()
                .input('Id',       sql.Int,      id)
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
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM Leads WHERE Id = @Id');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        context.res = { status: 400, headers: CORS, body: { error: 'Bad request' } };
    } catch (err) {
        context.log.error('leads error:', err.message);
        context.res = { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { error: err.message } };
    }
};
