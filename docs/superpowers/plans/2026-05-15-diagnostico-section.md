# Sección Diagnóstico (home) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir `<section class="about" id="sobre">` en `index.html` por una nueva sección `<section class="diagnostic" id="diagnostico">` (heading + lead + 3 cards de pasos + CTA hacia `#contacto`), añadir el CSS asociado en `assets/css/style.css` reutilizando el lenguaje visual de `.panel-path`, y limpiar todo el CSS huérfano de `.about*`. Spec: `docs/superpowers/specs/2026-05-15-diagnostico-section-design.md`.

**Architecture:** Ediciones directas sobre dos archivos estáticos (HTML + CSS). Sin frameworks, sin build, sin JS nuevo. Verificación = grep + Playwright (idle + hover + responsive).

**Tech Stack:** HTML5 + CSS3 vanilla, Python http.server (puerto 3000), Playwright MCP para verificación visual.

**Preview URL:** http://localhost:3000/index.html (servidor estático ya corriendo; si no, `cd /mnt/c/codigo/crux/pan/pan && nohup python3 -m http.server 3000 > /tmp/crux-preview.log 2>&1 &`).

**Archivos afectados:**
- `index.html` (Task 1)
- `assets/css/style.css` (Tasks 2 y 5)

**No se crean archivos nuevos. No se tocan archivos fuera de esos dos. No se elimina ningún asset de imagen.**

---

## Task 1: Sustituir el HTML del about por la nueva sección diagnostic

**Files:**
- Modify: `index.html` (líneas 477–524, el `<section class="about">` completo incluyendo el `<picture>` y el `</section>` de cierre)

- [ ] **Step 1: Verificar estado "antes" con grep**

```bash
grep -n '<section class="about\|id="sobre"\|class="diagnostic\|id="diagnostico"' index.html
```

Expected output:
```
477:    <section class="about section-padding" id="sobre">
```

Confirma que la sección `about` existe (id="sobre") y que NO hay todavía sección `diagnostic`.

- [ ] **Step 2: Reemplazar el bloque completo**

Usa `Edit` sobre `index.html`. `old_string` empieza en el comentario `<!-- ═══...` previo al `<section class="about"` (para hacer único el match) y termina en el `</section>` de cierre del about. Sustituye por la nueva sección diagnostic.

`old_string`:
```html
    <section class="about section-padding" id="sobre">
        <picture class="section-media section-media--about" aria-hidden="true">
            <source type="image/webp" srcset="assets/images/about-bg-960.webp 960w, assets/images/about-bg-1600.webp 1600w" sizes="100vw">
            <img class="section-media__image" src="assets/images/about-bg-fallback.jpeg" alt="" width="1600" height="1215" decoding="async" loading="lazy">
        </picture>
        <div class="container">
            <h2 class="sr-only">Sobre nosotros</h2>
            <div class="about__manifesto reveal">
                <blockquote class="about__quote">
                    <span class="about__quote-mark">&ldquo;</span>No vendemos tecnología. Estructuramos tu negocio con herramientas
                    digitales y nos aseguramos de que tu equipo las use.
                    Si no las usan, no sirve de nada.<span class="about__quote-mark">&rdquo;</span>
                </blockquote>
            </div>
            <div class="about__grid reveal">
                <div class="about__body">
                    <p class="about__text">
                        CRUX Consulting es una consultora de digitalización para PYMEs con base en
                        Baleares. Trabajamos con PYMEs que saben que necesitan cambiar pero
                        no saben por dónde empezar. No somos una empresa de software ni una
                        agencia de marketing. Somos el equipo que se sienta contigo, entiende tu
                        negocio y estructura tu operativa con las herramientas digitales adecuadas.
                    </p>
                    <div class="about__details">
                        <div class="about__detail-item">
                            <span class="label">Fundado</span>
                            <span class="about__detail-value">2026</span>
                        </div>
                        <div class="about__detail-item">
                            <span class="label">Ubicación</span>
                            <span class="about__detail-value">Baleares</span>
                        </div>
                        <div class="about__detail-item">
                            <span class="label">Equipo</span>
                            <span class="about__detail-value">4 personas</span>
                        </div>
                    </div>
                    <a href="/nosotros" class="about__cta">
                        <span>Conoce al equipo</span>
                        <span class="about__cta-arrow" aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>
        </div>
    </section>
```

> Nota: si las líneas exactas no coinciden por ediciones previas, lee primero `index.html` alrededor de `id="sobre"` y copia el bloque tal cual.

`new_string`:
```html
    <section class="diagnostic section-padding" id="diagnostico">
        <div class="container">
            <div class="diagnostic__header reveal">
                <h2 class="diagnostic__heading">
                    Diagnóstico gratuito.<br>
                    <em>&iquest;Empezamos?</em>
                </h2>
                <p class="diagnostic__lead">
                    Analizamos tu negocio, detectamos los puntos de dolor y te
                    proponemos un plan concreto. Sin compromiso.
                </p>
            </div>

            <div class="diagnostic__steps reveal">
                <article class="diagnostic__step">
                    <span class="diagnostic__step-num">01</span>
                    <h3 class="diagnostic__step-title">Analizamos</h3>
                    <p class="diagnostic__step-desc">
                        Tu operativa actual, tus herramientas, qu&eacute; funciona y qu&eacute; no.
                    </p>
                </article>
                <article class="diagnostic__step">
                    <span class="diagnostic__step-num">02</span>
                    <h3 class="diagnostic__step-title">Detectamos</h3>
                    <p class="diagnostic__step-desc">
                        Los puntos de dolor que frenan tu equipo o tu negocio.
                    </p>
                </article>
                <article class="diagnostic__step">
                    <span class="diagnostic__step-num">03</span>
                    <h3 class="diagnostic__step-title">Plan concreto</h3>
                    <p class="diagnostic__step-desc">
                        Qu&eacute; tocar primero, qu&eacute; cambiar, qu&eacute; dejar.
                    </p>
                </article>
            </div>

            <div class="diagnostic__cta reveal">
                <a href="#contacto" class="diagnostic__btn">
                    Empezar diagn&oacute;stico
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Verificar estado "después" con grep**

```bash
grep -n '<section class="about\|id="sobre"\|class="diagnostic\|id="diagnostico"' index.html
```

Expected output:
```
477:    <section class="diagnostic section-padding" id="diagnostico">
```

Sin matches de `about` o `sobre`. La línea exacta puede variar; lo importante es que solo aparezca la nueva sección.

- [ ] **Step 4: No commit todavía** — el commit lo hacemos al final tras añadir el CSS y verificar visualmente. Si necesitas pausar el trabajo, sí commitea con mensaje WIP.

---

## Task 2: Añadir el CSS de `.diagnostic*` en `assets/css/style.css`

**Files:**
- Modify: `assets/css/style.css` (insertar bloque nuevo después de las reglas de `.about*` actuales para no romper orden de cascada; ubicación concreta: justo después del cierre de `.about__cta:hover .about__cta-arrow` ~línea 2754, antes del comentario `/* ═══ CONTACT ...`)

- [ ] **Step 1: Localizar el punto de inserción**

```bash
grep -n 'about__cta:hover .about__cta-arrow\|CONTACT' assets/css/style.css | head -5
```

Esto da la línea de cierre de las reglas about y la sección siguiente (Contact). El nuevo bloque va entre ellos.

- [ ] **Step 2: Insertar el CSS de diagnostic**

Usa `Edit` sobre `assets/css/style.css`. El `old_string` debe capturar el final de las reglas `.about*` + el comentario `═══ CONTACT` para hacer el match único. El `new_string` mantiene esas líneas y añade el bloque diagnostic en medio.

Lee primero las líneas 2750–2760 para tener el contexto exacto. Luego haz un Edit que:

`old_string` (ajusta a lo que veas):
```css
.about__cta:hover .about__cta-arrow {
    transform: translateX(4px);
}

/* ═══════════════════════════════════════
   CONTACT
```

`new_string`:
```css
.about__cta:hover .about__cta-arrow {
    transform: translateX(4px);
}

/* ═══════════════════════════════════════
   DIAGNOSTIC
   ═══════════════════════════════════════ */
.diagnostic {
    background: #fff;
    text-align: center;
}
.diagnostic__header {
    max-width: 720px;
    margin: 0 auto clamp(2.5rem, 5vh, 4rem);
}
.diagnostic__heading {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5.5vw, 4.5rem);
    font-weight: 300;
    line-height: 1.1;
    margin-bottom: 1.2rem;
}
.diagnostic__heading em {
    color: var(--accent);
    font-style: italic;
}
.diagnostic__lead {
    font-size: clamp(0.95rem, 1.05vw, 1.05rem);
    color: var(--text-muted);
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.7;
}

.diagnostic__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(1rem, 2vw, 1.5rem);
    max-width: 980px;
    margin: 0 auto clamp(2.5rem, 5vh, 4rem);
}

.diagnostic__step {
    background: #fff;
    border-radius: 10px;
    padding: 1.4rem 1.3rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    text-align: left;
    transition: rotate 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                translate 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.4s ease;
}
.diagnostic__step:nth-child(1) { rotate: -1deg; animation: diagnosticStepFloat 3.4s ease-in-out infinite; }
.diagnostic__step:nth-child(2) { rotate: 0;     animation: diagnosticStepFloat 3s   ease-in-out 0.3s infinite; }
.diagnostic__step:nth-child(3) { rotate: 1deg;  animation: diagnosticStepFloat 3.2s ease-in-out 0.6s infinite; }
@keyframes diagnosticStepFloat {
    0%, 100% { translate: 0 0; }
    50%      { translate: 0 -3px; }
}
.diagnostic__steps:hover .diagnostic__step {
    animation-play-state: paused;
    rotate: 0;
}
.diagnostic__step:hover {
    translate: 0 -6px;
    scale: 1.02;
    box-shadow: 0 14px 36px rgba(56, 105, 171, 0.18);
    z-index: 2;
}
.diagnostic__step-num {
    font-family: var(--font-brand);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--accent);
    background: rgba(56, 105, 171, 0.08);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.9rem;
    transition: background 0.3s ease, color 0.3s ease, scale 0.3s ease;
}
.diagnostic__step:hover .diagnostic__step-num {
    background: var(--accent);
    color: #fff;
    scale: 1.08;
}
.diagnostic__step-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 400;
    margin-bottom: 0.4rem;
}
.diagnostic__step-desc {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.55;
}

.diagnostic__cta {
    display: flex;
    justify-content: center;
}
.diagnostic__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 2.4rem;
    background: var(--accent);
    color: #fff;
    text-decoration: none;
    font-family: var(--font-brand);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border-radius: 999px;
    transition: background 0.3s ease, translate 0.3s var(--ease-out), box-shadow 0.3s ease;
    box-shadow: 0 4px 14px rgba(56, 105, 171, 0.25);
}
.diagnostic__btn:hover {
    background: var(--accent-hover);
    translate: 0 -2px;
    box-shadow: 0 8px 22px rgba(56, 105, 171, 0.35);
}

@media (max-width: 768px) {
    .diagnostic__steps {
        grid-template-columns: 1fr;
        max-width: 480px;
    }
}

/* ═══════════════════════════════════════
   CONTACT
```

- [ ] **Step 3: Verificar que el CSS aplica con grep**

```bash
grep -c '^\.diagnostic' assets/css/style.css
```

Expected: ≥ 8 (al menos `.diagnostic`, `.diagnostic__header`, `.diagnostic__heading`, `.diagnostic__lead`, `.diagnostic__steps`, `.diagnostic__step`, `.diagnostic__step-num`, `.diagnostic__step-title`, `.diagnostic__step-desc`, `.diagnostic__cta`, `.diagnostic__btn`).

---

## Task 3: Verificación visual desktop (idle, hover, numerito invertido)

**Files:**
- Read only — visual checks vía Playwright. Sin modificaciones de archivos.

- [ ] **Step 1: Navegar a la home con cache-buster**

```js
// Playwright MCP
browser_resize(1440, 900)
browser_navigate("http://localhost:3000/index.html?v=" + Date.now())
```

- [ ] **Step 2: Forzar el reveal de todas las secciones y scrollear al diagnostic**

```js
browser_evaluate(`() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelector('#diagnostico').scrollIntoView({block: 'center'});
    return 'ok';
}`)
```

- [ ] **Step 3: Screenshot del idle**

```js
browser_take_screenshot({ type: 'jpeg' })
```

Verifica visualmente:
- Heading "Diagnóstico gratuito." (display large) con "¿Empezamos?" en italic azul
- Párrafo lead bajo el heading
- 3 cards blancas con sombra suave, numeritos circulares (01/02/03) azul light, titles y descripciones
- Rotación sutil: -1° / 0 / +1° respectivamente
- Botón pill accent abajo centrado

- [ ] **Step 4: Comprobar computed styles del idle**

```js
browser_evaluate(`() => {
    const card = document.querySelector('.diagnostic__step:nth-child(2)');
    const num = document.querySelector('.diagnostic__step:nth-child(2) .diagnostic__step-num');
    const btn = document.querySelector('.diagnostic__btn');
    return {
        cardBg: getComputedStyle(card).backgroundColor,
        cardShadow: getComputedStyle(card).boxShadow,
        numBg: getComputedStyle(num).backgroundColor,
        numColor: getComputedStyle(num).color,
        btnBg: getComputedStyle(btn).backgroundColor,
    };
}`)
```

Expected (aproximado):
- `cardBg`: `rgb(255, 255, 255)`
- `cardShadow`: contiene `rgba(0, 0, 0, 0.05)`
- `numBg`: `rgba(56, 105, 171, 0.08)`
- `numColor`: `rgb(56, 105, 171)`
- `btnBg`: `rgb(56, 105, 171)`

Si algo no encaja, mira primero el cache del navegador — fuerza recarga del CSS con `?v=Date.now()` en el link.

- [ ] **Step 5: Hover sobre la card central**

```js
browser_hover('.diagnostic__step:nth-child(2)')
browser_take_screenshot({ type: 'jpeg' })
```

Verifica:
- La card hovered hace lift visible (-6px) y scale ligero
- Sombra accent azul más grande
- Numerito invertido: fondo azul sólido, texto blanco

- [ ] **Step 6: Comprobar computed styles del hover**

```js
browser_evaluate(`() => {
    const num = document.querySelector('.diagnostic__step:nth-child(2) .diagnostic__step-num');
    return {
        numBg: getComputedStyle(num).backgroundColor,
        numColor: getComputedStyle(num).color,
    };
}`)
```

Expected:
- `numBg`: `rgb(56, 105, 171)` (accent sólido)
- `numColor`: `rgb(255, 255, 255)`

- [ ] **Step 7: Hover sobre el botón**

```js
browser_hover('.diagnostic__btn')
browser_take_screenshot({ type: 'jpeg' })
```

Verifica que el botón hace lift y la sombra se intensifica.

---

## Task 4: Verificación responsive (móvil < 768px)

**Files:**
- Read only — Playwright.

- [ ] **Step 1: Resize a móvil**

```js
browser_resize(390, 800)
```

- [ ] **Step 2: Recargar y scrollear**

```js
browser_navigate("http://localhost:3000/index.html?v=" + Date.now())
browser_evaluate(`() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelector('#diagnostico').scrollIntoView({block: 'start'});
    return 'ok';
}`)
```

- [ ] **Step 3: Screenshot full-page**

```js
browser_take_screenshot({ type: 'jpeg', fullPage: true })
```

Verifica:
- Las 3 cards stackean verticalmente (una columna)
- Heading y lead siguen legibles
- Botón sigue centrado y tamaño adecuado al ancho

- [ ] **Step 4: Comprobar layout vía computed style**

```js
browser_evaluate(`() => {
    const s = document.querySelector('.diagnostic__steps');
    return getComputedStyle(s).gridTemplateColumns;
}`)
```

Expected: una sola columna (algo como `XXXpx` único, no `Xpx Xpx Xpx`).

- [ ] **Step 5: Restaurar viewport desktop**

```js
browser_resize(1440, 900)
```

---

## Task 5: Limpiar CSS huérfano de `.about*`

**Files:**
- Modify: `assets/css/style.css` (bloque base ~líneas 2641–2754 + media queries ~3811-3818, ~3913-3931, ~3973-3978 — números aproximados; los reales pueden variar tras Tasks 1 y 2)

- [ ] **Step 1: Listar todas las apariciones de `.about*`**

```bash
grep -n '^\.about\|\.about__\|\.about::before\|\.about >' assets/css/style.css
```

Esto da las líneas exactas. Apunta el rango para Step 2 y 3.

- [ ] **Step 2: Eliminar el bloque base de reglas `.about*`**

Lee el archivo desde la línea del primer match (~2641, `.about {`) hasta `.about__cta:hover .about__cta-arrow { ... }` y el cierre (~2754). Confirma que ese rango contiene SOLO reglas `.about*` (no debe haber reglas `.diagnostic*` ni otras intercaladas).

Usa `Edit` con `old_string` que abarca todo el bloque base (incluido el comentario `/* ─── About ───*/` si existe) y `new_string` vacío (o solo el comentario siguiente). Por ejemplo:

```css
/* ─── About ─── */   <-- (puede no existir, comprueba)
.about {
    ...
}
/* ... todas las reglas .about* ... */
.about__cta:hover .about__cta-arrow {
    transform: translateX(4px);
}
```

reemplaza por:

```css

```

(una línea vacía o el comentario del siguiente bloque).

- [ ] **Step 3: Eliminar media queries asociadas**

Repite el grep:

```bash
grep -n '\.about__' assets/css/style.css
```

Las restantes serán las dentro de media queries (`@media`). Para cada una, elimina la regla `.about__*` (solo la regla, no el media query entero — puede contener otras reglas). Si la regla es la única dentro del `@media`, elimina el `@media` también.

Líneas aproximadas a inspeccionar (según spec): 3811, 3818, 3913, 3919, 3923, 3927, 3931, 3973, 3978.

- [ ] **Step 4: Verificar que no queda ninguna referencia**

```bash
grep -n '\.about\|section-media--about' assets/css/style.css index.html
```

Expected output: ninguna línea (vacío). `section-media--about` también se fue al borrar el `<picture>` del HTML en Task 1.

- [ ] **Step 5: Verificar visualmente que nada se rompió**

Recarga la home y comprueba que las otras secciones siguen intactas:

```js
browser_navigate("http://localhost:3000/index.html?v=" + Date.now())
browser_evaluate(`() => { document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible')); return 'ok'; }`)
browser_take_screenshot({ type: 'jpeg', fullPage: true })
```

Repasa hero, "No todos los negocios", proyectos, "Cómo trabajamos", la nueva diagnostic, y "Hablemos". Todas deben mostrarse correctamente sin huecos ni roturas.

---

## Task 6: Verificación de scroll smooth al CTA

**Files:**
- Read only — Playwright.

- [ ] **Step 1: Click en el botón "Empezar diagnóstico"**

```js
browser_navigate("http://localhost:3000/index.html?v=" + Date.now())
browser_evaluate(`() => { document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible')); document.querySelector('#diagnostico').scrollIntoView({block:'start'}); return 'ok'; }`)
// Esperar a que se asiente y luego clicar el botón
browser_click('.diagnostic__btn')
```

(Si `browser_click` no está cargado, usa `browser_evaluate` para ejecutar `document.querySelector('.diagnostic__btn').click()`.)

- [ ] **Step 2: Verificar que el scroll terminó en `#contacto`**

```js
browser_evaluate(`() => {
    const target = document.querySelector('#contacto');
    const rect = target.getBoundingClientRect();
    return { topInViewport: rect.top, atContact: Math.abs(rect.top) < 100 };
}`)
```

Expected: `atContact: true` o `topInViewport` cerca de 0 (la sección `#contacto` está al inicio del viewport).

---

## Task 7: Commit y deploy a producción

**Files:**
- Modify: `index.html`, `assets/css/style.css` (ya modificados en tasks anteriores)
- Cherry-pick a una rama temporal `refactor/web-diagnostico-section` desde `origin/main`, PR, merge

- [ ] **Step 1: Verificar estado del working tree**

```bash
git status --short
```

Expected: dos archivos modificados (`index.html`, `assets/css/style.css`). Eventualmente también `docs/superpowers/plans/2026-05-15-diagnostico-section.md` (este plan).

- [ ] **Step 2: Commit en la rama actual (`feat/comm-row-adaptive`)**

```bash
git add index.html assets/css/style.css docs/superpowers/plans/2026-05-15-diagnostico-section.md
git commit -m "$(cat <<'EOF'
feat(web): sustituir about por sección Diagnóstico gratuito

Reemplaza la sección "No vendemos tecnología" + stats + CTA a /nosotros
por una nueva sección "Diagnóstico gratuito. ¿Empezamos?" con heading,
lead, 3 cards estilo panel-path (Analizamos / Detectamos / Plan) y un
botón pill que hace scroll a #contacto. Limpia todo el CSS huérfano
de .about*.

Spec: docs/superpowers/specs/2026-05-15-diagnostico-section-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Push de la feature branch**

```bash
git push origin feat/comm-row-adaptive
```

- [ ] **Step 4: Cherry-pick a una nueva rama desde main para deploy aislado**

```bash
HASH=$(git log -1 --format='%H')
git fetch origin main
git checkout -b refactor/web-diagnostico-section origin/main
git cherry-pick "$HASH"
git push -u origin refactor/web-diagnostico-section
```

- [ ] **Step 5: Crear PR contra main y mergear vía API**

```bash
python3 <<'PYEOF'
import json, urllib.request, os
TOKEN = os.popen("git config --get remote.origin.url | sed -n 's|.*://[^:]*:\\([^@]*\\)@.*|\\1|p'").read().strip()
body = '''## Summary
Sustituye la sección "Sobre nosotros" de la home por una sección "Diagnóstico gratuito. ¿Empezamos?" con heading, lead, 3 cards estilo panel-path (Analizamos / Detectamos / Plan) y un botón pill que hace scroll a #contacto. Limpia todo el CSS huérfano de `.about*` y la imagen del `<picture>` queda huérfana (limpieza opcional).

Spec: `docs/superpowers/specs/2026-05-15-diagnostico-section-design.md`
Plan: `docs/superpowers/plans/2026-05-15-diagnostico-section.md`

## Test plan
- [x] Idle + hover verificados con Playwright a 1440×900
- [x] Responsive < 768px verificado (stack vertical)
- [x] Scroll al CTA verifica que aterriza en #contacto

🤖 Generated with [Claude Code](https://claude.com/claude-code)'''
data = json.dumps({'title':'feat(web): sustituir about por sección Diagnóstico gratuito','head':'refactor/web-diagnostico-section','base':'main','body':body}).encode()
req = urllib.request.Request('https://api.github.com/repos/frodepmc/crux/pulls', data=data, headers={'Authorization':f'token {TOKEN}','Accept':'application/vnd.github+json','User-Agent':'claude-code'}, method='POST')
pr = json.loads(urllib.request.urlopen(req).read())
print('PR', pr['number'], pr['html_url'])
mdata = json.dumps({'merge_method':'squash'}).encode()
mreq = urllib.request.Request(f"https://api.github.com/repos/frodepmc/crux/pulls/{pr['number']}/merge", data=mdata, headers={'Authorization':f'token {TOKEN}','Accept':'application/vnd.github+json','User-Agent':'claude-code'}, method='PUT')
print('MERGE', json.loads(urllib.request.urlopen(mreq).read()))
dreq = urllib.request.Request(f'https://api.github.com/repos/frodepmc/crux/git/refs/heads/refactor/web-diagnostico-section', headers={'Authorization':f'token {TOKEN}','Accept':'application/vnd.github+json','User-Agent':'claude-code'}, method='DELETE')
urllib.request.urlopen(dreq); print('branch deleted')
PYEOF
```

- [ ] **Step 6: Limpiar la rama local y volver a la feature branch**

```bash
git checkout feat/comm-row-adaptive
git branch -D refactor/web-diagnostico-section
```

- [ ] **Step 7: Esperar 1-2 min y verificar despliegue en producción**

Vercel desplegará `main` a `cruxmallorca.es`. Para confirmar:

```bash
curl -s "https://cruxmallorca.es/" | grep -c 'class="diagnostic\|id="diagnostico"'
```

Expected: ≥ 1 (HTML actualizado en producción). Si devuelve 0, espera otro minuto y reintenta.

---

## Aceptación final

- [ ] La sección about (`#sobre`) no existe en `index.html`
- [ ] La sección diagnostic (`#diagnostico`) aparece entre `process` y `contact`
- [ ] CSS de `.diagnostic*` añadido y aplicado
- [ ] CSS de `.about*` y media queries asociadas eliminados
- [ ] `grep '\.about' assets/css/style.css index.html` no devuelve nada
- [ ] Verificado visualmente en desktop (1440×900) idle + hover
- [ ] Verificado responsive (<768px) — stack vertical
- [ ] Scroll del CTA aterriza en `#contacto`
- [ ] PR mergeado a `main` y producción actualizada
