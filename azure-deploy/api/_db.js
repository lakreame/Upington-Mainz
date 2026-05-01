/**
 * _db.js  —  Shared Azure SQL connection for Azure Functions
 * Singleton pool that persists for the lifetime of the Function host process.
 */
require('./_env');

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
let _schemaPromise = null;

async function getPool() {
    if (!_pool || !_pool.connected) {
        _pool = await new sql.ConnectionPool(config).connect();
    }

    if (!_schemaPromise) {
        _schemaPromise = ensureSchema(_pool).catch(err => {
            _schemaPromise = null;
            throw err;
        });
    }

    await _schemaPromise;
    return _pool;
}

async function ensureSchema(pool) {
    const schemaSql = `
IF OBJECT_ID(N'dbo.InsuranceTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InsuranceTypes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_InsuranceTypes_SortOrder DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_InsuranceTypes_IsActive DEFAULT (1),
        Created DATETIME2 NOT NULL CONSTRAINT DF_InsuranceTypes_Created DEFAULT SYSUTCDATETIME(),
        Modified DATETIME2 NOT NULL CONSTRAINT DF_InsuranceTypes_Modified DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX UX_InsuranceTypes_Name ON dbo.InsuranceTypes(Name);
END;

IF OBJECT_ID(N'dbo.InsuranceCompanies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InsuranceCompanies (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_InsuranceCompanies_SortOrder DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_InsuranceCompanies_IsActive DEFAULT (1),
        Created DATETIME2 NOT NULL CONSTRAINT DF_InsuranceCompanies_Created DEFAULT SYSUTCDATETIME(),
        Modified DATETIME2 NOT NULL CONSTRAINT DF_InsuranceCompanies_Modified DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX UX_InsuranceCompanies_Name ON dbo.InsuranceCompanies(Name);
END;

IF OBJECT_ID(N'dbo.Leads', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Leads', N'PremiumAmount') IS NULL
        ALTER TABLE dbo.Leads ADD PremiumAmount DECIMAL(10,2) NULL;
    IF COL_LENGTH(N'dbo.Leads', N'HouseholdIncome') IS NULL
        ALTER TABLE dbo.Leads ADD HouseholdIncome DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.Leads', N'HouseholdSize') IS NULL
        ALTER TABLE dbo.Leads ADD HouseholdSize INT NULL;
    IF COL_LENGTH(N'dbo.Leads', N'DEPENDANTS') IS NULL
        ALTER TABLE dbo.Leads ADD Dependants INT NULL;
    IF COL_LENGTH(N'dbo.Leads', N'ConsentNonMarketing') IS NULL
        ALTER TABLE dbo.Leads ADD ConsentNonMarketing BIT NOT NULL CONSTRAINT DF_Leads_ConsentNonMarketing DEFAULT (0);
    IF COL_LENGTH(N'dbo.Leads', N'ConsentMarketing') IS NULL
        ALTER TABLE dbo.Leads ADD ConsentMarketing BIT NOT NULL CONSTRAINT DF_Leads_ConsentMarketing DEFAULT (0);
END;

IF OBJECT_ID(N'dbo.Clients', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Clients', N'PremiumAmount') IS NULL
        ALTER TABLE dbo.Clients ADD PremiumAmount DECIMAL(10,2) NULL;
    IF COL_LENGTH(N'dbo.Clients', N'HouseholdIncome') IS NULL
        ALTER TABLE dbo.Clients ADD HouseholdIncome DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.Clients', N'HouseholdSize') IS NULL
        ALTER TABLE dbo.Clients ADD HouseholdSize INT NULL;
    IF COL_LENGTH(N'dbo.Clients', N'DEPENDANTS') IS NULL
        ALTER TABLE dbo.Clients ADD Dependants INT NULL;
END;
`;

    await pool.request().query(schemaSql);

    const defaultTypes = [
        'Medicare Advantage',
        'Medicare Supplement',
        'Dental Insurance',
        'Vision',
        'Accidental Indemnity',
        'Part D Prescription Drugs',
        'Health Insurance',
        'Life Insurance',
        'Auto Insurance',
        'Mortgage Protection',
        'Annuities'
    ];

    for (let index = 0; index < defaultTypes.length; index += 1) {
        await pool.request()
            .input('Name', sql.NVarChar(255), defaultTypes[index])
            .input('SortOrder', sql.Int, index + 1)
            .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.InsuranceTypes WHERE Name = @Name)
BEGIN
    INSERT INTO dbo.InsuranceTypes (Name, SortOrder)
    VALUES (@Name, @SortOrder);
END;
`);
    }
}

module.exports = { getPool, sql };
