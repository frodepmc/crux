# Identidad y permisos del equipo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar la identidad de login (JWT) con el modelo de equipo de los dashboards, añadir control de acceso por integración, y dejar el patrón reusable para futuras herramientas.

**Architecture:** El env var `ADMIN_USERS` extiende su shape para incluir perfil (`name`, `color`) y matriz de acceso (`access`). El JWT añade el claim `access` para chequeo backend. Dos nuevos endpoints (`/api/auth/me`, `/api/auth/team`) sirven la identidad enriquecida al frontend. Cada integración valida acceso en el cliente (UX) y en el backend (defensa). El dashboard de comunicación elimina el `EQUIPO_SEED` y consume identidad del servidor.

**Tech Stack:** Vercel Serverless Functions (Node.js, CommonJS), Vercel KV, JWT (jsonwebtoken HS256), bcryptjs, React 18 via CDN inline en HTML, sin build step ni framework de tests.

**Repo base:** `/mnt/c/codigo/Crux/pan/pan/` (rama `main`).

**Spec de referencia:** `docs/superpowers/specs/2026-05-12-identidad-y-permisos-design.md`

**Estrategia de testing:** El repo no tiene framework de tests. Verificación manual con `curl` contra el endpoint local (`vercel dev` en :3000 o `python3 -m http.server` para HTML estático) y Playwright para flujos de UI. Cada task tiene una sección "Verificar" con comandos concretos.

---

## File Structure

**Crear:**
- `api/auth/me.js` — endpoint que devuelve el perfil completo del usuario logueado
- `api/auth/team.js` — endpoint que devuelve la lista pública del equipo

**Modificar:**
- `api/_lib/auth.js` — añadir `loadProfile`, `hasAccessTo`, `requireIntegrationAccess`; `verifyCredentials` devuelve perfil completo; `signSession` incluye `access` en payload
- `api/auth/login.js` — usar el payload extendido al firmar la sesión
- `api/comm-state.js` — guard de acceso a integración `"communication"`
- `assets/js/admin.js` — fetch del perfil rico (`/api/auth/me`), filtrado del hub por `access` en lugar de `role`, `devPreviewSession` incluye `access: ["*"]`
- `admin/integrations/communication.html` — guard extendido con check de acceso, hooks `useCurrentUser`/`useTeam`, eliminación de `EQUIPO_SEED`/`USUARIO_KEY`/store.equipo, header read-only, `VistaEquipo` read-only

**No tocar:**
- `api/auth/verify.js` — se mantiene por compatibilidad
- `api/auth/logout.js`
- `api/state.js` (es del dashboard financiero, se actualizará en su propia spec cuando toque)
- `admin/integrations/financial.html` — fuera de scope; se aplicará el mismo patrón en otra iteración
- `scripts/hash-password.js` — ya existe, no hace falta crearlo

---

### Task 1: Extender `_lib/auth.js` con perfil y helpers de acceso

**Files:**
- Modify: `api/_lib/auth.js`

#### - [ ] **Step 1.1: Sustituir el contenido completo de `_lib/auth.js`**

Sobreescribe el archivo con esta versión (añade `loadProfile`, `hasAccessTo`, `requireIntegrationAccess`, y enriquece `verifyCredentials`). La forma del JWT pasa de `{ sub, role }` a `{ sub, role, access }`:

```js
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
function requireIntegrationAccess(req, res, integrationId) {
    const session = readSessionFromRequest(req);
    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    if (!hasAccessTo(session, integrationId)) {
        res.status(403).json({ error: 'Forbidden: no access to integration ' + integrationId });
        return null;
    }
    return session;
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
```

#### - [ ] **Step 1.2: Actualizar `api/auth/login.js` para pasar el perfil completo a `signSession`**

`signSession` ya no recibe `{ sub, role }` sino el perfil completo. Edita las líneas que firman y responden:

```js
// Antes:
//   const token = signSession({ sub: user.username, role: user.role });
//   res.setHeader('Set-Cookie', buildSessionCookie(token));
//   return res.status(200).json({ ok: true, user });

// Despues:
const token = signSession(user);  // user ya es el perfil completo desde verifyCredentials
res.setHeader('Set-Cookie', buildSessionCookie(token));
return res.status(200).json({ ok: true, user: { username: user.username, role: user.role } });
```

Mantener la respuesta de `/api/auth/login` reducida a `{ username, role }` para no exponer `access` en una respuesta que el frontend de login no necesita (el frontend ya hace una segunda llamada a `/api/auth/verify` o `/api/auth/me`).

#### - [ ] **Step 1.3: Verificar localmente**

Necesitas `vercel dev` corriendo en `:3000` con las env vars (`ADMIN_USERS`, `JWT_SECRET`, `KV_*`) cargadas. Si no tienes el setup local, salta este paso y verifica en preview deploy.

Con un usuario válido en `ADMIN_USERS` (por ejemplo el actual de Pedro), hacer login y leer el JWT:

```bash
# Login: obtiene la cookie
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c /tmp/crux-cookie.txt \
  -d '{"username":"pedro@cruxmallorca.es","password":"<password real>"}'
# Expected: 200 OK + Set-Cookie: crux_admin_session=eyJ...

# Decodificar el payload del JWT (solo lectura, no verifica firma)
COOKIE_VAL=$(grep crux_admin_session /tmp/crux-cookie.txt | awk '{print $7}')
echo "$COOKIE_VAL" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null
# Expected: {"sub":"pedro@…","role":"admin","access":["*"],"iat":…,"exp":…}
```

Si el `ADMIN_USERS` en local todavía tiene la forma antigua (`{u, p, role}` sin `name/color/access`), el login funciona pero el JWT no tendrá `access` correcto. Antes de probar, edita tu `.env.local` o el env var en Vercel para incluir al menos un usuario con la forma nueva.

Si no puedes hacer `vercel dev` localmente, salta a la verificación en preview deploy tras desplegar el commit.

#### - [ ] **Step 1.4: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan
git add api/_lib/auth.js api/auth/login.js
git commit -m "$(cat <<'EOF'
feat(auth): perfil enriquecido + claim access en JWT

Extiende ADMIN_USERS para soportar name, color y access (lista de
integraciones permitidas). verifyCredentials devuelve perfil completo;
signSession lo firma con sub, role, access. Añade helpers loadProfile,
listTeam, hasAccessTo y requireIntegrationAccess para los siguientes
endpoints y guards.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Endpoint `/api/auth/me`

**Files:**
- Create: `api/auth/me.js`

#### - [ ] **Step 2.1: Crear `api/auth/me.js`**

```js
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
```

#### - [ ] **Step 2.2: Verificar**

Con la cookie de Task 1.3:

```bash
curl -s http://localhost:3000/api/auth/me -b /tmp/crux-cookie.txt | jq .
# Expected:
# {
#   "username": "pedro@cruxmallorca.es",
#   "name": "Pedro Castrillo",
#   "role": "admin",
#   "color": "#3869AB",
#   "access": ["*"],
#   "isAdmin": true,
#   "expiresAt": "2026-05-19T..."
# }

# Sin cookie:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/me
# Expected: 401
```

#### - [ ] **Step 2.3: Commit**

```bash
git add api/auth/me.js
git commit -m "$(cat <<'EOF'
feat(auth): endpoint /api/auth/me con perfil completo

Devuelve el perfil del usuario logueado (username, name, role, color,
access, isAdmin, expiresAt). Reemplaza a /api/auth/verify para los
consumidores que necesitan identidad enriquecida; verify queda como
compat hasta que se migre completamente.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Endpoint `/api/auth/team`

**Files:**
- Create: `api/auth/team.js`

#### - [ ] **Step 3.1: Crear `api/auth/team.js`**

```js
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
```

#### - [ ] **Step 3.2: Verificar**

```bash
curl -s http://localhost:3000/api/auth/team -b /tmp/crux-cookie.txt | jq .
# Expected:
# {
#   "team": [
#     { "username": "pedro@…", "name": "Pedro Castrillo", "role": "admin", "color": "#3869AB" },
#     ...
#   ]
# }
```

Comprueba que **NO** aparece `p` (hash) ni `access` en la respuesta.

#### - [ ] **Step 3.3: Commit**

```bash
git add api/auth/team.js
git commit -m "$(cat <<'EOF'
feat(auth): endpoint /api/auth/team con lista publica del equipo

Devuelve username, name, role y color de todos los miembros para
mostrar avatares y asignar iteraciones a otros. Sin password hash y
sin matriz de accesos — esa info se queda en el servidor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Guard de acceso en `/api/comm-state`

**Files:**
- Modify: `api/comm-state.js`

#### - [ ] **Step 4.1: Reemplazar `readSessionFromRequest` por `requireIntegrationAccess`**

Edición concreta sobre `api/comm-state.js`:

```js
// Reemplaza:
// const { readSessionFromRequest } = require('./_lib/auth');
const { requireIntegrationAccess } = require('./_lib/auth');

// Y dentro del handler, reemplaza:
//     const session = readSessionFromRequest(req);
//     if (!session) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }
// Por:
    const session = requireIntegrationAccess(req, res, 'communication');
    if (!session) return;  // 401 o 403 ya respondido
```

El resto del archivo no cambia (incluido el uso de `session.sub` en el `by:` del POST).

#### - [ ] **Step 4.2: Verificar**

Con cookie de un admin (`access: ["*"]`):
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/comm-state -b /tmp/crux-cookie.txt
# Expected: 200 si hay state, 404 si no
```

Con cookie de un member SIN acceso a comunicación (preparar manualmente un usuario en `ADMIN_USERS` con `access: ["financial"]` y loguearse con él para obtener una segunda cookie):
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/comm-state -b /tmp/crux-cookie-noaccess.txt
# Expected: 403
```

Sin cookie:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/comm-state
# Expected: 401
```

#### - [ ] **Step 4.3: Commit**

```bash
git add api/comm-state.js
git commit -m "$(cat <<'EOF'
feat(api): guard de acceso por integracion en comm-state

Reemplaza el check generico de sesion por requireIntegrationAccess
contra la integracion 'communication'. Defensa en profundidad: aunque
un member burle el filtrado del cliente, el backend rechaza con 403.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Filtrado del hub por `access` en `assets/js/admin.js`

**Files:**
- Modify: `assets/js/admin.js`

#### - [ ] **Step 5.1: Añadir `apiMe()` y migrar `guard()` a `/api/auth/me`**

Justo después de `apiVerify()` (línea ~49), añadir `apiMe()`:

```js
async function apiMe() {
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (_) {
        return null;
    }
}
```

Modificar `devPreviewSession()` (línea ~53-62) para que el shape coincida con `/api/auth/me`:

```js
function devPreviewSession() {
    const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
    const wants = new URLSearchParams(window.location.search).has('__preview');
    if (!isLocal || !wants) return null;
    return {
        username: 'preview@localhost',
        name: 'Preview Local',
        role: 'admin',
        color: '#3869AB',
        access: ['*'],
        isAdmin: true,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        _preview: true,
    };
}
```

Modificar `guard()` (línea ~65-74) para usar `apiMe()` y devolver el perfil con la misma forma:

```js
async function guard({ redirectTo = LOGIN_URL } = {}) {
    const fake = devPreviewSession();
    if (fake) return fake;
    const profile = await apiMe();
    if (!profile || !profile.username) {
        window.location.replace(redirectTo);
        return null;
    }
    return profile;
}
```

#### - [ ] **Step 5.2: Adaptar `initHubPage` al nuevo shape**

`initHubPage()` (líneas ~220-265) actualmente lee `session.user?.username`, `session.user?.role`, `session.expiresAt`. Migrar a flat:

```js
async function initHubPage() {
    const profile = await guard();
    if (!profile) return;

    // Pintar username en topbar
    const userEl = document.getElementById('adm-user-tag');
    if (userEl && profile.username) userEl.textContent = profile.username;

    // Pintar role
    const roleEl = document.getElementById('adm-role-tag');
    if (roleEl && profile.role) roleEl.textContent = profile.role;

    // Clock
    startClock(document.getElementById('adm-clock'));

    // Sidemeta: session expiry
    const expEl = document.getElementById('adm-session-exp');
    if (expEl && profile.expiresAt) {
        const d = new Date(profile.expiresAt);
        expEl.textContent = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    }

    // Logout
    const logoutBtn = document.getElementById('adm-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Saliendo…';
            await apiLogout();
            window.location.replace(LOGIN_URL);
        });
    }

    // Registry + render
    try {
        const res = await fetch('/admin/integrations.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('registry not found');
        const integrations = await res.json();
        renderIntegrations(integrations, profile);
    } catch (err) {
        console.error('[hub] registry error:', err);
        const grid = document.getElementById('adm-integrations');
        if (grid) {
            grid.innerHTML = `<div class="adm-int is-soon"><div class="adm-int__head"><span class="adm-int__num">ERR</span><span class="adm-int__badge">No cargado</span></div><h3 class="adm-int__title">Registro no disponible</h3><p class="adm-int__desc">No se pudo cargar <code>/admin/integrations.json</code>. Revisa consola.</p></div>`;
        }
    }
}
```

#### - [ ] **Step 5.3: Adaptar `renderIntegrations` a `profile.access` por id de integración**

`renderIntegrations(list, session)` (líneas ~279-...) actualmente filtra por `session.user?.role` contra `item.roles`. Cambiamos a filtrar por `profile.access` contra `item.id`:

```js
function renderIntegrations(list, profile) {
    const grid = document.getElementById('adm-integrations');
    if (!grid) return;
    if (!Array.isArray(list) || list.length === 0) {
        grid.innerHTML = '<p class="adm-stage__sub">No hay integraciones registradas todavia.</p>';
        return;
    }

    const access = Array.isArray(profile?.access) ? profile.access : [];
    const hasAll = access.includes('*');

    const visible = list.filter((item) => hasAll || access.includes(item.id));

    if (visible.length === 0) {
        grid.innerHTML = '<p class="adm-stage__sub">Tu cuenta no tiene integraciones asignadas. Habla con un admin.</p>';
        return;
    }

    const html = visible.map((item, i) => {
        const num = String(i + 1).padStart(2, '0');
        const glyph = GLYPHS[item.icon] || GLYPHS.layers;
        const isLive = item.status === 'live';
        const tag = isLive ? 'Entrar' : 'Proximamente';
        const badgeClass = item.status === 'live'
            ? 'adm-int__badge--live'
            : (item.status === 'soon' ? 'adm-int__badge--soon' : '');
        const badgeText = item.status === 'live' ? 'Live' : (item.status === 'soon' ? 'Soon' : 'Cerrado');
        const metaBits = (item.meta || []).map((m) => `<span>${escapeHtml(m)}</span>`).join('');
        const wrapTag = isLive ? 'a' : 'div';
        const wrapAttrs = isLive
            ? `href="${escapeAttr(item.path)}" class="adm-int"`
            : `class="adm-int is-soon" aria-disabled="true"`;

        return `
            <${wrapTag} ${wrapAttrs}>
                <div class="adm-int__head">
                    <span class="adm-int__num mono">· ${num} ·</span>
                    <span class="adm-int__badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="adm-int__glyph" aria-hidden="true">${glyph}</div>
                <h3 class="adm-int__title">${escapeHtml(item.name)}</h3>
                <p class="adm-int__desc">${escapeHtml(item.description)}</p>
                <div class="adm-int__meta">${metaBits}</div>
                <div class="adm-int__cta">${tag} <span aria-hidden="true">→</span></div>
            </${wrapTag}>
        `;
    }).join('');

    grid.innerHTML = html;
}
```

Nota: aquí desaparece la diferenciación cliente/visual de "live pero sin acceso" (que antes mostraba "Sin acceso"). Ahora si no tienes acceso, la integración **no aparece** en absoluto. Es coherente con la spec: members ven solo lo que pueden tocar.

#### - [ ] **Step 5.4: Adaptar otras llamadas a `apiVerify`/shape antiguo**

Buscar otras referencias en `admin.js` que dependan del shape `{ user: { username, role }, expiresAt }`:

```bash
grep -n "session.user\|session\.expiresAt" /mnt/c/codigo/Crux/pan/pan/assets/js/admin.js
```

Para cada referencia, migrar al shape plano (`profile.username`, `profile.role`, `profile.expiresAt`). Si `bounceIfAuthed` se usa, también actualizarlo.

Si `apiVerify()` queda sin consumidores, **dejarlo en su sitio** — los HTML legacy podrían usarlo. No lo borres.

#### - [ ] **Step 5.5: Verificar el hub con Playwright**

```bash
cd /mnt/c/codigo/Crux/pan/pan
python3 -m http.server 3000 > /tmp/pan-server.log 2>&1 &
```

Abrir `http://localhost:3000/admin/hub.html?__preview` con Playwright. Como `__preview` activa `devPreviewSession()` con `access: ["*"]`, debes ver las 2 integraciones live (Financiero, Comunicación) + las 4 "soon" (CRM, Newsletter, Docs, Settings).

Snapshot esperado: 6 cards en total.

#### - [ ] **Step 5.6: Commit**

```bash
git add assets/js/admin.js
git commit -m "$(cat <<'EOF'
feat(admin): hub filtra integraciones por access del usuario

guard() ahora consume /api/auth/me y devuelve el perfil plano
(username, role, access, isAdmin). renderIntegrations filtra por
profile.access contra item.id en lugar de profile.role contra
item.roles. Los members solo ven integraciones a las que tienen
acceso; admins (access ["*"]) ven todas.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Extender el guard de `communication.html` con check de acceso

**Files:**
- Modify: `admin/integrations/communication.html` (solo el bloque del `<script>` guard en el `<head>`, líneas ~10-48)

#### - [ ] **Step 6.1: Reemplazar el guard del head**

El bloque actual hace `fetch('/api/auth/verify')`. Sustituirlo por una versión que pida `/api/auth/me` y valide acceso a `"communication"`:

Reemplazar el contenido del `<script>` (líneas 10-48 aprox) por:

```js
(function () {
  // Hide body until session is verified (prevents flash of content).
  var styleEl = document.createElement('style');
  styleEl.id = 'crux-admin-guard-style';
  styleEl.textContent = 'body{visibility:hidden}html{background:#0E1A2B}#crux-guard-veil{position:fixed;inset:0;z-index:999999;background:#0E1A2B;color:#3869AB;display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.25em;text-transform:uppercase;visibility:visible}';
  document.head.appendChild(styleEl);

  // Veil mounted after DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('crux-guard-veil')) return;
    var veil = document.createElement('div');
    veil.id = 'crux-guard-veil';
    veil.textContent = 'Verificando sesión…';
    document.body.appendChild(veil);
  });

  // Dev-only bypass: en localhost + ?__preview, saltar verificación
  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
  var wantsPreview = new URLSearchParams(window.location.search).has('__preview');
  var reveal = function (profile) {
    var s = document.getElementById('crux-admin-guard-style');
    if (s) s.remove();
    var v = document.getElementById('crux-guard-veil');
    if (v) v.remove();
    // Expone el perfil para que la app React lo consuma sin un segundo fetch
    window.__cruxProfile = profile || null;
  };
  if (isLocal && wantsPreview) {
    reveal({
      username: 'preview@localhost',
      name: 'Preview Local',
      role: 'admin',
      color: '#3869AB',
      access: ['*'],
      isAdmin: true,
    });
    return;
  }

  fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('unauth');
      return r.json();
    })
    .then(function (profile) {
      var access = Array.isArray(profile.access) ? profile.access : [];
      var hasAccess = access.includes('*') || access.includes('communication');
      if (!hasAccess) {
        window.location.replace('/admin/hub');
        return;
      }
      reveal(profile);
    })
    .catch(function () {
      window.location.replace('/admin');
    });
})();
```

Cambios clave respecto al original:
- Endpoint: `/api/auth/verify` → `/api/auth/me`.
- Check de acceso: si `access` no incluye `"communication"` ni `"*"`, redirect a `/admin/hub`.
- Cuando hay sesión válida, el perfil se guarda en `window.__cruxProfile` para que el hook `useCurrentUser` del Task 7 lo consuma sin un segundo fetch.
- En modo `?__preview`, también se publica un perfil fake en `window.__cruxProfile` con `access: ["*"]`.

#### - [ ] **Step 6.2: Verificar manualmente**

Levantar `python3 -m http.server 3000` desde `Crux/pan/pan` y abrir con Playwright:

```
http://localhost:3000/admin/integrations/communication.html?__preview
```

Esperado: el dashboard carga y `window.__cruxProfile` está disponible.

```js
// En la consola del navegador (vía browser_evaluate):
JSON.stringify(window.__cruxProfile);
// Expected: '{"username":"preview@localhost","name":"Preview Local",...,"access":["*"]}'
```

Sin `?__preview` y sin cookie (en local no se llega a `/api/auth/me`, hace catch → redirect). Esperado: redirect a `/admin`.

#### - [ ] **Step 6.3: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
feat(comm): guard valida acceso a la integracion y expone perfil

El guard pide /api/auth/me en vez de /verify y comprueba que access
incluye 'communication' (o '*'). Si no, redirect al hub. El perfil
queda en window.__cruxProfile para que el hook useCurrentUser de la
app React lo consuma sin segundo fetch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Añadir hooks `useCurrentUser` y `useTeam` (cambio aditivo, sin tocar el seed todavía)

**Files:**
- Modify: `admin/integrations/communication.html`

#### - [ ] **Step 7.1: Insertar los hooks justo después de la línea `const { useState, useEffect, ... } = React;`**

Buscar la línea `const { useState, useEffect, useCallback, useRef, useMemo } = React;` (alrededor de la 257). Justo después, insertar:

```jsx
    /* ─── Identidad del usuario logueado ─── */
    // Lee el perfil que el guard del <head> dejó en window.__cruxProfile.
    // Si no está disponible (no debería pasar en producción), hace fetch al endpoint.
    function useCurrentUser() {
      const [profile, setProfile] = useState(() => window.__cruxProfile || null);
      useEffect(() => {
        if (profile) return;
        let cancelled = false;
        fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
          .then(r => r.ok ? r.json() : null)
          .then(p => { if (!cancelled && p) setProfile(p); })
          .catch(() => {});
        return () => { cancelled = true; };
      }, []);
      return profile;
    }

    /* ─── Lista pública del equipo ─── */
    let __teamCache = null;
    let __teamPromise = null;
    function fetchTeam() {
      if (__teamCache) return Promise.resolve(__teamCache);
      if (__teamPromise) return __teamPromise;
      __teamPromise = fetch('/api/auth/team', { credentials: 'same-origin', cache: 'no-store' })
        .then(r => r.ok ? r.json() : { team: [] })
        .then(json => { __teamCache = json.team || []; return __teamCache; })
        .catch(() => []);
      return __teamPromise;
    }

    function useTeam() {
      const [team, setTeam] = useState(__teamCache || []);
      useEffect(() => {
        let cancelled = false;
        fetchTeam().then(t => { if (!cancelled) setTeam(t); });
        return () => { cancelled = true; };
      }, []);
      return team;
    }
```

#### - [ ] **Step 7.2: Verificar que los hooks funcionan sin tocar nada más**

En la consola del navegador del dashboard cargado en `?__preview`:

```js
// El módulo React vive en window.React; los hooks viven inline.
// La forma más simple es montar un componente de prueba en una div temporal,
// pero más fácil: forzar un fetch directo.

fetch('/api/auth/me?fake=1', { credentials: 'same-origin' })
  .then(r => r.status);
// Expected: 200 si hay sesión, 401 si no

window.__cruxProfile;
// Expected: { username: 'preview@localhost', access: ['*'], ... }
```

Aún no consumimos `useCurrentUser` / `useTeam` desde ningún componente, así que la app sigue funcionando con `EQUIPO_SEED`. Esto es intencionado para hacer el cambio incremental.

#### - [ ] **Step 7.3: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
feat(comm): hooks useCurrentUser y useTeam (sin consumidores aún)

Añade dos hooks reusables que leen del perfil expuesto por el guard
(window.__cruxProfile) y de /api/auth/team con caché en memoria. Aún
sin consumir desde los componentes — el siguiente commit migra la
app a esta fuente de identidad.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Migrar `usuarioActual` del store local a `useCurrentUser`

**Files:**
- Modify: `admin/integrations/communication.html`

#### - [ ] **Step 8.1: Identificar el grafo de consumidores**

Buscar todos los consumidores actuales de `usuarioActual`:

```bash
grep -n "usuarioActual\|USUARIO_KEY\|usuarioActualId\|getUsuarioActual\|setUsuarioActual" /mnt/c/codigo/Crux/pan/pan/admin/integrations/communication.html | head -30
```

Tendrás algo así (números aproximados):
- `~ línea 273` — `const USUARIO_KEY = "crux.usuarioActualId";`
- `~ línea 356` — el store inicializa `usuarioActualId` desde localStorage o desde `EQUIPO_SEED[0].id`
- `~ línea 906` — `function Header({ usuarioActual, equipo, onChangeUsuario, ...})`
- App raíz — pasa `usuarioActual` a Header, lo lee del store via `useStore(store)`
- VistaEquipo, VistaProyecto, etc. — varios usan `store.getUsuarioActual()` o lo reciben como prop

#### - [ ] **Step 8.2: Cambiar la app raíz para que `usuarioActual` venga del hook**

Localizar el componente raíz (función `App` o equivalente). Reemplazar la línea que extrae `usuarioActual` del store por:

```jsx
// Antes:
// const usuarioActualId = useStore(store, s => s.usuarioActualId);
// const usuarioActual = store.getEquipo().find(m => m.id === usuarioActualId) || store.getEquipo()[0];

// Despues:
const me = useCurrentUser();
const usuarioActual = me ? {
  id: me.username,                // username del JWT = ID estable
  nombre: me.name,
  iniciales: me.name ? me.name.trim().split(/\s+/).map(s => s[0] || '').join('').slice(0,2).toUpperCase() : '??',
  rol: me.role === 'admin' ? 'admin' : 'member',
  color: me.color,
  gmail: me.username,             // username es email
} : null;

if (!usuarioActual) {
  // El guard ya garantizó que hay sesión, esto es solo para el primer render mientras useEffect resuelve
  return <div style={{ padding: 32, color: C.textDim, fontFamily: font }}>Cargando…</div>;
}
```

Donde antes se llamaba `onChangeUsuario(id)` (el dropdown lo invocaba), reemplazar todas las invocaciones por **no-op o eliminar el prop** — ya no se cambia de identidad. (Step 11 limpia el dropdown definitivamente; ahora solo dejamos de invocarlo).

#### - [ ] **Step 8.3: Eliminar `USUARIO_KEY` y la inicialización del store**

Buscar la línea `const USUARIO_KEY = "crux.usuarioActualId";` y borrarla.

En la inicialización del store (probablemente en `makeStore` o en un objeto seed), eliminar el campo `usuarioActualId` y todas las funciones `getUsuarioActual / setUsuarioActual` que lo lean/escriban.

Si existe lectura de `localStorage.getItem(USUARIO_KEY)`, eliminar la línea.

#### - [ ] **Step 8.4: Verificar con Playwright**

```bash
# Server ya levantado
```

Abrir `http://localhost:3000/admin/integrations/communication.html?__preview` y comprobar:

```js
// browser_evaluate
() => {
  const headerText = document.querySelector('header')?.textContent || '';
  return {
    headerText: headerText.slice(0, 200),
    cruxProfile: window.__cruxProfile,
  };
}
```

Esperado: el header sigue mostrando el avatar/nombre (todavía con el dropdown viejo si no se ha tocado), pero el nombre ahora es "Preview Local" (de `window.__cruxProfile`), no uno del EQUIPO_SEED.

Crear una iteración nueva (vía UI o evaluando una llamada al store) y comprobar que su `autorId` es `preview@localhost`, no `u_pedro`.

#### - [ ] **Step 8.5: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
feat(comm): usuarioActual viene del hook useCurrentUser

La identidad se lee de window.__cruxProfile (publicada por el guard)
y se mapea a la forma { id, nombre, iniciales, rol, color, gmail }
que esperan los componentes. Eliminado el getter/setter de
usuarioActualId en el store y la persistencia en localStorage.

El selector visual sigue ahí pero ya no cambia de identidad — se
limpia definitivamente en un commit posterior.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Migrar consumidores de `store.equipo` a `useTeam`

**Files:**
- Modify: `admin/integrations/communication.html`

#### - [ ] **Step 9.1: Identificar consumidores**

```bash
grep -n "store\.getEquipo\|store\.equipo\|equipo:" /mnt/c/codigo/Crux/pan/pan/admin/integrations/communication.html | head -30
```

Lo que esperas encontrar:
- `equipo: EQUIPO_SEED.map(...)` en la semilla del store
- `store.getEquipo()` en varios componentes (Header, VistaEquipo, formularios de iteración con assignee, etc.)
- `store.addMiembro/updateMiembro/deleteMiembro`

#### - [ ] **Step 9.2: Mapear formato `useTeam` → shape esperada por los componentes**

`useTeam()` devuelve `[{ username, name, role, color }]`. Los componentes esperan `{ id, nombre, iniciales, rol, color, gmail }`. Crear un helper inline al lado de los hooks (paso 7.1):

```jsx
function teamToMembers(team) {
  return team.map(m => ({
    id: m.username,
    nombre: m.name,
    iniciales: m.name ? m.name.trim().split(/\s+/).map(s => s[0] || '').join('').slice(0,2).toUpperCase() : '??',
    rol: m.role === 'admin' ? 'admin' : 'member',
    color: m.color,
    gmail: m.username,
  }));
}
```

#### - [ ] **Step 9.3: Reemplazar cada `store.getEquipo()` por `teamToMembers(useTeam())`**

En cada componente que llama a `store.getEquipo()`, sustituir:

```jsx
// Antes:
const equipo = store.getEquipo();

// Despues:
const team = useTeam();
const equipo = teamToMembers(team);
```

Para componentes que reciben `equipo` como prop desde la app raíz, en la raíz se hace:

```jsx
const equipo = teamToMembers(useTeam());
// ...
<Header usuarioActual={usuarioActual} equipo={equipo} ... />
<VistaEquipo store={store} equipo={equipo} ... />
```

Y en VistaEquipo, en vez de `store.getEquipo()`, leer `equipo` del prop.

#### - [ ] **Step 9.4: Quitar `addMiembro / updateMiembro / deleteMiembro` del store**

En el store, eliminar los métodos:
- `addMiembro`
- `updateMiembro`
- `deleteMiembro`

En VistaEquipo y MiembroModal, reemplazar los handlers que los llaman por placeholders que muestran un toast/aviso:

```jsx
// En VistaEquipo, sustituir el handler de "+ Nuevo miembro" y "Editar" por:
const noopGestion = () => {
  alert('La gestión del equipo se hace desde Vercel (env var ADMIN_USERS) en V1. UI dedicada vendrá en V2.');
};
```

(Cleanup completo de la UI de gestión se hace en el siguiente task.)

#### - [ ] **Step 9.5: Verificar**

Reload del dashboard en `?__preview`. Comprobar:
- El header sigue mostrando el usuario actual.
- La vista Equipo (botón Equipo en la toolbar) muestra la lista del equipo desde `/api/auth/team`.
- Al hacer click en "+ Nuevo miembro" o "Editar", aparece el alert con el mensaje placeholder.

#### - [ ] **Step 9.6: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
feat(comm): lista de equipo viene de /api/auth/team via useTeam

teamToMembers normaliza el shape del endpoint al que esperan los
componentes existentes. Se eliminan add/update/deleteMiembro del
store; gestión de equipo se hace en V1 editando ADMIN_USERS en
Vercel (placeholder en la UI hasta tener pantalla dedicada en V2).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Header read-only con "Cerrar sesión"

**Files:**
- Modify: `admin/integrations/communication.html` (componente `Header`, líneas ~906-958)

#### - [ ] **Step 10.1: Reemplazar el menú desplegable del Header**

El Header actual tiene el dropdown con la lista del equipo para cambiar identidad. Reemplazar la sección del menú (líneas ~929-956) por un dropdown de "Cerrar sesión" simple:

```jsx
          <div ref={ref} style={{ position: "relative", justifySelf: "end" }}>
            <button onClick={() => setOpen(o => !o)} style={{
              display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 22, padding: "5px 14px 5px 5px", cursor: "pointer", fontFamily: font,
              fontSize: 12, color: C.textSec,
            }}>
              <Avatar nombre={usuarioActual.nombre} color={usuarioActual.color} size={26} />
              <span>{usuarioActual.nombre} · {usuarioActual.rol}</span>
              <span style={{ color: C.textDim, fontSize: 10 }}>▾</span>
            </button>
            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 6, minWidth: 200, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize: 10, color: C.textDim, padding: "6px 10px", textTransform: "uppercase", letterSpacing: 0.6 }}>Sesión</div>
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                    } catch (_) {}
                    window.location.replace('/admin');
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    background: "transparent", border: "none", padding: "8px 10px",
                    borderRadius: 6, cursor: "pointer",
                    color: C.text, fontSize: 12, fontFamily: font, textAlign: "left",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(217,107,107,0.08)'; e.currentTarget.style.color = C.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
```

#### - [ ] **Step 10.2: Eliminar prop `onChangeUsuario` del Header y de las llamadas**

En la firma de `Header`, quitar `onChangeUsuario` del destructuring. En la app raíz, quitar `onChangeUsuario={...}` de la invocación `<Header ... />`.

#### - [ ] **Step 10.3: Verificar con Playwright**

Reload del dashboard. Click en la cápsula de usuario arriba a la derecha:
- Esperado: aparece un menú con "Sesión" como kicker y un único botón "Cerrar sesión" en rojo al hover.
- Click en "Cerrar sesión" → llamada a `/api/auth/logout` (falla con 405 en `__preview` porque no hay backend, pero el redirect a `/admin` debe ocurrir igualmente).

#### - [ ] **Step 10.4: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
feat(comm): header read-only con cerrar sesion

El dropdown del header pierde la lista de cambio de identidad. Ahora
solo muestra avatar + nombre + rol del usuario logueado, y al hacer
click expone un único botón "Cerrar sesión" que llama a
/api/auth/logout y redirige a /admin.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Limpieza final — eliminar `EQUIPO_SEED` y restos del modelo viejo

**Files:**
- Modify: `admin/integrations/communication.html`

#### - [ ] **Step 11.1: Eliminar `EQUIPO_SEED`**

Buscar la constante `EQUIPO_SEED` (alrededor de la línea 283) y borrar todo el bloque. También quitar el `import`/uso si quedó alguno.

#### - [ ] **Step 11.2: Eliminar el campo `equipo` de la semilla del store**

En la semilla del store (alrededor de la línea 355), eliminar:

```js
equipo: EQUIPO_SEED.map(m => ({ ...m, iniciales: m.iniciales || getInitials(m.nombre) })),
```

Si el store persistía `equipo` a KV (revisar la lógica de serialización), también eliminar referencias.

#### - [ ] **Step 11.3: Convertir `VistaEquipo` y `MiembroModal` a vista read-only**

`VistaEquipo` se mantiene como pantalla informativa. Reemplazar el contenido por una versión sin botones de edición:

```jsx
    function VistaEquipo({ equipo, onVolver }) {
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: -0.5 }}>Equipo</h1>
              <p style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
                {equipo.length} miembros · gestión en Vercel (env var <code style={{ fontFamily: mono, color: C.textSec }}>ADMIN_USERS</code>) hasta V2
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={onVolver}>← Volver</Btn>
            </div>
          </div>

          <Card>
            {equipo.map((m, i) => (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "auto 1.6fr 0.9fr 1.8fr 0.9fr", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: i < equipo.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <Avatar nombre={m.nombre} color={m.color} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{m.nombre}</div>
                  <div style={{ fontSize: 10, color: C.textDim, fontFamily: mono }}>{m.iniciales}</div>
                </div>
                <div style={{ fontSize: 12, color: C.textSec }}>{m.rol}</div>
                <div style={{ fontSize: 12, color: C.textSec, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.gmail ? (
                    <a href={`mailto:${m.gmail}`} title={m.gmail} style={{ color: C.textSec, textDecoration: "none", borderBottom: `1px dashed ${C.border}` }}>{m.gmail}</a>
                  ) : (
                    <span style={{ color: C.textDim, fontFamily: mono, fontSize: 11 }}>—</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: mono }}>{m.color}</div>
              </div>
            ))}
          </Card>
        </div>
      );
    }
```

Eliminar la función `MiembroModal` entera (ya no se invoca).

Donde la app raíz invoca `<VistaEquipo store={s} onVolver={goHome} />`, sustituir por `<VistaEquipo equipo={equipo} onVolver={goHome} />`. (Aprovecha que `equipo` ya está calculado por `teamToMembers(useTeam())` en Step 9.3.)

#### - [ ] **Step 11.4: Verificar con Playwright**

```bash
# Server levantado
```

Abrir `http://localhost:3000/admin/integrations/communication.html?__preview`. Comprobar:

```js
// browser_evaluate
() => {
  // 1) No hay rastros de EQUIPO_SEED en el código (no podemos comprobarlo desde dentro, sólo desde grep)
  // 2) La vista Equipo muestra el equipo de /api/auth/team
  return {
    headerOk: !!document.querySelector('header'),
    cruxProfile: window.__cruxProfile,
  };
}
```

Navegar a la vista Equipo (click en el botón Equipo de la toolbar):
- Debe mostrar la lista del equipo (vacía en `?__preview` porque `/api/auth/team` no responde sin backend — comprobar manualmente con un deploy preview).
- No debe haber botones "Editar" ni "+ Nuevo miembro".

Verificación de eliminación de seed:
```bash
grep -c "EQUIPO_SEED\|USUARIO_KEY\|MiembroModal" /mnt/c/codigo/Crux/pan/pan/admin/integrations/communication.html
# Expected: 0
```

#### - [ ] **Step 11.5: Commit**

```bash
git add admin/integrations/communication.html
git commit -m "$(cat <<'EOF'
chore(comm): elimina EQUIPO_SEED, USUARIO_KEY y MiembroModal

Cierra la migración a identidad desde el servidor. El store ya no
contiene el campo equipo ni usuarioActualId. VistaEquipo queda como
display read-only del equipo (de /api/auth/team). La gestión del
roster se hace en Vercel (ADMIN_USERS) hasta que llegue la pantalla
dedicada en V2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Validación end-to-end en preview deploy

**Files:** (ninguno, solo verificación operacional)

#### - [ ] **Step 12.1: Push de todos los commits anteriores**

```bash
cd /mnt/c/codigo/Crux/pan/pan
git push origin main
```

Vercel arranca redeploy automático.

#### - [ ] **Step 12.2: Preparar `ADMIN_USERS` extendido en Vercel**

(Esto requiere que Pedro/admin tenga acceso al dashboard de Vercel.)

1. En Vercel → Settings → Environment Variables, localizar `ADMIN_USERS`.
2. **Copiar el valor actual** y guardarlo en password manager (1Password / Bitwarden) por si hay que restaurarlo.
3. Generar hashes para los 4 admins:
   ```bash
   cd /mnt/c/codigo/Crux/pan/pan
   node scripts/hash-password.js "<password-pedro>"     # imprime hash
   node scripts/hash-password.js "<password-alvaro>"
   node scripts/hash-password.js "<password-marc>"
   node scripts/hash-password.js "<password-javi>"
   ```
4. Construir el nuevo JSON:
   ```jsonc
   [
     { "u": "pedro@cruxmallorca.es",  "p": "$2b$12$…", "role": "admin", "name": "Pedro Castrillo", "color": "#3869AB", "access": ["*"] },
     { "u": "alvaro@cruxmallorca.es", "p": "$2b$12$…", "role": "admin", "name": "Alvaro <apellido>", "color": "#D4A84A", "access": ["*"] },
     { "u": "marc@cruxmallorca.es",   "p": "$2b$12$…", "role": "admin", "name": "Marc <apellido>",   "color": "#5CB88A", "access": ["*"] },
     { "u": "javi@cruxmallorca.es",   "p": "$2b$12$…", "role": "admin", "name": "Javi <apellido>",   "color": "#D96B6B", "access": ["*"] }
   ]
   ```
5. Pegar como valor de `ADMIN_USERS` para los 3 entornos (Production, Preview, Development).
6. Trigger un redeploy (push vacío o desde la UI de Vercel).

#### - [ ] **Step 12.3: Wipe del estado actual de KV**

Las claves a borrar:
- `crux:dashboard:comm:state`
- `crux:dashboard:comm:state:updatedAt`

Opciones:
- Desde la UI de Vercel KV: Storage → KV → Browse data → seleccionar key → Delete.
- Desde local con CLI:
  ```bash
  # Asumiendo que tienes KV_REST_API_URL y KV_REST_API_TOKEN en tu shell
  curl -X POST "$KV_REST_API_URL/del/crux:dashboard:comm:state" \
       -H "Authorization: Bearer $KV_REST_API_TOKEN"
  curl -X POST "$KV_REST_API_URL/del/crux:dashboard:comm:state:updatedAt" \
       -H "Authorization: Bearer $KV_REST_API_TOKEN"
  # Expected: { "result": 1 } cuando borra, { "result": 0 } si no existía
  ```

#### - [ ] **Step 12.4: Validar en producción**

Para cada uno de los 4 admins (Pedro, Alvaro, Marc, Javi):

1. Abrir https://cruxmallorca.es/admin → login con email + password.
2. Llegar al hub → ver las 2 integraciones live (Financiero, Comunicación) + las 4 "soon".
3. Entrar a Comunicación → header muestra el nombre real (no "preview", no "u_pedro").
4. Crear una iteración nueva → comprobar (vía consola del navegador o en la siguiente sesión) que `autorId` es el email, no `u_pedro`.
5. Hacer logout → redirect a `/admin`.

Comprobación adicional como member sin acceso:
1. Crear temporalmente en `ADMIN_USERS` un usuario `test-member@cruxmallorca.es` con `role: "member"` y `access: ["financial"]`.
2. Loguearse con esa cuenta.
3. Hub: debe mostrar **solo** la card de Financiero, no Comunicación.
4. Si va directamente a `/admin/integrations/communication`, debe redirigir al hub.
5. Llamada directa a `/api/comm-state` con la cookie de ese usuario: 403.
6. Borrar el usuario de prueba.

#### - [ ] **Step 12.5: Cerrar checklist**

Si todo OK, marcar las tareas pendientes en el plan como completadas y notificar a Pedro que la migración está en producción.

Si algo falla:
- Rollback rápido: `git revert <merge-commit-sha>` + push → Vercel redeploya el estado anterior.
- Restaurar el valor antiguo de `ADMIN_USERS` desde el password manager.
- Si el wipe de KV ya se hizo: como los datos eran de prueba (decisión explícita en spec), no hay rollback necesario para KV.

---

## Self-Review

**Spec coverage:**

| Sección de spec | Task que la cubre |
|---|---|
| Modelo de datos (ADMIN_USERS extendido + JWT con access) | Task 1 |
| `/api/auth/me` | Task 2 |
| `/api/auth/team` | Task 3 |
| `/api/comm-state` con guard de acceso | Task 4 |
| `_lib/auth.js` con helpers (`loadProfile`, `hasAccessTo`, `requireIntegrationAccess`) | Task 1 |
| Filtrado del hub por access | Task 5 |
| Guard de comunicación con check de access | Task 6 |
| `useCurrentUser` / `useTeam` | Tasks 7-9 |
| Header read-only con logout | Task 10 |
| Eliminación de `EQUIPO_SEED` / `USUARIO_KEY` | Task 11 |
| Wipe de KV + bootstrap ADMIN_USERS | Task 12 |
| Path de evolución a V2 | (Solo en spec, no requiere implementación) |
| Deuda técnica reconocida | (Solo en spec, no requiere implementación) |

Toda la spec V1 tiene tarea asignada.

**Placeholder scan:** revisado el plan; cada step tiene código completo. No hay "TBD", "ver más arriba", ni referencias circulares. Las cosas que dependen de input operacional (passwords reales, nombres completos de Alvaro/Marc/Javi) están claramente marcadas en Task 12 como "Pedro proporciona".

**Type consistency:**
- `useCurrentUser()` devuelve `{ username, name, role, color, access, isAdmin, expiresAt }` consistente entre Task 6 (guard), Task 7 (hook) y Task 8 (consumidor).
- `useTeam()` devuelve `[{ username, name, role, color }]` consistente entre Task 3 (endpoint) y Task 9 (hook).
- `teamToMembers()` mapea consistentemente al shape `{ id, nombre, iniciales, rol, color, gmail }` que esperan los componentes.
- `requireIntegrationAccess` firma `(req, res, integrationId)` consistente entre Task 1 (definición) y Task 4 (consumo).

Sin inconsistencias detectadas.

---

## Notas operativas

- Trabajamos en `main` (rama de prod). Cada task se commitea en `main` y se pushea inmediatamente o al final del bloque. Sugerencia: push al final de cada task (no de cada step) para tener checkpoints en Vercel preview deploy.
- Si en algún momento el preview deploy queda roto entre tasks (porque la migración es incremental), no es problema crítico porque Vercel solo redepliega `main` para producción. Los preview deploys se crearán por rama, no por commit individual.
- Para tareas que tocan el dashboard de comunicación (Tasks 6-11), considerar trabajar en una rama feature (`feat/dashboard-comm-identity`) y mergear cuando todo esté verde. Si Pedro prefiere seguir en `main` directo (patrón actual del repo), avisar y commitear directamente.
