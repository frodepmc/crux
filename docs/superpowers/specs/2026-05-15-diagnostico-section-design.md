# Sección "Diagnóstico" en la home — diseño

**Fecha:** 2026-05-15
**Archivo objetivo:** `index.html` + `assets/css/style.css`
**Estado actual:** la sección que se sustituye es `<section class="about" id="sobre">` (manifesto + stats + CTA a /nosotros).

---

## 1. Contexto

La sección "About" de la home (`<section class="about" id="sobre">`) contiene:
- Una cita grande ("No vendemos tecnología. Estructuramos tu negocio…")
- Un párrafo descriptivo + 3 stats (Fundado 2026 · Baleares · 4 personas)
- Un CTA secundario hacia `/nosotros`

El usuario quiere reemplazarla por completo manteniendo el fondo blanco, con foco en una llamada a la acción para el **Diagnóstico gratuito** que empuje a la sección "Hablemos" (formulario de contacto) del final de la home.

El sitio ya tiene un patrón para "Diagnóstico gratuito" en `servicios.html` (`.svc-cta`): heading grande con palabra en italic accent + descripción + botones (WhatsApp / Email). Esta nueva sección **adapta** ese lenguaje a la home pero con un layout más rico (3 pasos del proceso visibles) y un único CTA que hace scroll a `#contacto`.

## 2. Alcance

### Dentro de alcance
- Sustituir el bloque HTML completo de `<section class="about">` por `<section class="diagnostic">`
- Añadir las reglas CSS de `.diagnostic*` en `assets/css/style.css`
- Eliminar todo el CSS huérfano de `.about*` (`.about__quote`, `.about__quote-mark`, `.about__manifesto`, `.about__grid`, `.about__body`, `.about__text`, `.about__details`, `.about__detail-item`, `.about__detail-value`, `.about__cta`, `.about__cta-arrow` y sus media queries)

### Fuera de alcance
- No se modifican otras secciones de la home
- No se borran los assets de imagen (`about-bg-*.webp`) — quedan huérfanos en `assets/images/` y se pueden purgar en una pasada posterior si interesa
- No se altera la navegación / footer / meta-tags
- No se añade lógica JS nueva
- No se modifica el `<h2 class="sr-only">Sobre nosotros</h2>` lógicamente — desaparece junto con la sección

### Anchors
Ningún anchor del repo apunta a `#sobre` (verificado con grep). El cambio de id de `#sobre` a `#diagnostico` no rompe enlaces.

## 3. Contenido

### 3.1. Heading

Dos líneas, con `<em>` en la segunda para aplicar el color accent (mismo patrón que `.svc-cta__heading em`):

```
Diagnóstico gratuito.
<em>¿Empezamos?</em>
```

### 3.2. Lead

Un párrafo bajo el heading, color `var(--text-muted)`:

> Analizamos tu negocio, detectamos los puntos de dolor y te proponemos un plan concreto. Sin compromiso.

### 3.3. Tres pasos (cards)

| # | Título | Descripción |
|---|---|---|
| 01 | Analizamos | Tu operativa actual, tus herramientas, qué funciona y qué no. |
| 02 | Detectamos | Los puntos de dolor que frenan tu equipo o tu negocio. |
| 03 | Plan concreto | Qué tocar primero, qué cambiar, qué dejar. |

### 3.4. CTA

- **Label:** `EMPEZAR DIAGNÓSTICO →`
- **Href:** `#contacto` (scroll a la sección "Hablemos" de la home)
- **Comportamiento:** scroll suave si el navegador lo soporta (sin JS adicional — basta con CSS `scroll-behavior: smooth` global ya presente; si no lo hay, el anchor funciona igualmente).

## 4. Arquitectura HTML

```html
<section class="diagnostic section-padding" id="diagnostico">
    <div class="container">
        <div class="diagnostic__header reveal">
            <h2 class="diagnostic__heading">
                Diagnóstico gratuito.<br>
                <em>¿Empezamos?</em>
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
                    Tu operativa actual, tus herramientas, qué funciona y qué no.
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
                    Qué tocar primero, qué cambiar, qué dejar.
                </p>
            </article>
        </div>

        <div class="diagnostic__cta reveal">
            <a href="#contacto" class="diagnostic__btn">
                Empezar diagnóstico
                <span aria-hidden="true">→</span>
            </a>
        </div>
    </div>
</section>
```

## 5. Estilos CSS

### 5.1. Section base

```css
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
```

### 5.2. Steps grid

```css
.diagnostic__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(1rem, 2vw, 1.5rem);
    margin-bottom: clamp(2.5rem, 5vh, 4rem);
    max-width: 980px;
    margin-left: auto;
    margin-right: auto;
}
@media (max-width: 768px) {
    .diagnostic__steps {
        grid-template-columns: 1fr;
        max-width: 480px;
    }
}
```

### 5.3. Step card — imita `.panel-path`

```css
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
```

### 5.4. CTA button

```css
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
```

## 6. Limpieza

CSS a eliminar de `assets/css/style.css` (búsqueda exhaustiva ya realizada con `grep '^\.about\|\.about__\|section-media--about'`):

**Reglas base (líneas 2641–2754):**
- `.about`
- `.about::before`
- `.about > :not(.section-media)`
- `.about__manifesto`
- `.about__quote`
- `.about__quote::before`
- `.about__quote-mark`
- `.about__grid`
- `.about__body`
- `.about__text`
- `.about__details`
- `.about__detail-item`
- `.about__detail-value`
- `.about__cta`
- `.about__cta:hover`
- `.about__cta-arrow`
- `.about__cta:hover .about__cta-arrow`

**Media queries:**
- Líneas 3811, 3818 — overrides de `.about__details`, `.about__detail-item`
- Líneas 3913, 3919, 3923, 3927, 3931 — overrides de `.about__quote`, `.about__body`, `.about__text`, `.about__details`, `.about__detail-value`
- Líneas 3973, 3978 — overrides de `.about__quote`, `.about__body`

**Selector `.section-media--about`:** solo aparece como marker class en el HTML del about (sin reglas CSS asociadas). Desaparece junto al markup, sin limpieza CSS extra.

**Assets:** `assets/images/about-bg-*.{webp,jpeg}` quedan huérfanos al borrar el `<picture>`. No afectan el funcionamiento. Limpieza opcional aplazada.

## 7. Responsive

| Breakpoint | Comportamiento |
|---|---|
| ≥ 768px | Grid de 3 columnas, cards uno al lado del otro |
| < 768px | Stack vertical, max-width 480px centrado |
| Heading | clamp() escala automáticamente entre móvil y desktop |
| Botón | mismo tamaño, centrado |

## 8. Animaciones

- **Reveal scroll:** las 3 sub-secciones (`.diagnostic__header`, `.diagnostic__steps`, `.diagnostic__cta`) llevan `class="reveal"` para entrar con el observer existente (`.reveal.is-visible`).
- **Float idle:** las cards tienen un float vertical continuo (translate ±3px) con desfase, rotate sutil alterno (-1° / 0 / +1°) — mismo patrón que `.panel-path`.
- **Hover spring:** al pasar el ratón sobre `.diagnostic__steps`, todas las cards pausan el float y se enderezan; la card hovered hace lift (-6px), scale 1.02, sombra accent y su numerito se invierte (bg accent / color blanco).
- **Botón hover:** lift -2px + sombra accent más amplia.

## 9. Aceptación

- [ ] La sección `.about#sobre` ya no existe en `index.html`
- [ ] La nueva sección `.diagnostic#diagnostico` aparece entre `process` y `contact`
- [ ] Fondo blanco puro, sin imagen ni overlay
- [ ] Heading con `<em>` accent en "¿Empezamos?"
- [ ] 3 cards funcionando: idle float + hover spring + numerito invertido
- [ ] Botón scroll a `#contacto`
- [ ] Responsive verificado en ≥768 y <768
- [ ] CSS de `.about*` retirado
- [ ] Sin orphan refs en JS/HTML al class set eliminado
- [ ] Verificación visual con Playwright (idle + hover)

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El `<h2 class="sr-only">Sobre nosotros</h2>` aportaba accesibilidad/SEO | Se sustituye implícitamente por `<h2 class="diagnostic__heading">Diagnóstico gratuito…` |
| Los assets `about-bg-*.webp` quedan huérfanos | OK, no afectan; se borran en pasada posterior si se decide |
| Pérdida del quote "No vendemos tecnología…" | El quote no aparece en otras páginas; se asume pérdida intencionada según pedido del usuario |
| El botón con `border-radius: 999px` rompe el lenguaje cuadrado del sitio | Verificación visual en Playwright; si choca, alternativa es `border-radius: 8px` plano |
