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
                .query('SELECT * FROM Policies ORDER BY Created DESC');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset };
            return;
        }

        if (req.method === 'POST') {
            const result = await pool.request()
                .input('PolicyNumber', sql.NVarChar, r.PolicyNumber || '')
                .input('ClientName',   sql.NVarChar, r.ClientName   || '')
                .input('PolicyType',   sql.NVarChar, r.PolicyType   || '')
                .input('Premium',      sql.NVarChar, r.Premium      || '')
                .input('Status',       sql.NVarChar, r.Status       || 'Active')
                .input('StartDate',    sql.Date,     r.StartDate    || null)
                .input('EndDate',      sql.Date,     r.EndDate      || null)
                .input('Carrier',      sql.NVarChar, r.Carrier      || '')
                .input('Notes',        sql.NVarChar, r.Notes        || '')
                .query(`INSERT INTO Policies (PolicyNumber,ClientName,PolicyType,Premium,Status,StartDate,EndDate,Carrier,Notes)
                        OUTPUT INSERTED.*
                        VALUES (@PolicyNumber,@ClientName,@PolicyType,@Premium,@Status,@StartDate,@EndDate,@Carrier,@Notes)`);
            context.res = { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset[0] };
            return;
        }

        if (req.method === 'PUT' && id) {
            await pool.request()
                .input('Id',           sql.Int,      id)
                .input('PolicyNumber', sql.NVarChar, r.PolicyNumber || '')
                .input('ClientName',   sql.NVarChar, r.ClientName   || '')
                .input('PolicyType',   sql.NVarChar, r.PolicyType   || '')
                .input('Premium',      sql.NVarChar, r.Premium      || '')
                .input('Status',       sql.NVarChar, r.Status       || 'Active')
                .input('StartDate',    sql.Date,     r.StartDate    || null)
                .input('EndDate',      sql.Date,     r.EndDate      || null)
                .input('Carrier',      sql.NVarChar, r.Carrier      || '')
                .input('Notes',        sql.NVarChar, r.Notes        || '')
                .query(`UPDATE Policies SET PolicyNumber=@PolicyNumber,ClientName=@ClientName,PolicyType=@PolicyType,
                        Premium=@Premium,Status=@Status,StartDate=@StartDate,EndDate=@EndDate,Carrier=@Carrier,
                        Notes=@Notes,Modified=SYSUTCDATETIME() WHERE Id=@Id`);
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM Policies WHERE Id = @Id');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        context.res = { status: 400, headers: CORS, body: { error: 'Bad request' } };
    } catch (err) {
        context.log.error('policies error:', err.message);
        context.res = { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { error: err.message } };
    }
};
