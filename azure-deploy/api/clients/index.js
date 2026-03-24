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

    const id  = context.bindingData.id ? parseInt(context.bindingData.id) : null;
    const r   = req.body || {};
    const premiumAmount = normalizeCurrency(r.PremiumAmount);
    const householdIncome = normalizeCurrency(r.HouseholdIncome);
    const householdSize = normalizeInteger(r.HouseholdSize);
    const dependants = normalizeInteger(r.Dependants);

    try {
        const pool = await getPool();

        // GET /api/clients  or  GET /api/clients?search=xxx
        if (req.method === 'GET') {
            const search = req.query && req.query.search;
            let result;
            if (search) {
                result = await pool.request()
                    .input('s', sql.NVarChar, `%${search}%`)
                    .query(`SELECT * FROM Clients WHERE Title LIKE @s OR Email LIKE @s OR Phone LIKE @s ORDER BY Created DESC`);
            } else {
                result = await pool.request().query('SELECT * FROM Clients ORDER BY Created DESC');
            }
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset };
            return;
        }

        // POST /api/clients
        if (req.method === 'POST') {
            const result = await pool.request()
                .input('Title',         sql.NVarChar, r.Title         || '')
                .input('Email',         sql.NVarChar, r.Email         || '')
                .input('Phone',         sql.NVarChar, r.Phone         || '')
                .input('DateOfBirth',   sql.Date,     r.DateOfBirth   || null)
                .input('Address',       sql.NVarChar, r.Address       || '')
                .input('InsuranceType', sql.NVarChar, r.InsuranceType || '')
                .input('Status',        sql.NVarChar, r.Status        || 'Active')
                .input('Notes',         sql.NVarChar, r.Notes         || '')
                .input('PremiumAmount', sql.Decimal(10, 2), premiumAmount)
                .input('HouseholdIncome', sql.Decimal(12, 2), householdIncome)
                .input('HouseholdSize', sql.Int, householdSize)
                .input('Dependants', sql.Int, dependants)
                .query(`INSERT INTO Clients (Title,Email,Phone,DateOfBirth,Address,InsuranceType,Status,Notes,PremiumAmount,HouseholdIncome,HouseholdSize,Dependants)
                        OUTPUT INSERTED.*
                        VALUES (@Title,@Email,@Phone,@DateOfBirth,@Address,@InsuranceType,@Status,@Notes,@PremiumAmount,@HouseholdIncome,@HouseholdSize,@Dependants)`);
            context.res = { status: 201, headers: { ...CORS, 'Content-Type': 'application/json' }, body: result.recordset[0] };
            return;
        }

        // PUT /api/clients/:id
        if (req.method === 'PUT' && id) {
            await pool.request()
                .input('Id',            sql.Int,      id)
                .input('Title',         sql.NVarChar, r.Title         || '')
                .input('Email',         sql.NVarChar, r.Email         || '')
                .input('Phone',         sql.NVarChar, r.Phone         || '')
                .input('DateOfBirth',   sql.Date,     r.DateOfBirth   || null)
                .input('Address',       sql.NVarChar, r.Address       || '')
                .input('InsuranceType', sql.NVarChar, r.InsuranceType || '')
                .input('Status',        sql.NVarChar, r.Status        || 'Active')
                .input('Notes',         sql.NVarChar, r.Notes         || '')
                .input('PremiumAmount', sql.Decimal(10, 2), premiumAmount)
                .input('HouseholdIncome', sql.Decimal(12, 2), householdIncome)
                .input('HouseholdSize', sql.Int, householdSize)
                .input('Dependants', sql.Int, dependants)
                .query(`UPDATE Clients SET Title=@Title,Email=@Email,Phone=@Phone,DateOfBirth=@DateOfBirth,
                        Address=@Address,InsuranceType=@InsuranceType,Status=@Status,Notes=@Notes,
                        PremiumAmount=@PremiumAmount,HouseholdIncome=@HouseholdIncome,
                        HouseholdSize=@HouseholdSize,Dependants=@Dependants,
                        Modified=SYSUTCDATETIME() WHERE Id=@Id`);
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        // DELETE /api/clients/:id
        if (req.method === 'DELETE' && id) {
            await pool.request()
                .input('Id', sql.Int, id)
                .query('DELETE FROM Clients WHERE Id = @Id');
            context.res = { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { success: true } };
            return;
        }

        context.res = { status: 400, headers: CORS, body: { error: 'Bad request' } };
    } catch (err) {
        context.log.error('clients error:', err.message);
        context.res = { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: { error: err.message } };
    }
};

function normalizeCurrency(value) {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInteger(value) {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}
