// POST /api/auth/login
// Body: { username, password }
// Ok  -> 200 { ok:true, user:{ username, role } } + cookie httpOnly con JWT
// Bad -> 401 { error: 'Invalid credentials' }

const { verifyCredentials, signSession, buildSessionCookie } = require('../_lib/auth');

// Rate limit en memoria (por IP). Se resetea en cada cold start.
// Es defensa en profundidad, no una barrera fuerte. La barrera real es bcrypt.
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function rateLimit(ip) {
    const now = Date.now();
    const rec = attempts.get(ip) || { count: 0, ts: now };
    if (now - rec.ts > WINDOW_MS) {
        rec.count = 0;
        rec.ts = now;
    }
    rec.count += 1;
    attempts.set(ip, rec);
    return rec.count <= MAX_ATTEMPTS;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    if (!rateLimit(ip)) {
        return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { username, password } = body;

        const user = await verifyCredentials(username, password);
        if (!user) {
            // Dummy compare para no filtrar existencia por timing (bcrypt ya mitiga, pero reforzamos)
            await new Promise((r) => setTimeout(r, 120));
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signSession(user);  // user es el perfil completo desde verifyCredentials
        res.setHeader('Set-Cookie', buildSessionCookie(token));
        return res.status(200).json({ ok: true, user: { username: user.username, role: user.role } });
    } catch (err) {
        console.error('[auth/login] error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
};
