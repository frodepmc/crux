// api/boards/[id]/meta.js
// GET   /api/boards/:id/meta → devuelve columns, groups, views
// PATCH /api/boards/:id/meta → reemplaza meta (validación shallow)

const { requireIntegrationAccess } = require('../../_lib/auth');
const lib = require('../../_lib/boards');

const VALID_COL_TYPES = new Set([
    'text', 'longtext', 'status', 'tags', 'person',
    'date', 'daterange', 'number', 'link', 'email',
    'phone', 'checkbox', 'dependency',
]);

function validateMeta(meta) {
    if (!meta || typeof meta !== 'object') return 'meta object required';
    if (!Array.isArray(meta.columns)) return 'columns must be array';
    for (const c of meta.columns) {
        if (!c.id || !c.type || !c.name) return 'column needs id/type/name';
        if (!VALID_COL_TYPES.has(c.type)) return 'unknown column type: ' + c.type;
    }
    if (!Array.isArray(meta.groups)) return 'groups must be array';
    return null;
}

async function isVisibleToUser(boardId, session) {
    const ix = await lib.getBoardsIndex();
    const b = ix.find((x) => x.id === boardId);
    if (!b) return null;
    if (b.visibility === 'team') return b;
    if (b.visibility === 'private' && (b.members || []).includes(session.sub)) return b;
    return false;
}

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = requireIntegrationAccess(req, res, 'boards');
    if (!session) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const access = await isVisibleToUser(id, session);
    if (access === null) return res.status(404).json({ error: 'board not found' });
    if (access === false) return res.status(403).json({ error: 'not a member' });

    try {
        if (req.method === 'GET') {
            const meta = await lib.getBoardMeta(id);
            if (meta == null) return res.status(404).json({ error: 'meta not found' });
            return res.status(200).json({ meta });
        }

        if (req.method === 'PATCH') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const err = validateMeta(body);
            if (err) return res.status(400).json({ error: err });
            await lib.setBoardMeta(id, body);
            return res.status(200).json({ meta: body });
        }

        res.setHeader('Allow', 'GET, PATCH, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[api/boards/:id/meta] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
