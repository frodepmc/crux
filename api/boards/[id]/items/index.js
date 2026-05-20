// api/boards/[id]/items/index.js
// GET  /api/boards/:id/items → item-index + bulk items
// POST /api/boards/:id/items → crea item nuevo

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

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const access = await checkAccess(id, session);
    if (access.error) return res.status(access.error).json({ error: access.msg });

    try {
        if (req.method === 'GET') {
            const itemIndex = await lib.getItemIndex(id);
            const ids = itemIndex.map((x) => x.id);
            const items = await lib.mgetItems(id, ids);
            // Filtrar nulls (items huérfanos en el index)
            const itemsMap = {};
            ids.forEach((iid, i) => { if (items[i]) itemsMap[iid] = items[i]; });
            return res.status(200).json({ itemIndex, items: itemsMap });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || !body.name) return res.status(400).json({ error: 'name required' });

            const itemId = 'i_' + Math.random().toString(36).slice(2, 10);
            const now = new Date().toISOString();
            const item = {
                id: itemId,
                boardId: id,
                groupId: body.groupId || 'g_default',
                name: String(body.name).slice(0, 200),
                cells: body.cells && typeof body.cells === 'object' ? body.cells : {},
                version: 1,
                createdAt: now,
                createdBy: session.sub,
                updatedAt: now,
                updatedBy: session.sub,
            };
            await lib.setItem(id, itemId, item);

            const itemIndex = await lib.getItemIndex(id);
            const inGroup = itemIndex.filter((x) => x.groupId === item.groupId).length;
            itemIndex.push({ id: itemId, groupId: item.groupId, position: inGroup });
            await lib.setItemIndex(id, itemIndex);

            return res.status(201).json({ item });
        }

        res.setHeader('Allow', 'GET, POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards/:id/items] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
