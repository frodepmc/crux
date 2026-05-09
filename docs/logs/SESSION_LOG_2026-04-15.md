# Registro de sesión — CRUX Consulting · 15 abril 2026

## Datos de la sesión

- **Modelo:** Claude Opus 4.6 (1M context)
- **Contexto consumido:** ~93% (930k/1M tokens)
- **Duración:** sesión completa de un día
- **Commits:** 14 (de `5dbbade` a `a303933`)
- **Archivos nuevos:** 7 (servicios.css, configurator.js, aviso-legal.html, privacidad.html, cookies.html, cta-bg.svg, 6 background images)
- **Archivos modificados:** 10 (index.html, servicios.html, style.css, sitemap.xml, configurator.js, servicios.css, + archivos eliminados)
- **Líneas:** +4.507 / −842 (neto +3.665)
- **Archivos eliminados:** 3 (cta-bg-1600.webp, cta-bg-960.webp, cta-bg-fallback.jpeg)

---

## 1. IMÁGENES DE FONDO PARA SERVICIOS

### 1.1 Análisis de 6 imágenes Unsplash candidatas
Se analizaron visualmente 6 imágenes sin clasificar en `assets/`:
- `jack-b` (nubes sunset) — descartada: tono cálido incompatible
- `jocelyn-morales` (edificio vertical) — ✅ seleccionada para CTA
- `kunj-parekh` (duna negra) — ✅ seleccionada para asesoria-banner
- `leandre-c` (mar turquesa) — descartada: demasiado literal/turístico
- `tamara-bitter` (playa arena negra) — descartada: aceptable pero inferior
- `tom-robinson` (acantilado Mallorca) — descartada: reconocible como lugar

### 1.2 Integración de fondos
- **asesoria-banner**: duna negra (kunj-parekh) con overlay navy gradient (rgba 56,105,171 a 0.9→0.78)
- **svc-cta**: edificio arquitectónico (jocelyn-morales) con overlay cream (0.92→0.84)
- Optimización con Python/Pillow: WebP 960w + 1600w + JPEG fallback
- `object-position` ajustado para mostrar la línea de horizonte duna/cielo

### 1.3 Fondo full-page
- Imagen seleccionada por el usuario: `minimalist-architectural-building-details.jpg` (2048×4096)
- Generadas variantes: page-bg-2048.webp (37KB), page-bg-1280.webp (16KB), page-bg-960.webp (11KB)
- Implementado como `.services-backdrop` con `isolation: isolate` cubriendo hero→asesoria
- Overlay cream degradado vertical (45%→65%→40%)

**Commit:** `5dbbade`

---

## 2. REDISEÑO COMPLETO DE SERVICIOS.HTML

### 2.1 Catálogo modular CRUX 2026
Pivote total del modelo de negocio: los 4 packs verticales (Motor de Reservas, Central de Operaciones, Facturación Digital, Control Comercial) se reemplazaron por un sistema modular:

**Bases web (elegir UNA):**
- B1 Landing Page — desde 700 €
- B2 Web Estándar — desde 2.400 €
- B3 Web Completa — desde 4.500 €

**Módulos apilables (M1-M6):**
- M1 Contenido/Blog (1.500 €), M2 Gobierno Editorial (1.800 €)
- M3 Dashboard (discovery), M4 Autenticación (discovery)
- M5 Comercio (2.500 €), M6 Producto Digital/MVP (discovery)

**Transversales (10 servicios a la carta):**
Branding, Copywriting, Auditoría SEO, SEO mensual, Multiidioma, Soporte técnico RGPD, IA chatbot, Mantenimiento, Automatizaciones, Hosting

**Presets populares (5):**
Web corporativa+blog, E-commerce, Portal B2B, Dashboard operativo, SaaS MVP

### 2.2 Configurador interactivo (`configurator.js` — 947 líneas)

**Arquitectura:**
- Datos: `const CATALOG = Object.freeze({...})` con bases, modules, transversales, presets
- Estado: `{ baseId, moduleIds: Set, transversalIds: Set }`
- Pricing conservador: módulo más barato a full, restantes −10%
- Módulos discovery (M3/M4/M6): suman 0 al total + panel amarillo warning
- Formato: `Intl.NumberFormat('es-ES', {useGrouping: 'always'})` → "1.500 €"

**Funcionalidades:**
- selectBase() con deselección (click en base activa la quita)
- toggleModule() con validación (requiresBase, requiresModule)
- Cascada de dependencias (quitar M1 arrastra M2)
- loadPreset() destructivo con stagger animation
- resetConfig() con doble confirmación (patrón "double-click")
- buildWhatsAppMessage() → deep link `wa.me/34692447491`
- Progressive disclosure: módulos/transversales locked hasta base seleccionada
- Sidebar sticky desktop / drawer fijo mobile (movido a `<body>` para escapar stacking context)

**Reglas de negocio:**
- M1/M2/M3/M4/M5/M6 requieren B2 o B3 (no B1)
- M2 requiere M1 activo
- Deseleccionar base limpia todo (módulos + transversales)
- Send button requires base
- Alacarte "Añadir al configurador" verifica base + track activo

### 2.3 Progressive disclosure
- Grupos de módulos y transversales arrancan bloqueados con overlay blur + mensaje "Elige una base para desbloquear"
- `max-height: 100px` locked → `max-height: 3000px` unlocked con transición
- Stagger animation `cardUnlock` al desbloquear
- Progress badges (✓/○) en group headers
- Sidebar mini-steps (01/02/03) con estados done/current

### 2.4 HTML del configurador
- Sección `#catalogo` con 3 steps (Elige base → Apila módulos → Transversales)
- Sección `#configurador` con layout 2-col (main + sidebar sticky)
- Presets como cards con pills de componentes
- Base cards con `min-height: 180px` + left accent border
- Module cards con discovery badge (`::before` inline)
- Transversal cards compactas (flex row)
- Lock overlays con `data-step` attribute
- Sidebar: summary rows, discovery panel, totals, disclaimer, send+reset buttons

**Commit:** `5dbbade`

---

## 3. MEJORAS UX (12 FIXES)

### 3.1 Fixes críticos
- **C1**: Mobile drawer hint — bounce animation tras 2s con IntersectionObserver + sessionStorage
- **C2**: Progress badges — 3 badges circulares inyectados por JS en group headers
- **C3**: Preset animation — stagger `presetPulse` en cards seleccionadas + scroll a bases
- **C4**: Blocked flash — 1.2s con rojo más fuerte + `void offsetWidth` para restart

### 3.2 Fixes high
- **H5**: Discovery badges — `::before` inline en module name con class `has-discovery-badge`
- **H6**: Checkmarks 28px (era 22), border 1.5px, inset box-shadow
- **H7**: Toasts 5s (era 4s), `scale(0.97)→1`, border-left accent, mobile bottom:76px
- **H8**: Cascade flash en dependencias con stagger 150ms
- **H9**: `:active { scale(0.97) }` en cards y presets
- **H10**: Reset doble confirmación (3s timeout, estilo rojo)
- **H11**: Resize transition sidebar sticky↔drawer con fade opacity
- **H12**: Disabled button distinto (`var(--border-strong)` + text-muted)

**Commit:** `f091627`

---

## 4. AUDITORÍA HTML / ACCESIBILIDAD

### Cambios en `servicios.html`:
- `#cursor` → `aria-hidden="true"`
- Asesoria points: `<div>` → `<ul>/<li>` semántico
- SVG checkmark icon → `role="img" aria-label="Incluido"`
- 10 alacarte CTAs: `<a href>` → `<button type="button">`
- Toast container: `aria-atomic="true" aria-relevant="additions"`
- Sidebar summary: `aria-label` + `role="region"`
- CTA logo: `loading="lazy"`
- Discovery explanation: `<span id="discovery-explain" class="sr-only">`

### Cambios en `configurator.js`:
- Preset cards: `role="listitem"` eliminado
- Toast chips: `role="status"` añadido
- Drawer: focus al CTA al abrir
- Resize listener: debounce 150ms
- Discovery modules: `aria-describedby="discovery-explain"`
- WhatsApp send: `aria-busy="true/false"` + timeout 3s

### Cambios en `servicios.css`:
- `button.alacarte__cta` reset (background, border, padding, cursor)
- `ul.asesoria-banner__points` → `list-style: none`

**Commit:** `f091627`

---

## 5. FIXES TÉCNICOS

### 5.1 Z-index drawer mobile
- **Problema**: `.services-backdrop { isolation: isolate }` atrapaba el sidebar con `z-index: 100`
- **Fix**: `document.body.appendChild(sidebar)` en mobile (≤900px) para escapar del stacking context
- Resize handler devuelve sidebar a `.configurator__layout` en desktop

**Commit:** `39ca44c`

### 5.2 Códigos internos eliminados
- B1/B2/B3 y M1-M6 eliminados de la UI visible (cards, presets, discovery panel)
- Añadido campo `pill` al catálogo para labels cortos (Landing, Estándar, Blog, etc.)
- Códigos conservados solo en mensaje WhatsApp (para equipo CRUX)

**Commit:** `0ff6dc1`

### 5.3 CTA fondo
- Logo CRUX eliminado del bloque CTA
- Imagen jocelyn-morales reemplazada por SVG geométrico (`cta-bg.svg`)
- Overlay cream reducido de ~88% a ~45% para mostrar el SVG
- `svc-cta__body` centrado

**Commit:** `079f445`

### 5.4 Sticky sidebar cross-browser
- **Problema**: `overflow-x: hidden` en `<html>` creaba scroll container fantasma que rompía `position: sticky`
- **Fix**: `overflow-x: clip` en style.css + override en servicios.css
- `clip` no crea scroll container → sticky funciona en todos los browsers

**Commit:** `c786938`

### 5.5 Hero fixes
- Brand mark (logo CRUX watermark) eliminado
- Geo decoration (diamond nodes) eliminado
- Grid `3fr 2fr` → `display: block` (sin segunda columna)
- Italic "a tu medida real" wrapping: specificity bump del font-size rule para override global
- `svc-hero__bottom` márgenes negativos reseteados

### 5.6 Responsive breakpoints
- Breakpoint de colapso bajado de 1024px a 900px
- 1024px mantiene layout desktop comprimido (2-col, sidebar 280px)
- Nuevo intermediate 1100px con sidebar 300px

### 5.7 Logo restaurado
- `icono-crux-transparente.png` estaba borrado del disco (` D` en git status)
- `git checkout -- icono-crux-transparente.png` lo restauró
- Auditoría confirmó que era el ÚNICO archivo faltante

---

## 6. TRANSVERSALES — 3 ITERACIONES

### 6.1 Accordion con `<details>` (descartado)
- `<details>/<summary>` no soporta animación de altura
- Toggle binario, sin transición smooth
- Peek state roto al cerrar

### 6.2 Accordion custom (descartado)
- Replaced `<details>` con divs + JS controller
- Peek state con mask gradient
- Problemas: rAF timing para CSS specificity, cache del Preview MCP

### 6.3 Branch cards + expand inline (FINAL)
- 3 cards horizontales: Marca y contenido, Visibilidad y captación, Soporte y cumplimiento
- Click → panel expand debajo del grid con `max-height` transition
- Solo un panel abierto a la vez
- Card activa: triángulo CSS `::after`
- Items como mini-cards en grid responsive
- `initBranchCards()` en configurator.js

**Commits:** `079f445`, `c786938`, `fb9f2cd`

---

## 7. SECCIÓN "YA TENGO WEB" (PROC-OPS-003)

Basado en los SOPs internos (PROC-OPS-002 creación + PROC-OPS-003 modificación):
- Nueva sección `#ya-tengo-web` entre backdrop y transversales
- 6 cards: Mejora visual, Nuevas funcionalidades, Optimización SEO, Migración, Base de datos, Mantenimiento
- CTA: "Solicitar auditoría gratuita" → WhatsApp
- Oculta cuando track = consultoría

**Commit:** `3d5795c`

---

## 8. CTA PROCESO → CONFIGURADOR

En `index.html`, sección "Cómo trabajamos":
- Añadido CTA después del nodo "Resultados"
- Dos links: "Diseño web →" + "Consultoría digital →"
- Styled blanco/transparente sobre fondo navy
- CSS: `.flow-cta` flex centered con gap

**Commit:** `3d5795c`

---

## 9. TWO-TRACK SPLITTER (Web + Consultoría)

### 9.1 Splitter
- 2 cards premium después del hero con toggle
- Track "Web" (default): catálogo modular + configurador
- Track "Consultoría": 4 packs originales recuperados
- Divider vertical con motivo diamante
- Hover: card lifts + otra se atenúa (`opacity: 0.55` via `:has()`)
- Active: border accent + triángulo CSS

### 9.2 Track toggle (`initTrackSplitter()`)
- `data-track="web"` / `data-track="consultoria"` wrappers
- `history.replaceState` para hash (#web / #consultoria)
- Deep linking desde URL hash
- Legacy hash support (motor-de-reservas → consultoria)
- Drawer + "Ya tengo web" ocultos en track consultoría
- Transversal "Añadir" guard: auto-switch a web track

### 9.3 Consulting packs (recuperados)
- Motor de Reservas (Esencial 810€ / Pro 2.640€)
- Central de Operaciones (Pack único 990€)
- Facturación Digital (Esencial 520€ / Pro 1.210€)
- Control Comercial (Esencial 1.210€ / Pro 2.640€)
- Grid 2×2 desktop, 1-col mobile

### 9.4 SEO fix
- Track oculto usa `visibility: hidden; height: 0` en vez de `display: none`
- Googlebot puede indexar contenido de ambos tracks

### 9.5 Hero genérico
- "Web modular a tu medida real" → "Soluciones digitales a tu medida"
- Descripción y CTAs actualizados para ambos tracks

**Commits:** `1047234`, `0c738e9`

---

## 10. AUDITORÍA DE PUNTOS CIEGOS (9 fixes)

| # | Punto ciego | Fix |
|---|---|---|
| 1 | Homepage no menciona consultoría | Teaser reescrito con Web + Consultoría |
| 2 | Drawer visible en consulting | `sidebar.style.display = 'none'` |
| 3 | Transversal "Añadir" roto en consulting | Auto-switch a web track con toast |
| 4 | Google no indexa consulting | `visibility: hidden` en vez de `display: none` |
| 5 | Process CTA solo web | Dos links (web + consulting) |
| 6 | JSON-LD sin consulting | 4 packs añadidos al OfferCatalog (total 7) |
| 7 | "Ya tengo web" irrelevante en consulting | Oculto en track consultoría |
| 8 | CSS muerto | −309 líneas (geo, brand-mark, pack-detail, tier-card) + 3 images huérfanas |
| 9 | Sin memorias | 4 archivos guardados en `memory/` |

**Commit:** `0c738e9`

---

## 11. TEASERS HOMEPAGE INTERACTIVOS

### 11.1 Web showcase: "Card deck unfold"
- 3 cards en cascade diagonal con spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Default: tight overlapping deck con rotaciones (−1°, 0°, +0.5°)
- Hover: fan out dramático (−3°, scale 1.06, +3°) con shadow azul
- Scroll reveal: stagger slide-in desde derecha

### 11.2 Consulting showcase: "Floating pack-minis"
- 4 mini-cards en grid 2×2 con rotaciones continuas (`packFloat` keyframe)
- CSS individual `rotate` property (no en animation) para hover transitions smooth
- Hover: snap to grid + stagger lift + accent card glow
- Fix: `animation-play-state: paused` en hover en vez de `animation: none`

### 11.3 Panel "Elige tu camino"
- 4 bullets reemplazados por 2 path-cards con numbered circles accent
- Divider "o" → diamante rotado 45° (motivo de marca)
- Hover: translateX(5px) + border-left accent + flecha spring
- Armonizado con teasers: mismo gradient bg, hover lift, border treatment
- Scroll reveal: accent line scaleX(0→1) + paths stagger desde izquierda

### 11.4 Mobile + reduced motion
- `:active { scale(0.96) }` para touch feedback
- `@media (prefers-reduced-motion: reduce)`: all animations disabled

**Commit:** `d5605f0`

---

## 12. TEXTOS LEGALES

### 12.1 Páginas creadas
- **aviso-legal.html** (129 líneas): LSSI-CE Art. 10. Titular, NIF 49607038V, domicilio, condiciones de uso, propiedad intelectual (con excepción terceros), responsabilidad limitada, jurisdicción Palma
- **privacidad.html** (294 líneas): RGPD Arts. 13-14 + LOPDGDD. Responsable, datos por canal, tabla finalidad→base→conservación, destinatarios por rol (EmailJS Pte. Ltd. encargado, WhatsApp Ireland Limited responsable independiente, Google proveedor técnico), transferencias (DPF/SCC, NO consentimiento estructural), plazos diferenciados, derechos sin DNI obligatorio, AEPD + sede electrónica, Instagram, almacenamiento clarificado
- **cookies.html** (174 líneas): LSSI-CE Art. 22.2. Distingue cookies (ninguna) de recursos externos (Google Fonts, jsDelivr) de storage técnico exento (sessionStorage). Tabla de tecnologías similares

### 12.2 Correcciones por auditoría legal (15 hallazgos)

| ID | Sev. | Hallazgo | Acción |
|---|---|---|---|
| H-01 | Alta | Sin primera capa RGPD | Texto legal bajo cada formulario |
| H-02 | Alta | EmailJS Inc → Pte. Ltd. | Corregido |
| H-03 | Media-alta | WhatsApp genérico | WhatsApp Ireland Limited EEE |
| H-04 | Media-alta | Bases mezcladas | Tabla finalidad→base→conservación |
| H-05 | Media | Consentimiento transfers | DPF/SCC, no consentimiento |
| H-06 | Media | 5 años leads | Leads 12-24m, propuestas 3a, fiscal 4-6a |
| H-07 | Media | DNI siempre | "Dudas razonables" |
| H-08 | Media | Cookies impreciso | Recursos externos + storage exento |
| H-11 | Media | Sin IVA no junto a precios | Añadido en teasers + splitter |
| H-12 | Media | Configurador no vinculante | Disclaimer reforzado |
| H-14 | Baja-media | "Legal RGPD" ambiguo | "Soporte técnico-documental" |
| H-15 | Baja-media | Instagram no en privacidad | Sección añadida |
| H-16 | Baja-media | IP sin excepción terceros | Matizado + responsabilidad limitada |
| H-22 | Baja-media | "No almacenamos" misleading | Email/WhatsApp/admin clarificado |
| H-24 | Baja | AEPD sin sede electrónica | sedeagpd.gob.es añadido |

### 12.3 Footer
- Links legales añadidos a index.html + servicios.html + las 3 páginas legales
- CSS `.footer__legal` con hover accent

### 12.4 Sitemap
- 3 nuevas URLs con priority 0.3 y changefreq yearly

**Commits:** `e3f671c`, `a303933`

---

## 13. DECISIONES ESTRATÉGICAS TOMADAS

| Decisión | Elección | Contexto |
|---|---|---|
| Posicionamiento | Pivote web + conservar consultoría como secundaria | El catálogo modular reemplaza los 4 packs pero la consultoría vuelve como track |
| Precios públicos | Mixto: bases+M1/M2/M5 con "Desde X €", M3/M4/M6 sin precio | Módulos discovery requieren sesión previa |
| Discovery en total | Suman 0 + nota amarilla | Evita anclaje al mínimo |
| Descuento −10% | Conservador: más barato a full, caros con descuento | Da la estimación más baja |
| Cantidades transversales | Fijo en 1, sin input | Simplifica UI |
| Implementación | Monolítica (todo de una, sin checkpoints) | Maximiza contexto |
| Consultoría | Two-track splitter en una página (toggle) | No dos páginas separadas |
| Hero | Genérico "Soluciones digitales a tu medida" | Cubre ambos tracks |
| Proceso homepage | Mantener genérico (Diagnóstico/Plan/Implementación/Acompañamiento) | Es una condensación válida del PROC-OPS-002 |
| Hypercare | Solo interno, no en la web | Detalle operativo |

---

## 14. DOCUMENTOS INTERNOS PENDIENTES (no web)

| Documento | Contenido | Prioridad |
|---|---|---|
| RAT | Registro de Actividades de Tratamiento | Alta |
| DPA EmailJS | Aceptar/descargar DPA de EmailJS Pte. Ltd. | Alta |
| Política conservación/bloqueo | Tabla de retención por categoría | Alta |
| Análisis interés legítimo | LIA para respuesta consultas, conservación, comunicaciones | Media-alta |
| Procedimiento derechos | Canal, plazos, respuesta, registro | Media-alta |
| Protocolo brechas | Detección, 72h AEPD, comunicación, registro | Media-alta |
| Condiciones B2B | Alcance, pagos, revisiones, IP, soporte, cancelación | Media |
| Autoalojar Google Fonts | Descargar Jost+Montserrat, servir desde propio servidor | Media |
| Autoalojar EmailJS SDK | Descargar script, eliminar dependencia CDN | Media |

---

## 15. ARCHIVOS FINALES DEL PROYECTO

### Nuevos (creados en esta sesión):
- `assets/css/servicios.css` (1.699 líneas)
- `assets/js/configurator.js` (947 líneas)
- `assets/images/asesoria-bg-{960,1600}.webp` + fallback.jpeg
- `assets/images/page-bg-{960,1280,2048}.webp` + fallback.jpeg
- `assets/images/cta-bg.svg`
- `aviso-legal.html` (129 líneas)
- `privacidad.html` (294 líneas)
- `cookies.html` (174 líneas)

### Modificados significativamente:
- `servicios.html`: 745 líneas (reescrito ~80%)
- `index.html`: +142 líneas (teasers, panel, primera capa, footer)
- `assets/css/style.css`: 1.113 líneas cambiadas (limpieza CSS muerto + nuevos estilos)
- `sitemap.xml`: +20 líneas

### Eliminados:
- `assets/images/cta-bg-1600.webp` (17.8KB)
- `assets/images/cta-bg-960.webp` (7.8KB)
- `assets/images/cta-bg-fallback.jpeg` (67.5KB)

### CSS muerto eliminado (~309 líneas):
- `.svc-hero__geo`, `.svc-hero__node`, `.svc-hero__connector`
- `.svc-hero__brand-mark`
- `.pack-detail`, `.pack-detail--alt`, `.pack-detail__*`
- `.tier-card`, `.tier-card--pro`, `.tier-card--unique`, `.tier-card__*`
- `.pack-card`, `.pack-card__*`
- `.packs-overview`, `.packs-overview__*`

---

## 16. MEMORIAS GUARDADAS

Carpeta: `C:/Users/FRODEPC/.claude/projects/C--Coding-pan/memory/`

| Archivo | Contenido |
|---|---|
| `MEMORY.md` | Índice de los 4 archivos |
| `project_crux_positioning.md` | Dos líneas de servicio, catálogo modular, SOPs |
| `feedback_code_quality.md` | Implementación monolítica, commits en español |
| `user_profile.md` | Co-fundador CRUX, técnico, valora honestidad |
| `reference_brand_tokens.md` | Paleta, fuentes, patrones visuales, WhatsApp |

---

## 17. HERRAMIENTAS Y SCRIPTS CREADOS

- `scripts/generate-bg-variants.py`: genera variantes WebP/JPEG optimizadas desde imágenes fuente
- `.claude/launch.json`: configuración preview server (Python http.server, port 3001)

---

## 18. DATOS DE NEGOCIO EN CONTEXTO

### Titular
- Marc Andreu Rosselló, NIF 49607038V
- Polígon 2, Parcel·la 44, Sencelles (07140), Illes Balears
- +34 684 412 717 / marcandreu@cruxconsulting.es
- WhatsApp comercial: +34 692 447 491

### SOPs leídos
- PROC-OPS-002: Creación Web/Landing + SEO (6 fases, 11 páginas)
- PROC-OPS-003: Modificación Web / BBDD Existente (5 fases, 15 páginas)

### Catálogo xlsx leído
- `catalogo_modular_crux_2026_v3_1.xlsx` (10 hojas)
- Sistema de Precios, Bases B1-B3, Módulos M1-M6, Transversales, Combinaciones tipo

### Auditoría legal leída
- `auditoria_legal_cruxmallorca_ultra_detallada.pdf` (13 páginas, 24 hallazgos)
