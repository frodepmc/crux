// api/boards/[id]/comments/[itemId].js
// GET    /api/boards/:id/comments/:itemId       → array de comments
// POST   /api/boards/:id/comments/:itemId       → añade comment
// DELETE /api/boards/:id/comments/:itemId/:cid  → borra comment

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
        const item = await lib.getItem(id, itemId);
        if (item == null) return res.status(404).json({ error: 'item not found' });

        if (req.method === 'GET') {
            const comments = await lib.getComments(id, itemId);
            return res.status(200).json({ comments });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || typeof body.text !== 'string' || !body.text.trim()) {
                return res.status(400).json({ error: 'text required' });
            }
            const comment = {
                id: 'c_' + Math.random().toString(36).slice(2, 10),
                authorId: session.sub,
                text: String(body.text).slice(0, 4000),
                createdAt: new Date().toISOString(),
            };
            await lib.appendComment(id, itemId, comment);
            return res.status(201).json({ comment });
        }

        if (req.method === 'DELETE') {
            const cid = req.query.commentId || req.query.cid;
            if (!cid) return res.status(400).json({ error: 'commentId required' });
            // Solo el autor o admin pueden borrar
            const list = await lib.getComments(id, itemId);
            const target = list.find((c) => c.id === cid);
            if (!target) return res.status(404).json({ error: 'comment not found' });
            if (target.authorId !== session.sub && session.role !== 'admin') {
                return res.status(403).json({ error: 'only author or admin can delete' });
            }
            await lib.deleteComment(id, itemId, cid);
            return res.status(200).json({ deleted: true });
        }

        res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards/:id/comments/:itemId] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
