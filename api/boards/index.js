// api/boards/index.js
// GET  /api/boards          → lista boards visibles al usuario
// POST /api/boards          → crear board (admin only)

const { requireIntegrationAccess } = require('../_lib/auth');
const lib = require('../_lib/boards');

function isVisibleToUser(board, session) {
    if (board.visibility === 'team') return true;
    if (board.visibility === 'private') {
        return Array.isArray(board.members) && board.members.includes(session.sub);
    }
    return false;
}

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return; // 401/403 ya respondido

    try {
        if (req.method === 'GET') {
            const ix = await lib.getBoardsIndex();
            const visible = ix.filter((b) => isVisibleToUser(b, session));
            return res.status(200).json({ boards: visible });
        }

        if (req.method === 'POST') {
            if (session.role !== 'admin') return res.status(403).json({ error: 'admin only' });

            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || !body.name) return res.status(400).json({ error: 'name required' });

            const id = 'b_' + Math.random().toString(36).slice(2, 10);
            const summary = {
                id,
                name: String(body.name).slice(0, 80),
                type: body.type || 'custom',
                color: body.color || '#3869AB',
                icon: body.icon || 'layers',
                visibility: body.visibility === 'private' ? 'private' : 'team',
            };
            if (summary.visibility === 'private') {
                summary.members = Array.isArray(body.members) ? body.members : [session.sub];
            }

            const ix = await lib.getBoardsIndex();
            ix.push(summary);
            await lib.setBoardsIndex(ix);

            const meta = {
                createdAt: new Date().toISOString(),
                createdBy: session.sub,
                columns: Array.isArray(body.columns) ? body.columns : [],
                groups: Array.isArray(body.groups) ? body.groups : [{ id: 'g_default', name: 'Default', color: '#3869AB', order: 1, collapsed: false }],
                views: body.views || {},
                defaultView: body.defaultView || 'table',
            };
            await lib.setBoardMeta(id, meta);
            await lib.setItemIndex(id, []);

            return res.status(201).json({ id, summary, meta });
        }

        res.setHeader('Allow', 'GET, POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
