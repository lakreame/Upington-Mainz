/**
 * _db.js  —  Shared Azure SQL connection for Azure Functions
 * Singleton pool that persists for the lifetime of the Function host process.
 */
const sql = require('mssql');

const config = {
    server:   process.env.SQL_SERVER   || '',
    database: process.env.SQL_DATABASE || '',
    user:     process.env.SQL_USER     || '',
    password: process.env.SQL_PASSWORD || '',
    options:  { encrypt: true, trustServerCertificate: false },
    pool:     { max: 5, min: 0, idleTimeoutMillis: 20000 },
};

let _pool = null;

async function getPool() {
    if (_pool && _pool.connected) return _pool;
    _pool = await new sql.ConnectionPool(config).connect();
    return _pool;
}

module.exports = { getPool, sql };
