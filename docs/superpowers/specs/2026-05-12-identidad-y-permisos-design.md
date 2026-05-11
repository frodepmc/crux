# Identidad y permisos del equipo — Spec V1

**Fecha**: 2026-05-12
**Autor**: Pedro Castrillo (brainstorm con Claude)
**Estado**: Borrador para revisión

## Contexto

El panel admin de CRUX (`/admin`) ya tiene login por email + contraseña con cookie httpOnly (JWT HS256, 7 días) y un endpoint `/api/auth/verify`. Sin embargo, el dashboard de comunicación (`/admin/integrations/communication.html`) ignora esta identidad: usa un `EQUIPO_SEED` hardcoded con cuatro usuarios ficticios (Pedro, Calum, Carlos, Técnico) y un selector localStorage que permite cambiar de identidad sin verificar nada. Las iteraciones se atribuyen a un `autorId` local (`u_pedro`, `u_calum`, etc.) desconectado del JWT.

Esta spec conecta la identidad de login con el modelo de equipo del dashboard, y establece el patrón para que toda integración futura (financiero, cultura, etc.) reutilice la misma identidad sin reinventar.

## Objetivos

1. **Atribución real**: cuando Pedro está logueado y crea una iteración, queda atribuida a Pedro porque el cookie lo dice, no porque la UI lo permita elegir.
2. **Control de acceso por integración**: los admins controlan qué miembros entran a qué herramientas; dentro de cada herramienta accesible, todos los miembros pueden hacer lo mismo.
3. **Patrón reusable**: identidad y permisos viven en una sola fuente y se consumen de forma uniforme desde cualquier herramienta del panel.
4. **Bootstrap limpio**: arrancamos con cuatro admins reales (Pedro, Alvaro, Marc, Javi) y wipeamos los datos de prueba existentes.

## No objetivos (V1)

- Página de gestión de equipo en la UI (`/admin/team`) — se hace manual en Vercel para V1.
- Permisos granulares dentro de cada herramienta — V1 es "tienes acceso a la integración o no".
- Auditoría / logs de acciones — `session.sub` se loguea pero no se persiste.
- SSO / Google login — V1 sigue con email + password.

## Modelo de datos

El env var existente `ADMIN_USERS` se extiende con campos de perfil y acceso. Sigue siendo un array JSON en una variable de entorno de Vercel.

```jsonc
[
  {
    "u": "pedro@cruxmallorca.es",   // email = username de login, identificador único
    "p": "$2b$10$...",              // bcrypt hash de la contraseña (≥10 rounds)
    "role": "admin",                // "admin" | "member"
    "name": "Pedro Castrillo",      // nombre visible en la UI
    "color": "#3869AB",             // color del avatar (hex)
    "access": ["*"]                 // ids de integraciones permitidas, o ["*"] para todas
  }
]
```

**Reglas**:
- `u` (email) es el identificador único. Reemplaza los IDs locales (`u_pedro` → `pedro@cruxmallorca.es`) en todas las referencias de atribución (`autorId`, `responsable`, asignados, etc.).
- `role` solo dos valores en V1: `admin` o `member`. La diferencia operativa es exclusivamente "puede gestionar accesos del equipo": no hay capacidades extra dentro de las integraciones.
- `access` es una lista de identificadores de integraciones. Identificadores conocidos: `"communication"`, `"financial"`. El comodín `"*"` significa "todas las integraciones presentes y futuras".
- Convención: admins llevan `["*"]`. Members llevan una lista explícita.

**El JWT crece con un claim `access`**: el payload pasa de `{ sub, role, exp }` a `{ sub, role, access, exp }`. Los campos cosméticos (`name`, `color`) **no** van en el JWT — se obtienen vía `/api/auth/me` cuando el cliente lo pide. La razón de meter `access` en el JWT y no `name`/`color`: `access` se chequea en cada request del backend (guards), y no queremos pegarle a la env var en cada llamada; `name`/`color` solo se usan en la UI, donde un único fetch al cargar la app basta.

## APIs

### Endpoints nuevos

**`GET /api/auth/me`** — perfil del usuario actual

Requiere cookie de sesión válida. Responde con el perfil completo (sin password hash).

```jsonc
// 200 OK
{
  "username": "pedro@cruxmallorca.es",
  "name": "Pedro Castrillo",
  "role": "admin",
  "color": "#3869AB",
  "access": ["*"],
  "isAdmin": true,                       // helper: role === "admin"
  "expiresAt": "2026-05-19T10:23:45.000Z"
}

// 401 Unauthorized si no hay sesión
{ "error": "Unauthorized" }
```

**`GET /api/auth/team`** — lista pública del equipo

Requiere cookie de sesión válida (cualquier miembro logueado, no solo admins). Devuelve la lista completa sin información sensible.

```jsonc
// 200 OK
{
  "team": [
    { "username": "pedro@cruxmallorca.es", "name": "Pedro Castrillo", "role": "admin", "color": "#3869AB" },
    { "username": "alvaro@cruxmallorca.es", "name": "Alvaro …",       "role": "admin", "color": "#D4A84A" },
    ...
  ]
}
```

Sin `p` (hash) ni `access` (información de permisos, no se expone).

### Endpoints existentes — cambios

**`/api/comm-state`** (existente): añadir guard de acceso a la integración.

Antes de servir/escribir, verifica que `session.access` incluye `"communication"` o `"*"`. Si no, responde `403 Forbidden`. El check de sesión válida (`401`) se mantiene.

**`/api/auth/verify`** (existente): sin cambios. Sigue devolviendo `{ user: { username, role }, expiresAt }`. Lo enriquecemos en `/api/auth/me`, no aquí, para no romper consumidores actuales.

### Helpers en `_lib/auth.js`

Añadimos dos helpers reutilizables:

```js
// Carga el perfil completo del usuario (lookup en ADMIN_USERS, sin password)
function loadProfile(username) { ... }

// Verifica que la sesión tiene acceso a una integración dada
function hasAccessTo(session, integrationId) {
  const access = session.access || [];
  return access.includes('*') || access.includes(integrationId);
}

// Guard que responde 403 si no tiene acceso
function requireIntegrationAccess(req, res, integrationId) { ... }
```

`session.access` se añade al payload del JWT en el momento del login (`signSession`). Así no hay que hacer lookup en cada request — los permisos viajan en la cookie. **Trade-off**: si un admin revoca el acceso de un member, el cambio no surte efecto hasta que el cookie expira (max 7 días) o el usuario hace logout/login. Es aceptable para V1 dado el tamaño del equipo; se documenta como deuda.

## Frontend

### Cambios en `communication.html`

**Sale**:
- Array `EQUIPO_SEED` (4 usuarios hardcoded).
- Constante `USUARIO_KEY` y toda la lógica de leer/escribir `usuarioActualId` en localStorage.
- Menú desplegable que permite cambiar de identidad desde el header.
- Función "reset al seed" (ya no existe seed; el equipo viene del backend).

**Entra**:
- Hook `useCurrentUser()` que en el mount hace `fetch('/api/auth/me')` y expone `{ username, name, role, color, isAdmin, access }`.
- Hook `useTeam()` que hace `fetch('/api/auth/team')` con caché en memoria. Lo usan los componentes que listan miembros (asignar iteraciones, mostrar avatares, etc.).
- El selector del header se vuelve read-only: avatar + nombre + rol. Click abre un menú con única opción "Cerrar sesión" (POST a `/api/auth/logout` → redirect a `/admin`).
- El `usuarioActual` de los componentes hijos pasa a venir del hook, no del store local.

**No cambia**:
- Estética / layout — solo lógica de identidad.
- El resto del dashboard (clientes, proyectos, iteraciones, Gantt) — sigue igual.

### Cambios en `hub.html`

El hub lista las integraciones disponibles. Lo filtramos por `session.access`:

- Members con `access: ["communication"]` ven solo la card de Comunicación.
- Admins (con `["*"]`) ven todas.

Implementación: el script del hub llama a `/api/auth/me` (o usa `useCurrentUser()`) y filtra la lista renderizada según `access`. Si una integración futura aparece, se añade al hub y automáticamente solo la ven quienes la tengan en su `access`.

### Guard de acceso por integración

Cada HTML de integración (`communication.html`, `financial.html`, futuras) tiene un script al inicio del `<head>` que oculta el body hasta verificar sesión. Se extiende para verificar también acceso a la integración:

```js
fetch('/api/auth/me', { credentials: 'same-origin' })
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(profile => {
    const hasAccess = profile.access.includes('*') || profile.access.includes('communication');
    if (!hasAccess) {
      window.location.replace('/admin/hub');
      return;
    }
    reveal();
  })
  .catch(() => window.location.replace('/admin'));
```

Cada integración cambia solo el `'communication'` por su id (`'financial'`, etc.).

### Patrón para futuras herramientas

Toda integración nueva en `/admin/integrations/*` debe:

1. **Guard de sesión + acceso** en el `<head>` (copy/paste del bloque de arriba).
2. **Llamar a `useCurrentUser()`** al montar React, para conocer identidad.
3. **Llamar a `useTeam()`** solo si necesita listar/asignar a otros.
4. **Atribuir cualquier acción** al `username` de `useCurrentUser`, nunca a un ID local ni a un input del usuario.
5. **Backend**: el endpoint correspondiente añade `requireIntegrationAccess(req, res, '<id>')` antes de procesar.

Los hooks viven inline en cada HTML (consistente con el patrón actual single-file + React via CDN). No introducimos build step ni módulos compartidos en V1.

## Reglas de permisos

**Admin (Pedro, Alvaro, Marc, Javi)**
- Gestiona el catálogo de accesos (campo `access` de cada miembro). En V1, editando `ADMIN_USERS` en Vercel.
- Da de alta / baja miembros, cambia roles.
- Dentro de cada integración: como cualquier miembro, sin capacidades extra.

**Member**
- Ve en `/admin/hub` solo las integraciones de su `access`.
- Si intenta acceder a una integración fuera de su lista (por URL directa) → redirect al hub.
- Dentro de cada integración a la que tiene acceso: todo (crear, editar, publicar, archivar, borrar).

**Aplicación**
- Cliente: filtrado del hub por `access`. Guard por integración bloquea entrada directa.
- Backend: `requireIntegrationAccess` rechaza con 403 cualquier llamada sin acceso. Defensa en profundidad por si el cliente se hackea.

## Bootstrap y migración

### Wipe del estado actual

Las claves de KV a borrar:
- `crux:dashboard:comm:state`
- `crux:dashboard:comm:state:updatedAt`

Se hace **una vez el código nuevo está en main y desplegado**, no antes. Ejecución sugerida: comando one-shot desde local con las env vars de prod cargadas, o desde la UI de Vercel KV.

### Generación de hashes para los 4 admins

Script local `scripts/hash-password.js`:

```js
// node scripts/hash-password.js <password>
const bcrypt = require('bcryptjs');
const pwd = process.argv[2];
if (!pwd) { console.error('Usage: node scripts/hash-password.js <password>'); process.exit(1); }
console.log(bcrypt.hashSync(pwd, 10));
```

Pedro decide los passwords (o los genero yo con un comando aleatorio fuerte y se los pasa a cada admin por canal seguro). Cada password se hashea una vez con el script y el hash va al JSON de `ADMIN_USERS`.

### Construcción del `ADMIN_USERS` inicial

```jsonc
[
  { "u": "pedro@…",  "p": "$2b$10$…", "role": "admin", "name": "Pedro Castrillo", "color": "#3869AB", "access": ["*"] },
  { "u": "alvaro@…", "p": "$2b$10$…", "role": "admin", "name": "Alvaro …",        "color": "#D4A84A", "access": ["*"] },
  { "u": "marc@…",   "p": "$2b$10$…", "role": "admin", "name": "Marc …",          "color": "#5CB88A", "access": ["*"] },
  { "u": "javi@…",   "p": "$2b$10$…", "role": "admin", "name": "Javi …",          "color": "#D96B6B", "access": ["*"] }
]
```

Pegado como valor del env var `ADMIN_USERS` en Vercel para **Production + Preview + Development**. Antes de pisar el valor existente, se guarda copia en un password manager (1Password / Bitwarden) o archivo cifrado local, por si hace falta restaurarlo.

### Validación post-deploy

1. Pedro abre `/admin`, hace login con su email — debería ver el hub con todas las integraciones.
2. Pedro entra al dashboard de comunicación — el header muestra "Pedro Castrillo · admin", sin opción de cambiar identidad.
3. Pedro crea una iteración nueva — `autorId` queda como `pedro@…`, no `u_pedro`.
4. Cada uno de los otros 3 admins repite los pasos 1-3 desde su cuenta.
5. (Opcional) crear un member de prueba con `access: ["communication"]` y confirmar que no ve "Financiero" en el hub.

## Rollback

Si algo falla en producción:
1. Git revert del commit de merge → redeploy automático de Vercel devuelve el código al estado anterior.
2. Si el problema es el env var: restaurar `ADMIN_USERS` desde la copia guardada antes de pisarlo.
3. Si el wipe de KV ya se hizo y no se quiere perder el estado: KV no tiene undo, pero como los datos eran de prueba (decisión explícita) no hay rollback necesario.

## Path de evolución a V2

Disparadores y soluciones, en orden esperado:

1. **Onboarding sin Vercel** (cuando se invite a miembros frecuentemente): mover roster a KV (`crux:team:roster`). `ADMIN_USERS` queda solo como semilla. Página `/admin/team` con CRUD del equipo.
2. **Autoservicio de perfil** (cuando alguien quiera editar su color/foto/nombre): misma migración anterior + pestaña "Mi perfil".
3. **Auditoría**: log inmutable en KV `crux:audit:log` con `{ when, who, action, target }` para cada save de cualquier integración.
4. **Permisos granulares dentro de una herramienta** (si aparece un caso real "solo admin puede borrar X"): mover lógica a backend con `requireAdmin` en endpoints sensibles.
5. **SSO / Google login** (cuando el equipo crezca a 10+): reemplazar login propio por OAuth Google con dominio restringido a `@cruxmallorca.es`. La cookie JWT y el resto del sistema no cambian.

Ninguna migración obliga a rehacer V1: la forma de los datos (`name`, `role`, `color`, `access`) se mantiene.

## Deuda técnica reconocida

- **Revocación de acceso tarda hasta 7 días en aplicarse**: como `session.access` viaja en el JWT, un cambio en `ADMIN_USERS` no surte efecto hasta que el cookie expira o el usuario hace logout/login. Mitigación V2: leer `access` en cada request (lookup contra el roster) en lugar de en el JWT.
- **No hay validación server-side fina de acciones**: el state se guarda como blob entero. Un member podría enviar un POST con cambios de "tipo admin" si conoce la forma del state. Aceptable mientras el equipo sean los 4 admins confiables. Mitigación: cuando entre el primer member real, mover validación de acciones al backend.
- **Sin auditoría persistida**: `session.sub` se loguea por save pero no se almacena. Sin trazabilidad de "quién cambió qué".

## Cambios en archivos

- **Modificar**:
  - `api/_lib/auth.js` (añadir `loadProfile`, `hasAccessTo`, `requireIntegrationAccess`, incluir `access` en JWT payload)
  - `api/comm-state.js` (añadir `requireIntegrationAccess` para `"communication"`)
  - `admin/hub.html` (filtrar lista de integraciones por `session.access`)
  - `admin/integrations/communication.html` (eliminar `EQUIPO_SEED`/`USUARIO_KEY`, añadir `useCurrentUser`/`useTeam`, selector read-only, guard de acceso, atribución vía `username` real)
- **Crear**:
  - `api/auth/me.js`
  - `api/auth/team.js`
  - `scripts/hash-password.js`
- **Operaciones (no código)**:
  - Wipe de claves KV `crux:dashboard:comm:state*`
  - Edición del env var `ADMIN_USERS` en Vercel (con los 4 admins reales + hashes)
