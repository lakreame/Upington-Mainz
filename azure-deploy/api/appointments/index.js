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
                .query('SELECT * FROM Appointments ORDER BY AppointmentDate ASC');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset };
            return;
        }

        if (req.method === 'POST') {
            const result = await pool.request()
                .input('Title',           sql.NVarChar,  r.Title           || '')
                .input('ClientName',      sql.NVarChar,  r.ClientName      || '')
                .input('Email',           sql.NVarChar,  r.Email           || '')
                .input('Phone',           sql.NVarChar,  r.Phone           || '')
                .input('AppointmentDate', sql.DateTime2, r.AppointmentDate ? new Date(r.AppointmentDate) : null)
                .input('EndDate',         sql.DateTime2, r.EndDate         ? new Date(r.EndDate)         : null)
                .input('Type',            sql.NVarChar,  r.Type            || '')
                .input('Status',          sql.NVarChar,  r.Status          || 'Scheduled')
                .input('Notes',           sql.NVarChar,  r.Notes           || '')
                .query(`INSERT INTO Appointments (Title,ClientName,Email,Phone,AppointmentDate,EndDate,Type,Status,Notes)
                        OUTPUT INSERTED.*
                        VALUES (@Title,@ClientName,@Email,@Phone,@AppointmentDate,@EndDate,@Type,@Status,@Notes)`);
            context.res = { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset[0] };
            return;
        }

        if (req.method === 'PUT' && id) {
            await pool.request()
                .input('Id',             sql.Int,       id)
                .input('Title',          sql.NVarChar,  r.Title           || '')
                .input('ClientName',     sql.NVarChar,  r.ClientName      || '')
                .input('Email',          sql.NVarChar,  r.Email           || '')
                .input('Phone',          sql.NVarChar,  r.Phone           || '')
                .input('AppointmentDate',sql.DateTime2, r.AppointmentDate ? new Date(r.AppointmentDate) : null)
                .input('EndDate',        sql.DateTime2, r.EndDate         ? new Date(r.EndDate)         : null)
                .input('Type',           sql.NVarChar,  r.Type            || '')
                .input('Status',         sql.NVarChar,  r.Status          || 'Scheduled')
                .input('Notes',          sql.NVarChar,  r.Notes           || '')
                .query(`UPDATE Appointments SET Title=@Title,ClientName=@ClientName,Email=@Email,Phone=@Phone,
                        AppointmentDate=@AppointmentDate,EndDate=@EndDate,Type=@Type,Status=@Status,Notes=@Notes,
                        Modified=SYSUTCDATETIME() WHERE Id=@Id`);
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM Appointments WHERE Id = @Id');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        context.res = { status: 400, headers: CORS, body: { error: 'Bad request' } };
    } catch (err) {
        context.log.error('appointments error:', err.message);
        context.res = { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { error: err.message } };
    }
};
