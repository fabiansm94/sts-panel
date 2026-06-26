const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

function proxyNotion(req, res, body) {
    const notionUrl = new URL(req.url.replace('/api/', 'https://api.notion.com/'));
    const options = {
        hostname: notionUrl.hostname,
        path: notionUrl.pathname + notionUrl.search,
        method: req.method,
        headers: {
            'Authorization': req.headers['authorization'] || '',
            'Notion-Version': req.headers['notion-version'] || '2022-06-28',
            'Content-Type': 'application/json'
        }
    };
    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Notion-Version'
        });
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
    });
    if (body) proxyReq.write(body);
    proxyReq.end();
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Notion-Version'
        });
        return res.end();
    }

    if (req.url.startsWith('/api/')) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => proxyNotion(req, res, body || null));
        return;
    }

    let filePath = req.url === '/' ? '/panel-clientes.html' : req.url;
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);
    const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not found');
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`STS Security Panel running on port ${PORT}`);
});
