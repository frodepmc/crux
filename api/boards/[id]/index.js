// api/boards/[id]/index.js
// PATCH  /api/boards/:id   → actualiza summary (name/color/icon/visibility/members)
// DELETE /api/boards/:id   → cascade

const { requireIntegrationAccess } = require('../../_lib/auth');
const lib = require('../../_lib/boards');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    try {
        const ix = await lib.getBoardsIndex();
        const idx = ix.findIndex((b) => b.id === id);
        if (idx === -1) return res.status(404).json({ error: 'board not found' });
        const board = ix[idx];

        // Visibilidad
        if (board.visibility === 'private' && !(board.members || []).includes(session.sub)) {
            return res.status(403).json({ error: 'not a member' });
        }

        if (req.method === 'PATCH') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || typeof body !== 'object') return res.status(400).json({ error: 'body required' });

            const allowed = ['name', 'color', 'icon', 'visibility', 'members'];
            const next = { ...board };
            for (const k of allowed) if (k in body) next[k] = body[k];
            if (next.visibility !== 'private') delete next.members;
            ix[idx] = next;
            await lib.setBoardsIndex(ix);

            return res.status(200).json({ summary: next });
        }

        if (req.method === 'DELETE') {
            if (session.role !== 'admin') return res.status(403).json({ error: 'admin only' });
            const result = await lib.deleteBoardCascade(id);
            return res.status(200).json({ deleted: true, ...result });
        }

        res.setHeader('Allow', 'PATCH, DELETE, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards/:id] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
