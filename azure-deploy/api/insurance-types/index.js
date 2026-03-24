const { getPool, sql } = require('../_db');

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function (context, req) {
    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: CORS };
        return;
    }

    const id = context.bindingData.id ? parseInt(context.bindingData.id, 10) : null;
    const body = req.body || {};

    try {
        const pool = await getPool();

        if (req.method === 'GET') {
            const result = await pool.request().query(`
                SELECT *
                FROM InsuranceTypes
                WHERE IsActive = 1
                ORDER BY SortOrder ASC, Name ASC
            `);
            context.res = {
                status: 200,
                headers: { ...CORS, 'Content-Type': 'application/json' },
                body: result.recordset
            };
            return;
        }

        if (req.method === 'POST') {
            const name = String(body.Name || '').trim();
            if (!name) {
                context.res = { status: 400, headers: CORS, body: { error: 'Name is required' } };
                return;
            }

            const existing = await pool.request()
                .input('Name', sql.NVarChar(255), name)
                .query('SELECT TOP 1 * FROM InsuranceTypes WHERE Name = @Name');

            if (existing.recordset.length) {
                context.res = {
                    status: 200,
                    headers: { ...CORS, 'Content-Type': 'application/json' },
                    body: existing.recordset[0]
                };
                return;
            }

            const sortOrderResult = await pool.request()
                .query('SELECT ISNULL(MAX(SortOrder), 0) + 1 AS NextSortOrder FROM InsuranceTypes');

            const result = await pool.request()
                .input('Name', sql.NVarChar(255), name)
                .input('SortOrder', sql.Int, sortOrderResult.recordset[0].NextSortOrder)
                .query(`
                    INSERT INTO InsuranceTypes (Name, SortOrder)
                    OUTPUT INSERTED.*
                    VALUES (@Name, @SortOrder)
                `);

            context.res = {
                status: 201,
                headers: { ...CORS, 'Content-Type': 'application/json' },
                body: result.recordset[0]
            };
            return;
        }

        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM InsuranceTypes WHERE Id = @Id');

            context.res = {
                status: 200,
                headers: { ...CORS, 'Content-Type': 'application/json' },
                body: { success: true }
            };
            return;
        }

        context.res = { status: 400, headers: CORS, body: { error: 'Bad request' } };
    } catch (err) {
        context.log.error('insurance-types error:', err.message);
        context.res = {
            status: 500,
            headers: { ...CORS, 'Content-Type': 'application/json' },
            body: { error: err.message }
        };
    }
};
