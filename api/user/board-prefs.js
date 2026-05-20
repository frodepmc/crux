// api/user/board-prefs.js
// GET   /api/user/board-prefs → prefs del usuario actual
// PATCH /api/user/board-prefs → merge parcial

const { requireIntegrationAccess } = require('../_lib/auth');
const lib = require('../_lib/boards');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return;

    try {
        if (req.method === 'GET') {
            const prefs = await lib.getUserPrefs(session.sub);
            return res.status(200).json({ prefs });
        }

        if (req.method === 'PATCH') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || typeof body !== 'object') return res.status(400).json({ error: 'body required' });
            const prefs = await lib.patchUserPrefs(session.sub, body);
            return res.status(200).json({ prefs });
        }

        res.setHeader('Allow', 'GET, PATCH, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/user/board-prefs] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
