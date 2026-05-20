// api/boards/[id]/items/[itemId].js
// PATCH  /api/boards/:id/items/:itemId  → edita cells/name/groupId con CAS por version
// DELETE /api/boards/:id/items/:itemId  → borra item + comentarios

const { requireIntegrationAccess } = require('../../../_lib/auth');
const lib = require('../../../_lib/boards');

async function checkAccess(boardId, session) {
    const ix = await lib.getBoardsIndex();
    const b = ix.find((x) => x.id === boardId);
    if (!b) return { error: 404, msg: 'board not found' };
    if (b.visibility === 'private' && !(b.members || []).includes(session.sub)) {
        return { error: 403, msg: 'not a member' };
    }
    return { board: b };
}

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return;

    const { id, itemId } = req.query;
    if (!id || !itemId) return res.status(400).json({ error: 'id+itemId required' });

    const access = await checkAccess(id, session);
    if (access.error) return res.status(access.error).json({ error: access.msg });

    try {
        const current = await lib.getItem(id, itemId);
        if (current == null) return res.status(404).json({ error: 'item not found' });

        if (req.method === 'PATCH') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || typeof body !== 'object') return res.status(400).json({ error: 'body required' });

            // CAS por version
            if (typeof body.version === 'number' && body.version !== current.version) {
                return res.status(409).json({
                    error: 'version conflict',
                    serverVersion: current.version,
                    serverItem: current,
                });
            }

            const next = { ...current };
            if (typeof body.name === 'string') next.name = body.name.slice(0, 200);
            if (body.cells && typeof body.cells === 'object') {
                next.cells = { ...current.cells, ...body.cells };
            }
            if (typeof body.groupId === 'string') next.groupId = body.groupId;
            next.version = current.version + 1;
            next.updatedAt = new Date().toISOString();
            next.updatedBy = session.sub;

            await lib.setItem(id, itemId, next);
            return res.status(200).json({ item: next });
        }

        if (req.method === 'DELETE') {
            await lib.deleteItem(id, itemId);
            const ix = await lib.getItemIndex(id);
            await lib.setItemIndex(id, ix.filter((x) => x.id !== itemId));
            return res.status(200).json({ deleted: true });
        }

        res.setHeader('Allow', 'PATCH, DELETE, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards/:id/items/:itemId] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
