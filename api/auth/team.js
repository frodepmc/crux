// GET /api/auth/team
// Devuelve la lista publica del equipo (sin password, sin access).
// Cualquier usuario logueado puede leerla — no requiere ser admin.
// Ok  -> 200 { team: [{ username, name, role, color }, ...] }
// No  -> 401 { error: 'Unauthorized' }

const { readSessionFromRequest, listTeam } = require('../_lib/auth');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const session = readSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ team: listTeam() });
};
