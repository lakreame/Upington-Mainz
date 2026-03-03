// db.js — Azure SQL connection pool (mssql)
// Reads credentials from .env — never commit real credentials to source control.

require('dotenv').config();
const sql = require('mssql');

const config = {
    server:   process.env.SQL_SERVER   || 'yuriserver.database.windows.net',
    database: process.env.SQL_DATABASE || 'free-sql-db-3104594',
    user:     process.env.SQL_USER     || 'yuriserver',
    password: process.env.SQL_PASSWORD,
    port:     1433,
    options: {
        encrypt:             true,   // required for Azure SQL
        trustServerCertificate: false,
        enableArithAbort:    true,
        connectTimeout:      30000,
        requestTimeout:      30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

/** Singleton pool — created once, reused for every request. */
let pool = null;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log('✅ Azure SQL pool connected');
    }
    return pool;
}

/**
 * Convenience wrapper — runs a single parameterised query and returns the
 * recordset (rows).  Caller builds the request; this just runs it.
 *
 * Usage:
 *   const rows = await query(req => req
 *       .input('id', sql.Int, 5)
 *       .query('SELECT * FROM Clients WHERE Id = @id'));
 */
async function query(builderFn) {
    const p   = await getPool();
    const req = p.request();
    const res = await builderFn(req, sql);
    return res.recordset;
}

module.exports = { getPool, query, sql };
