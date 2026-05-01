const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 8080);
const functionsBaseUrl = process.env.FUNCTIONS_BASE_URL || 'http://127.0.0.1:7071';

app.disable('x-powered-by');

app.use('/api', express.raw({ type: '*/*', limit: '10mb' }));
app.use('/api', proxyToFunctions);
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log('='.repeat(60));
    console.log('Upington Mainz local static server running');
    console.log('Static site:   http://localhost:' + port + '/upingtonadmin.html');
    console.log('Functions API: ' + functionsBaseUrl + '/api');
    console.log('='.repeat(60));
});

async function proxyToFunctions(req, res) {
    const targetUrl = new URL(req.originalUrl, functionsBaseUrl).toString();

    try {
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (!value) return;
            const lower = key.toLowerCase();
            if (['host', 'connection', 'content-length'].includes(lower)) return;
            if (Array.isArray(value)) {
                value.forEach(item => headers.append(key, item));
            } else {
                headers.set(key, value);
            }
        });

        const init = {
            method: req.method,
            headers,
            redirect: 'manual'
        };

        if (!['GET', 'HEAD'].includes(req.method) && req.body && req.body.length) {
            init.body = req.body;
        }

        const response = await fetch(targetUrl, init);
        const responseBody = Buffer.from(await response.arrayBuffer());

        res.status(response.status);
        response.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            if (['content-length', 'transfer-encoding', 'connection'].includes(lower)) return;
            res.setHeader(key, value);
        });
        res.send(responseBody);
    } catch (error) {
        res.status(502).json({
            error: 'Unable to reach Azure Functions host',
            detail: error.message,
            targetUrl
        });
    }
}
