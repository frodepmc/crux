// GET /api/auth/me
// Devuelve el perfil completo del usuario logueado (sin password).
// Ok  -> 200 { username, name, role, color, access, isAdmin, expiresAt }
// No  -> 401 { error: 'Unauthorized' }

const { readSessionFromRequest, loadProfile } = require('../_lib/auth');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const session = readSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const profile = loadProfile(session.sub);
    if (!profile) {
        // El JWT es valido pero el usuario ya no existe en ADMIN_USERS
        // (p.ej. lo borraron despues de loguearse). Tratar como no autorizado.
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
        username: profile.username,
        name: profile.name,
        role: profile.role,
        color: profile.color,
        access: profile.access,
        isAdmin: profile.role === 'admin',
        expiresAt: session.exp ? new Date(session.exp * 1000).toISOString() : null,
    });
};
