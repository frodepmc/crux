// api/boards/[id]/items/reorder.js
// POST /api/boards/:id/items/reorder
// Body: { itemId, groupId, position }
// Reordena el item-index del board, opcionalmente cambia groupId del item.

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
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const access = await checkAccess(id, session);
    if (access.error) return res.status(access.error).json({ error: access.msg });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || !body.itemId) return res.status(400).json({ error: 'itemId required' });

        const itemIndex = await lib.getItemIndex(id);
        const idx = itemIndex.findIndex((x) => x.id === body.itemId);
        if (idx === -1) return res.status(404).json({ error: 'item not in index' });

        const entry = itemIndex.splice(idx, 1)[0];
        if (typeof body.groupId === 'string') entry.groupId = body.groupId;

        // Insertar en nueva posición DENTRO del nuevo grupo
        const sameGroup = itemIndex.filter((x) => x.groupId === entry.groupId);
        const targetPos = typeof body.position === 'number' ? Math.max(0, Math.min(body.position, sameGroup.length)) : sameGroup.length;

        // Encuentra el índice global del N-ésimo item del grupo
        let insertAt = itemIndex.length;
        let seen = 0;
        for (let i = 0; i < itemIndex.length; i += 1) {
            if (itemIndex[i].groupId === entry.groupId) {
                if (seen === targetPos) { insertAt = i; break; }
                seen += 1;
            }
        }
        itemIndex.splice(insertAt, 0, entry);

        // Si cambió de grupo, actualizar groupId del item
        if (typeof body.groupId === 'string') {
            const it = await lib.getItem(id, body.itemId);
            if (it && it.groupId !== body.groupId) {
                it.groupId = body.groupId;
                it.version = (it.version || 0) + 1;
                it.updatedAt = new Date().toISOString();
                it.updatedBy = session.sub;
                await lib.setItem(id, body.itemId, it);
            }
        }

        // Renumerar positions dentro de cada grupo
        const byGroup = {};
        for (const e of itemIndex) {
            byGroup[e.groupId] = byGroup[e.groupId] || 0;
            e.position = byGroup[e.groupId];
            byGroup[e.groupId] += 1;
        }
        await lib.setItemIndex(id, itemIndex);
        return res.status(200).json({ itemIndex });
    } catch (err) {
        console.error('[api/boards/:id/items/reorder] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
