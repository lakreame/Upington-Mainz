module.exports = async function (context, req) {
    const hasSQLConfig = !!(
        process.env.SQL_SERVER &&
        process.env.SQL_DATABASE &&
        process.env.SQL_USER &&
        process.env.SQL_PASSWORD
    );

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            sqlConfigPresent: hasSQLConfig,
            envVars: {
                SQL_SERVER:   process.env.SQL_SERVER   ? '✅ set' : '❌ missing',
                SQL_DATABASE: process.env.SQL_DATABASE ? '✅ set' : '❌ missing',
                SQL_USER:     process.env.SQL_USER     ? '✅ set' : '❌ missing',
                SQL_PASSWORD: process.env.SQL_PASSWORD ? '✅ set' : '❌ missing',
            }
        }
    };
};
