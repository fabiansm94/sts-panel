const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const { action } = req.query;
    const { token, databaseId, taskId, body } = req.body || {};

    if (!token || !databaseId) {
        return res.status(400).json({ error: 'Token and databaseId required' });
    }

    const notionVersion = '2022-06-28';

    function notionRequest(method, path, data) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.notion.com',
                path,
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Notion-Version': notionVersion,
                    'Content-Type': 'application/json'
                }
            };
            const proxyReq = https.request(options, (proxyRes) => {
                let result = '';
                proxyRes.on('data', chunk => result += chunk);
                proxyRes.on('end', () => {
                    try { resolve(JSON.parse(result)); }
                    catch { resolve({ raw: result }); }
                });
            });
            proxyReq.on('error', reject);
            if (data) proxyReq.write(JSON.stringify(data));
            proxyReq.end();
        });
    }

    try {
        let result;
        switch (action) {
            case 'list':
                result = await notionRequest('GET', `/v1/databases/${databaseId}/query`, null);
                break;
            case 'create':
                result = await notionRequest('POST', `/v1/pages`, body);
                break;
            case 'update':
                result = await notionRequest('PATCH', `/v1/pages/${taskId}`, body);
                break;
            case 'delete':
                result = await notionRequest('PATCH', `/v1/pages/${taskId}`, { archived: true });
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
