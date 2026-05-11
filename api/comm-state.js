// Vercel Serverless Function - /api/comm-state
// Backend del Dashboard de Comunicacion usando Vercel KV.
// Protegido por sesion de admin (cookie httpOnly JWT).
//
// Variables de entorno requeridas (las mismas que /api/state):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
//   JWT_SECRET
//   ADMIN_USERS   (JSON [{u,p,role}])

const { kv } = require('@vercel/kv');
const { requireIntegrationAccess } = require('./_lib/auth');

const STATE_KEY = 'crux:dashboard:comm:state';

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Guard: sesion valida + acceso a la integracion 'communication'
    const session = requireIntegrationAccess(req, res, 'communication');
    if (!session) return;  // 401 o 403 ya respondido

    try {
        if (req.method === 'GET') {
            const data = await kv.get(STATE_KEY);
            if (data == null) return res.status(404).json({ error: 'No state yet' });
            return res.status(200).json({
                data,
                updatedAt: await kv.get(STATE_KEY + ':updatedAt'),
            });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || !body.data) return res.status(400).json({ error: 'Missing data' });

            await kv.set(STATE_KEY, body.data);
            const updatedAt = new Date().toISOString();
            await kv.set(STATE_KEY + ':updatedAt', updatedAt);
            return res.status(200).json({ ok: true, updatedAt, by: session.sub });
        }

        res.setHeader('Allow', 'GET, POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/comm-state] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
