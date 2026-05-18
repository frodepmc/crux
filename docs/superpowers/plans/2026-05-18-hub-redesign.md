# Rediseño del Hub admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `admin/hub.html` con fondo blanco puro, tipografía display **Manrope 800**, sólo las 2 cards LIVE (drop SOON), detalles en azules CRUX y efecto "flotante" en las cards (sombra azul + hover lift + accent line grow). Spec: `docs/superpowers/specs/2026-05-18-hub-redesign-design.md`.

**Architecture:** Edits localizados sobre 3 archivos estáticos (HTML + CSS + JS). Sin build, sin tests automáticos. Verificación = grep + Playwright con bypass `?__preview`. Cada task = 1 commit.

**Tech Stack:** HTML5 + CSS3 vanilla (admin.css) + JS vanilla (admin.js), tipografías Google Fonts. Python http.server en :3000. Playwright MCP para verificación visual.

**Preview URL:** http://localhost:3000/admin/hub.html?__preview

**Archivos afectados:**
- `admin/hub.html` (Tasks 1, 2, 4)
- `assets/css/admin.css` (Tasks 1, 2, 3, 5, 6)
- `assets/js/admin.js` (Task 4)

No se modifican `integrations.json` ni ninguna otra página admin. La sección "Próximamente" se elimina del UI; los items SOON siguen en `integrations.json` pero el render los filtra fuera.

---

## Task 1: Cargar Manrope + fondo blanco + token de tipografía display

**Files:**
- Modify: `admin/hub.html` (link Google Fonts, ~línea 15)
- Modify: `assets/css/admin.css` (token + bg en `body.adm-hub`, después de los `:root` tokens)

- [ ] **Step 1: Verificar estado actual**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "Manrope\|font-display-hero\|body.adm-hub {" admin/hub.html assets/css/admin.css
```

Expected: ningún match.

- [ ] **Step 2: Añadir Manrope al `<link>` de fuentes**

Edit `admin/hub.html`.

`old_string`:
```
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

`new_string`:
```
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Manrope:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Añadir bg blanco + token `--font-display-hero` en `body.adm-hub`**

Edit `assets/css/admin.css`. Busca el final del bloque `:root` (línea ~36 — termina con `--gutter: clamp(...)`).

`old_string`:
```
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
    --gutter: clamp(1.5rem, 4vw, 4rem);
}
```

`new_string`:
```
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
    --gutter: clamp(1.5rem, 4vw, 4rem);
}

/* Hub-only overrides: fondo blanco puro + tipografía display Manrope */
body.adm-hub {
    --font-display-hero: 'Manrope', 'Inter', 'Helvetica Neue', sans-serif;
    background: #FFFFFF;
}
```

- [ ] **Step 4: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "family=Manrope\|--font-display-hero\|body.adm-hub {" admin/hub.html assets/css/admin.css
```

Expected: 3 matches (1 en hub.html, 2 en admin.css).

- [ ] **Step 5: Smoke check en navegador**

Navega a `http://localhost:3000/admin/hub.html?__preview`. Verifica que el fondo es blanco (no crema) y que no hay errores en consola. El resto se ve igual que antes — los estilos vendrán en tasks siguientes.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/hub.html assets/css/admin.css
git commit -m "$(cat <<'EOF'
feat(admin): cargar Manrope + bg blanco + token display hero

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Hero — drop italic, accent azul en "intervención.", título Manrope 800

**Files:**
- Modify: `admin/hub.html` (`.adm-hub__title`, ~líneas 50-53)
- Modify: `assets/css/admin.css` (regla `.adm-hub__title` ~línea 861, `.adm-hub__title em` ~línea 872)

- [ ] **Step 1: Cambiar `<em>` por `<span class="adm-hub__title-accent">` en el markup**

Edit `admin/hub.html`.

`old_string`:
```
                <h1 class="adm-hub__title">
                    Elige una<br>
                    <em>intervención.</em>
                </h1>
```

`new_string`:
```
                <h1 class="adm-hub__title">
                    Elige una<br>
                    <span class="adm-hub__title-accent">intervención.</span>
                </h1>
```

- [ ] **Step 2: Sustituir las reglas CSS del título por las nuevas**

Edit `assets/css/admin.css`.

`old_string`:
```
.adm-hub__title {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(2.6rem, 6vw, 5rem);
    line-height: 1;
    letter-spacing: -0.035em;
    color: var(--text);
    margin-top: 1rem;
    max-width: 18ch;
}

.adm-hub__title em {
    font-style: italic;
    font-weight: 400;
    color: var(--accent);
}
```

`new_string`:
```
.adm-hub__title {
    font-family: var(--font-display-hero);
    font-weight: 800;
    font-size: clamp(2.8rem, 6vw, 4.8rem);
    line-height: 1.02;
    letter-spacing: -0.025em;
    color: var(--text);
    margin-top: 1rem;
    max-width: 18ch;
}

.adm-hub__title-accent {
    color: var(--accent);
    font-style: normal;
    font-weight: 800;
}
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "adm-hub__title-accent\|adm-hub__title em" admin/hub.html assets/css/admin.css
```

Expected: 2 matches (1 en hub.html, 1 en admin.css). Cero matches para `adm-hub__title em`.

- [ ] **Step 4: Smoke check**

Recarga `http://localhost:3000/admin/hub.html?__preview`. El hero ahora muestra "Elige una intervención." en Manrope heavy, sin italic, con "intervención." en azul CRUX.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/hub.html assets/css/admin.css
git commit -m "$(cat <<'EOF'
feat(admin): hero Manrope 800 con accent azul en 'intervención.'

Drop el italic Jost por display heavy + color CRUX accent.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Sidemeta — quitar la caja, dejar filas mono dim a la derecha

**Files:**
- Modify: `assets/css/admin.css` (`.adm-hub__sidemeta*`, ~líneas 890-919)

- [ ] **Step 1: Refactor de las reglas de sidemeta**

Edit `assets/css/admin.css`.

`old_string`:
```
.adm-hub__sidemeta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    padding: 1.1rem 1.2rem;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.45);
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.15em;
    color: var(--text-muted);
}

.adm-hub__sidemeta-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
}

.adm-hub__sidemeta-row b {
    color: var(--text);
    font-weight: 500;
    letter-spacing: 0.08em;
}

.adm-hub__sidemeta-row--accent b {
    color: var(--accent);
}
```

`new_string`:
```
.adm-hub__sidemeta {
    display: flex;
    flex-direction: column;
    gap: 0;
    align-self: end;
    padding: 0;
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    min-width: 18rem;
}

.adm-hub__sidemeta-row {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
}

.adm-hub__sidemeta-row:last-child {
    border-bottom: none;
}

.adm-hub__sidemeta-row b {
    color: var(--text);
    font-weight: 600;
    letter-spacing: 0.08em;
}

.adm-hub__sidemeta-row--accent b {
    color: var(--accent);
}
```

- [ ] **Step 2: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "rgba(255, 255, 255, 0.45)" assets/css/admin.css
```

Expected: ningún match (la regla con ese background se ha eliminado).

- [ ] **Step 3: Smoke check**

Recarga. La caja a la derecha desaparece, queda una columna con filas label / valor separadas por línea fina. Texto mono dim.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add assets/css/admin.css
git commit -m "$(cat <<'EOF'
feat(admin): sidemeta sin caja — filas mono con separador fino

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: JS — filtrar sólo LIVE + chapter dinámico + markup nuevo de cards

**Files:**
- Modify: `admin/hub.html` (añadir `id="adm-int-chapter"` al `<p class="adm-hub__chapter">`, ~línea 84)
- Modify: `assets/js/admin.js` (`renderIntegrations`, ~líneas 298-347)

- [ ] **Step 1: Añadir id al chapter heading**

Edit `admin/hub.html`.

`old_string`:
```
    <p class="adm-hub__chapter">Integraciones disponibles</p>
```

`new_string`:
```
    <p class="adm-hub__chapter" id="adm-int-chapter">Activas</p>
```

- [ ] **Step 2: Reescribir `renderIntegrations` para filtrar live + chapter dinámico + markup simplificado**

Edit `assets/js/admin.js`.

`old_string`:
```
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
                    <p class="adm-int__desc">${escapeHtml(item.description || '')}</p>
                    <div class="adm-int__meta">${metaBits}</div>
                    <div class="adm-int__cta">${tag} <span aria-hidden="true">→</span></div>
                </${wrapTag}>
            `;
        }).join('');

        grid.innerHTML = html;
    }
```

`new_string`:
```
    function renderIntegrations(list, profile) {
        const grid = document.getElementById('adm-integrations');
        const chapter = document.getElementById('adm-int-chapter');
        if (!grid) return;
        if (!Array.isArray(list) || list.length === 0) {
            grid.innerHTML = '<p class="adm-stage__sub">No hay integraciones registradas todavia.</p>';
            if (chapter) chapter.textContent = 'Sin integraciones';
            return;
        }

        const access = Array.isArray(profile?.access) ? profile.access : [];
        const hasAll = access.includes('*');

        const visible = list.filter((item) => hasAll || access.includes(item.id));
        const liveOnly = visible.filter((item) => item.status === 'live');

        if (liveOnly.length === 0) {
            grid.innerHTML = '<p class="adm-stage__sub">Tu cuenta no tiene integraciones activas. Habla con un admin.</p>';
            if (chapter) chapter.textContent = 'Sin integraciones activas';
            return;
        }

        if (chapter) {
            chapter.textContent = 'Activas · ' + String(liveOnly.length).padStart(2, '0');
        }

        const html = liveOnly.map((item, i) => {
            const num = String(i + 1).padStart(2, '0');
            const glyph = GLYPHS[item.icon] || GLYPHS.layers;
            const metaBits = (item.meta || []).map((m) => `<span>${escapeHtml(m)}</span>`).join('');

            return `
                <a href="${escapeAttr(item.path)}" class="adm-int">
                    <div class="adm-int__head">
                        <span class="adm-int__num">${num}</span>
                        <span class="adm-int__badge adm-int__badge--live">Live</span>
                    </div>
                    <div class="adm-int__glyph" aria-hidden="true">${glyph}</div>
                    <h3 class="adm-int__title">${escapeHtml(item.name)}</h3>
                    <p class="adm-int__desc">${escapeHtml(item.description || '')}</p>
                    <div class="adm-int__meta">${metaBits}</div>
                    <div class="adm-int__cta">Entrar <span aria-hidden="true">→</span></div>
                </a>
            `;
        }).join('');

        grid.innerHTML = html;
    }
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "liveOnly\|adm-int-chapter\|is-soon\|Proximamente" admin/hub.html assets/js/admin.js
```

Expected:
- `liveOnly` aparece en admin.js (2 matches).
- `adm-int-chapter` en hub.html (1) y admin.js (2).
- `is-soon` y `Proximamente` no aparecen.

- [ ] **Step 4: Smoke check**

Recarga. Sólo aparecen Dashboard financiero + Dashboard comunicación. Las 4 cards SOON ya no se renderizan. El heading dice "Activas · 02".

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/hub.html assets/js/admin.js
git commit -m "$(cat <<'EOF'
feat(admin): hub renderiza sólo integraciones LIVE

Drop las cards 'Soon' del UI. Chapter heading dinámico con contador
(p.ej. 'Activas · 02'). integrations.json se mantiene intacto.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Card visual base — grid 2 columnas + blanco + sombra azul

**Files:**
- Modify: `assets/css/admin.css` (`.adm-integrations` grid + `.adm-int` base, ~líneas 954-998)

- [ ] **Step 1: Cambiar el grid de auto-fill a 2 columnas fijas**

Edit `assets/css/admin.css`.

`old_string`:
```
.adm-integrations {
    padding: 0 var(--gutter) clamp(4rem, 9vh, 8rem);
    max-width: 1500px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: clamp(1rem, 1.8vw, 1.8rem);
}
```

`new_string`:
```
.adm-integrations {
    padding: 0 var(--gutter) clamp(4rem, 9vh, 8rem);
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1.2rem, 2vw, 2rem);
}

@media (max-width: 720px) {
    .adm-integrations {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 2: Sustituir el visual base de `.adm-int` (background, border, transition, hover)**

`old_string`:
```
.adm-int {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: clamp(1.6rem, 2.4vw, 2.2rem);
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.55);
    color: var(--text);
    text-decoration: none;
    transition: transform 0.45s var(--ease-out), border-color 0.3s ease, box-shadow 0.4s ease, background 0.3s ease;
    overflow: hidden;
    min-height: 22rem;
}

.adm-int::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 90px;
    height: 1px;
    background: var(--accent);
    transition: width 0.5s var(--ease-out);
}

.adm-int:hover {
    transform: translateY(-4px);
    border-color: rgba(56, 105, 171, 0.35);
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 28px 60px rgba(30, 58, 95, 0.08);
}

.adm-int:hover::before {
    width: 140px;
}
```

`new_string`:
```
.adm-int {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: clamp(1.8rem, 2.6vw, 2.4rem);
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #FFFFFF;
    color: var(--text);
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(56, 105, 171, 0.06);
    transition: transform 0.5s var(--ease-out),
                border-color 0.3s ease,
                box-shadow 0.5s var(--ease-out);
    overflow: hidden;
    min-height: 24rem;
    will-change: transform;
}

.adm-int::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 90px;
    height: 2px;
    background: var(--accent);
    transition: width 0.5s var(--ease-out);
}

.adm-int:hover {
    transform: translateY(-8px);
    border-color: rgba(56, 105, 171, 0.28);
    box-shadow: 0 24px 60px rgba(56, 105, 171, 0.12),
                0 4px 12px rgba(56, 105, 171, 0.08);
}

.adm-int:hover::before {
    width: 160px;
}
```

- [ ] **Step 3: Eliminar las reglas obsoletas de `.is-soon`**

`old_string`:
```
/* Disabled / "soon" state */
.adm-int.is-soon {
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.28);
    color: var(--text-muted);
}

.adm-int.is-soon::before {
    background: var(--text-muted);
    opacity: 0.4;
}

.adm-int.is-soon:hover {
    transform: none;
    border-color: var(--border);
    box-shadow: none;
    background: rgba(255, 255, 255, 0.32);
}
```

`new_string`:
```
```

(Se borra el bloque entero — `.is-soon` ya no existe en el DOM.)

- [ ] **Step 4: Eliminar `.adm-int.is-soon .adm-int__glyph` y `.adm-int.is-soon .adm-int__title`**

`old_string`:
```
.adm-int.is-soon .adm-int__glyph {
    color: var(--text-muted);
    background: rgba(0, 0, 0, 0.02);
}

.adm-int__title {
```

`new_string`:
```
.adm-int__title {
```

`old_string`:
```
.adm-int.is-soon .adm-int__title {
    color: var(--text-muted);
}

.adm-int__desc {
```

`new_string`:
```
.adm-int__desc {
```

`old_string`:
```
.adm-int.is-soon .adm-int__cta {
    color: var(--text-muted);
}

.adm-int__cta-arrow {
```

`new_string`:
```
.adm-int__cta-arrow {
```

`old_string`:
```
.adm-int__badge--soon {
    color: var(--accent);
    border-color: rgba(56, 105, 171, 0.3);
    background: rgba(56, 105, 171, 0.05);
}

.adm-int__glyph {
```

`new_string`:
```
.adm-int__glyph {
```

- [ ] **Step 5: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "is-soon\|badge--soon" assets/css/admin.css
```

Expected: ningún match.

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -c "rgba(56, 105, 171" assets/css/admin.css
```

Expected: 4+ matches (las nuevas sombras + accents existentes).

- [ ] **Step 6: Smoke check**

Recarga. Las cards LIVE ahora están en 2 columnas grandes, fondo blanco puro, con sombra azul sutil. En hover suben 8px, sombra crece, accent line top crece. CTA arrow se desplaza (esto último ya estaba implementado en `.adm-int__cta-arrow`).

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add assets/css/admin.css
git commit -m "$(cat <<'EOF'
feat(admin): cards en 2 columnas blancas con sombra azul CRUX

- Grid de auto-fill a 2 cols fijas (1 en mobile <720).
- Card opaca blanca con sombra azulada que sugiere flotar.
- Hover: lift 8px + sombra crece + accent line 90 → 160px.
- Drop reglas obsoletas de .is-soon (nadie las usa ya).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Número de la card en Manrope display + badge LIVE refinado

**Files:**
- Modify: `assets/css/admin.css` (`.adm-int__num` ~línea 1027, `.adm-int__badge--live` ~línea 1051)

- [ ] **Step 1: Sustituir el estilo del número por display heavy**

Edit `assets/css/admin.css`.

`old_string`:
```
.adm-int__num {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--text-muted);
}
```

`new_string`:
```
.adm-int__num {
    font-family: var(--font-display-hero);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-muted);
    line-height: 1;
}
```

- [ ] **Step 2: Refinar el badge LIVE a colores CRUX (en vez del verde success)**

`old_string`:
```
.adm-int__badge--live {
    color: var(--success);
    border-color: rgba(46, 125, 50, 0.35);
    background: rgba(46, 125, 50, 0.07);
}

.adm-int__badge--live::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.18);
    animation: pulseDot 2.4s ease-in-out infinite;
}
```

`new_string`:
```
.adm-int__badge--live {
    color: var(--accent);
    border-color: rgba(56, 105, 171, 0.32);
    background: rgba(56, 105, 171, 0.06);
}

.adm-int__badge--live::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 3px rgba(56, 105, 171, 0.18);
    animation: pulseDot 2.4s ease-in-out infinite;
}
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "var(--font-display-hero)" assets/css/admin.css
```

Expected: 3 matches (`.adm-hub__title`, `.adm-hub__title-accent`, `.adm-int__num`).

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "var(--success)" assets/css/admin.css
```

Expected: el `var(--success)` ya no debería aparecer dentro de `.adm-int__badge--live` (puede seguir en otros sitios — eso es OK).

- [ ] **Step 4: Smoke check**

Recarga. Cada card muestra "01" / "02" en Manrope heavy grande arriba a la izquierda, junto al badge LIVE en azul CRUX con dot pulsante.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add assets/css/admin.css
git commit -m "$(cat <<'EOF'
feat(admin): número de card en Manrope 800 + badge LIVE en azul CRUX

Drop el verde 'success' del badge LIVE — el live ahora es CRUX-blue,
coherente con la paleta del hub.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Verificación visual final

Smoke test completo del hub rediseñado. Si algo falla, corregir antes de cerrar.

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Recargar el preview**

Navega en Playwright a `http://localhost:3000/admin/hub.html?__preview`. Espera carga. Sin errores en consola.

- [ ] **Step 2: Screenshot full-page del estado final**

Toma `browser_take_screenshot` con `fullPage: true`. Comprueba:
- Fondo blanco puro.
- Topbar igual que antes (sin cambios deseados).
- Hero "Elige una intervención." con "intervención." en azul CRUX, Manrope 800, sin italic.
- Sidemeta a la derecha con filas separadas por línea fina, sin caja.
- Chapter "Activas · 02".
- Dos cards en una sola fila (financial + comunicación), blanco puro, sombra azul suave.
- Cada card: número grande "01" / "02" en Manrope heavy, badge LIVE azul con dot pulsando.
- No hay cards SOON visibles.

- [ ] **Step 3: Smoke test de hover**

Hover sobre la primera card vía `browser_evaluate`:

```js
() => {
  const card = document.querySelector('.adm-int');
  if (!card) return 'no card';
  card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  return 'hover triggered';
}
```

Espera 500 ms (la transición). Screenshot. Verifica:
- La card está 8 px más arriba.
- La sombra azul está más extendida.
- La accent line del top mide ~160 px (vs los 90 px del idle).
- La flecha del CTA se ha desplazado a la derecha.

- [ ] **Step 4: Smoke test mobile**

Resize a 480 × 800 via `browser_resize`. Screenshot. Verifica:
- Una sola columna.
- Cards apiladas verticalmente.
- Topbar y hero responsivos.

Restore: `browser_resize` a 1440 × 900.

- [ ] **Step 5: Confirmar que no quedan referencias residuales a `.is-soon`**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -rn "is-soon\|Proximamente\|badge--soon" admin/ assets/css/admin.css assets/js/admin.js
```

Expected: ningún match.

- [ ] **Step 6: Si algún detalle visual falla**

- **Manrope no carga** → revisar el `<link>` de Google Fonts.
- **Hero sigue en italic** → comprobar que el `<em>` se sustituyó por el span.
- **Cards no flotan** → revisar la `box-shadow` y `transition` en `.adm-int`.
- **SOON sigue apareciendo** → revisar el `liveOnly` filter en `renderIntegrations`.

Cualquier corrección se commitea como `fix(admin): ...` por encima de los commits del plan, sin re-escribir history.
