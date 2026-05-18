# Rediseño del Hub admin — diseño

**Fecha:** 2026-05-18
**Archivos objetivo:** `admin/hub.html`, `assets/css/admin.css`, `assets/js/admin.js`, `admin/integrations.json` (sin cambios estructurales — sólo se filtra `status === "live"`).

---

## 1. Contexto

`admin/hub.html` lista las herramientas internas del panel (dashboard financiero, dashboard comunicación, etc.). Actualmente:
- 6 cards renderizadas desde `integrations.json` (2 live, 4 soon).
- Fondo crema `#F2EFE9`, headline con italic Jost.
- Estética "editorial light" correcta pero plana — sin diferenciación clara entre activas y pendientes; estética desconectada del resto de la identidad CRUX (azul) y demasiado neutra para inspirar tracción.

Pedro quiere: **blanco puro, sólo las activas, tipografía con volumen profesional (no italic), cards que se sientan "flotantes", detalles en los azules CRUX**.

## 2. Alcance

### Dentro de alcance
- Reemplazar el fondo `var(--bg)` (crema) por blanco puro `#FFFFFF` en `body.adm-hub` (no afecta otras páginas admin).
- Cargar `Manrope` (300–800) desde Google Fonts y añadir nuevo token CSS `--font-display-hero`.
- Refactor del hero: drop italic, "intervención." en `var(--accent)`.
- Refactor de la sidemeta: filas label-valor sin caja, alineadas a la derecha.
- Eliminar la sección "Próximamente": `renderIntegrations()` filtra por `status === "live"` antes de pintar; cambiar el `chapter` heading de "Integraciones disponibles" → "Activas · 02" (contador dinámico).
- Rediseñar la card `.adm-int` (live): blanco con sombra azulada, animación de hover refinada, accent line crece, CTA arrow se desplaza.
- Variable continuous-idle "float" muy sutil (±1 px, 6 s ease-in-out, infinita) — opcional, fácil de quitar.

### Fuera de alcance
- Topbar (`.adm-topbar`): sin cambios.
- Footer (`.adm-footer`): sin cambios.
- Página de login (`admin/index.html`): sin cambios. Sigue con cream bg.
- Borrar las integraciones `soon` de `integrations.json` — se mantienen en data, sólo se filtran en render para no perder la posibilidad de activarlas en el futuro.
- Otras admin pages distintas a `hub.html`: sin cambios.
- Mobile-first redesign — se mantiene el sistema responsive existente; sólo se actualizan los breakpoints relevantes para el grid de 2 columnas.

## 3. Tipografía

Añadir Manrope al `<link>` de fuentes en `hub.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Manrope:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Nuevo token CSS dentro de `body.adm-hub` (scoped — no afecta otras admin pages):

```css
body.adm-hub {
    --font-display-hero: 'Manrope', 'Inter', 'Helvetica Neue', sans-serif;
}
```

Reglas de uso:
- `.adm-hub__title` (el "Elige una intervención.") → `var(--font-display-hero)`, weight 800.
- `.adm-int__title` (título de cada card) → `var(--font-display-hero)`, weight 700.
- Todo lo demás: sigue con Jost / JetBrains Mono.
- **Drop `<em>` y `font-style: italic`** en `.adm-hub__title em` — se reemplaza por color accent.

## 4. Fondo y color

```css
body.adm-hub {
    background: #FFFFFF;
}
```

El resto de tokens (`--accent`, `--border`, etc.) no se cambian — sólo se aplican con más intención.

### Acentos CRUX
- Accent line top de las cards: `var(--accent)` `#3869AB`.
- Hover de la card: lift + sombra `0 24px 60px rgba(56, 105, 171, 0.12)` (CRUX blue diluido al 12%).
- Idle de la card: sombra ambient suave `0 8px 24px rgba(56, 105, 171, 0.06)`.
- Palabra accent del hero ("intervención."): `var(--accent)`.
- Badge LIVE: pill blanco con borde `var(--accent)` y dot `var(--accent)`.
- CTA "ENTRAR →": texto `var(--accent)`, arrow `var(--accent)`.

## 5. Hero

### 5.1. Markup

Reemplazar el actual:

```html
<h1 class="adm-hub__title">
    Elige una<br>
    <em>intervención.</em>
</h1>
```

por:

```html
<h1 class="adm-hub__title">
    Elige una<br>
    <span class="adm-hub__title-accent">intervención.</span>
</h1>
```

### 5.2. Estilos

```css
.adm-hub__title {
    font-family: var(--font-display-hero);
    font-weight: 800;
    font-size: clamp(2.8rem, 6vw, 4.8rem);
    line-height: 1.02;
    letter-spacing: -0.025em;
    color: var(--text);
}

.adm-hub__title-accent {
    color: var(--accent);
    font-style: normal;
}
```

(Quitar todas las reglas previas que pongan `font-style: italic` sobre el title.)

## 6. Sidemeta

### 6.1. Markup (sin cambios estructurales)

El `<aside class="adm-hub__sidemeta">` se mantiene igual. Sólo cambian estilos.

### 6.2. Estilos

```css
.adm-hub__sidemeta {
    background: transparent;
    border: none;
    padding: 0;
    align-self: end;
}

.adm-hub__sidemeta-row {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.35rem 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
}

.adm-hub__sidemeta-row:last-child { border-bottom: none; }

.adm-hub__sidemeta-row b {
    color: var(--text);
    font-weight: 600;
}

.adm-hub__sidemeta-row--accent b {
    color: var(--accent);
}
```

(Quitar background, padding y borders gruesos que tenga ahora la caja.)

## 7. Sección "Activas"

### 7.1. Chapter heading

Cambiar el texto fijo del heading por uno computado en JS:

```html
<p class="adm-hub__chapter" id="adm-int-chapter">Activas</p>
```

Y `renderIntegrations` actualiza `textContent` con `'Activas · ' + count.toString().padStart(2, '0')`. Ejemplo: `Activas · 02`.

Si `count === 0`, el chapter muestra `Sin integraciones activas` y se oculta el grid.

### 7.2. Estilos

El `.adm-hub__chapter` actual se mantiene visualmente (mono uppercase con línea izquierda). Sólo se actualiza el texto dinámicamente.

## 8. Grid de cards (sólo LIVE)

### 8.1. Layout

```css
.adm-integrations {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1.2rem, 2vw, 2rem);
    max-width: 1100px;
}

@media (max-width: 720px) {
    .adm-integrations {
        grid-template-columns: 1fr;
    }
}
```

Drop el `repeat(auto-fill, minmax(320px, 1fr))` actual. Fijo 2 cols en desktop, 1 en mobile.

### 8.2. Card visual

```css
.adm-int {
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(56, 105, 171, 0.06);
    transform: translateY(0);
    transition: transform 0.5s var(--ease-out),
                box-shadow 0.5s var(--ease-out),
                border-color 0.3s ease;
    will-change: transform;
}

.adm-int::before {
    /* accent line top — ya existe; ajustar grow distance */
    width: 90px;
    transition: width 0.5s var(--ease-out);
}

.adm-int:hover {
    transform: translateY(-8px);
    border-color: rgba(56, 105, 171, 0.25);
    box-shadow: 0 24px 60px rgba(56, 105, 171, 0.12),
                0 4px 12px rgba(56, 105, 171, 0.08);
}

.adm-int:hover::before {
    width: 160px;
}
```

Drop las reglas viejas que pintaban `rgba(255, 255, 255, 0.55)` y `rgba(255, 255, 255, 0.78)`. Ahora la card es opaca pura.

### 8.3. CTA "ENTRAR →"

```css
.adm-int__cta {
    color: var(--accent);
    font-family: var(--font-mono);
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 0.7rem;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
}

.adm-int__cta span {
    transition: transform 0.4s var(--ease-out);
}

.adm-int:hover .adm-int__cta span {
    transform: translateX(6px);
}
```

### 8.4. Animación idle (opcional, conmutable)

Animación de "respiración" muy sutil — ±1 px en 6 s — que se interrumpe en hover.

```css
@keyframes adm-int-breathe {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-1.5px); }
}

@media (prefers-reduced-motion: no-preference) {
    .adm-int {
        animation: adm-int-breathe 6s ease-in-out infinite;
    }
    .adm-int:hover {
        animation: none;
        /* transform: translateY(-8px) ya viene del :hover, no se pisa con la animación */
    }
}
```

> Si en revisión visual Pedro la encuentra distraída, basta con borrar el bloque `@media (prefers-reduced-motion: no-preference)` — el resto del diseño se sostiene sin la animación idle.

### 8.5. Numeración

El número actual `· 01 ·` mono small es discreto. Se sube el peso y tamaño para que sea protagonista:

```css
.adm-int__num {
    font-family: var(--font-display-hero);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-muted);
}
```

El render JS pasa de `· ${num} ·` (con puntos) a sólo `${num}` (e.g. `02`).

## 9. JS (admin.js)

### 9.1. Filtrar SOON

En `renderIntegrations`:

```js
const liveOnly = visible.filter((item) => item.status === 'live');
```

Renderizar SÓLO `liveOnly`. Drop la lógica de `wrapTag = isLive ? 'a' : 'div'` y el `is-soon` modifier — todos los items son live ahora.

### 9.2. Chapter dinámico

Antes de `grid.innerHTML = html`:

```js
const chapter = document.getElementById('adm-int-chapter');
if (chapter) {
    chapter.textContent = liveOnly.length > 0
        ? 'Activas · ' + String(liveOnly.length).padStart(2, '0')
        : 'Sin integraciones activas';
}
```

### 9.3. Markup nuevo del card

```js
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
```

(Sin `is-soon`, sin lógica condicional para soon, badge siempre "Live".)

## 10. integrations.json

Sin cambios. Las 4 entradas con `status === "soon"` se quedan en data — sólo se filtran en render. Si Pedro quiere activarlas en el futuro, basta con cambiar `"status": "live"` y reaparecen.

## 11. Topbar y footer

Sin cambios.

## 12. Plan de pruebas (verificación visual)

1. **Carga inicial**: fondo blanco puro, hero "Elige una intervención." con "intervención." en azul CRUX, sin italic, headline visual con mucho volumen (Manrope 800).
2. **Sidemeta**: filas alineadas a la derecha, sin caja con fondo, mono dim.
3. **Chapter "Activas · 02"**: visible, mono uppercase.
4. **Grid 2 columnas**: financial + comunicación, lado a lado, cards grandes, blanco puro, sombra azul muy suave.
5. **Animación idle**: cards "respiran" ±1.5 px en 6 s. Imperceptible salvo si te quedas mirando.
6. **Hover**:
   - Lift 8 px hacia arriba.
   - Sombra azul crece y se difumina.
   - Border más definido en azul.
   - Accent line top crece de 90 → 160 px.
   - Flecha del CTA se desplaza 6 px a la derecha.
7. **Cards SOON**: ya no se ven. La sección "Próximamente" no existe.
8. **Mobile (< 720 px)**: una columna. Animación se mantiene.
9. **Accesibilidad**: `prefers-reduced-motion: reduce` desactiva el breathe idle.
