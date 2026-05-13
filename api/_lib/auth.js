// api/_lib/auth.js
// Helpers compartidos para autenticacion de admin.
// - Lee usuarios desde env var ADMIN_USERS (JSON: [{u, p, role, name, color, access}])
// - Firma/verifica JWT HS256 con JWT_SECRET (claims: sub, role, access)
// - Gestiona cookies httpOnly

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const COOKIE_NAME = 'crux_admin_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getUsers() {
    const raw = process.env.ADMIN_USERS;
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(Boolean);
    } catch (err) {
        console.error('[auth] ADMIN_USERS parse error:', err.message);
        return [];
    }
}

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 24) {
        throw new Error('JWT_SECRET must be set to a long random string (>= 24 chars).');
    }
    return secret;
}

// Normaliza un registro de ADMIN_USERS a un perfil publico (sin password)
function toProfile(user) {
    if (!user) return null;
    return {
        username: user.u,
        role: user.role || 'admin',
        name: user.name || user.u,
        color: user.color || '#3869AB',
        access: Array.isArray(user.access) ? user.access : ['*'],
    };
}

async function verifyCredentials(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') return null;
    const users = getUsers();
    const user = users.find((u) => (u.u || '').toLowerCase() === username.toLowerCase());
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.p || '');
    if (!ok) return null;
    return toProfile(user);
}

// Lookup de perfil por username (sin password). Devuelve null si no existe.
function loadProfile(username) {
    if (!username) return null;
    const users = getUsers();
    const user = users.find((u) => (u.u || '').toLowerCase() === String(username).toLowerCase());
    return toProfile(user);
}

// Lista publica del equipo (sin password, sin access). Para mostrar avatares y asignar a otros.
function listTeam() {
    return getUsers().map((u) => ({
        username: u.u,
        name: u.name || u.u,
        role: u.role || 'admin',
        color: u.color || '#3869AB',
    }));
}

function signSession(profile) {
    // profile = { username, role, access, ... }
    if (!profile || !profile.username) {
        throw new Error('[auth] signSession called with invalid profile');
    }
    return jwt.sign(
        { sub: profile.username, role: profile.role, access: profile.access || ['*'] },
        getSecret(),
        { algorithm: 'HS256', expiresIn: TOKEN_TTL_SECONDS }
    );
}

function verifySession(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    } catch (err) {
        return null;
    }
}

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    header.split(';').forEach((chunk) => {
        const eq = chunk.indexOf('=');
        if (eq === -1) return;
        const k = chunk.slice(0, eq).trim();
        const v = chunk.slice(eq + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
    });
    return out;
}

function buildSessionCookie(token, { clear = false } = {}) {
    const parts = [
        `${COOKIE_NAME}=${clear ? '' : token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Secure',
    ];
    if (clear) {
        parts.push('Max-Age=0');
    } else {
        parts.push(`Max-Age=${TOKEN_TTL_SECONDS}`);
    }
    return parts.join('; ');
}

function readSessionFromRequest(req) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    return verifySession(token);
}

function requireSession(req, res) {
    const session = readSessionFromRequest(req);
    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    return session;
}

// Devuelve true si la sesion tiene acceso a la integracion dada.
// Admins con access ["*"] tienen acceso a todo.
function hasAccessTo(session, integrationId) {
    if (!session) return false;
    const access = Array.isArray(session.access) ? session.access : [];
    return access.includes('*') || access.includes(integrationId);
}

// Guard combinado: requiere sesion valida + acceso a la integracion.
// Responde 401/403 si falla. Devuelve la sesion si OK, null si bloqueado.
//
// El access se relee desde ADMIN_USERS en cada request — no se confia en los claims
// del JWT, que quedaron congelados en el momento del login. Asi, anadir o revocar
// permisos en el env var surte efecto inmediato sin obligar al usuario a re-loguearse.
function requireIntegrationAccess(req, res, integrationId) {
    const session = readSessionFromRequest(req);
    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    const profile = loadProfile(session.sub);
    if (!profile) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    if (!hasAccessTo(profile, integrationId)) {
        res.status(403).json({ error: 'Forbidden: no access to integration ' + integrationId });
        return null;
    }
    return { ...session, access: profile.access, role: profile.role };
}

module.exports = {
    COOKIE_NAME,
    TOKEN_TTL_SECONDS,
    verifyCredentials,
    loadProfile,
    listTeam,
    signSession,
    verifySession,
    buildSessionCookie,
    readSessionFromRequest,
    requireSession,
    hasAccessTo,
    requireIntegrationAccess,
};
