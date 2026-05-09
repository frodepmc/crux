# Iteración Nosotros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar las decisiones del spec `2026-04-22-nosotros-iteracion-design.md` sobre `nosotros.html` y `assets/css/nosotros.css` — correcciones de datos (4 personas, 2026), rewrite del manifiesto, polish de Historia, reestructuración del Equipo con placeholder de silueta en CSS.

**Architecture:** Ediciones directas sobre dos archivos estáticos (HTML + CSS). Sin frameworks, sin build step, sin tests automatizados nuevos. Verificación = grep + vista previa en navegador.

**Tech Stack:** HTML5 + CSS3 vanilla, Python http.server para preview.

**Preview URL:** http://localhost:3001/nosotros.html (el servidor ya debería estar corriendo desde la fase de brainstorming; si no, relanzar con `python3 -m http.server 3001 --bind 0.0.0.0 &`).

**Archivos afectados:**
- `nosotros.html` (tasks 1-6)
- `assets/css/nosotros.css` (task 7)

**No se crean archivos nuevos. No se tocan archivos fuera de esos dos.**

---

## Task 1: Correcciones de datos (2026, 4 personas, schema.org)

**Files:**
- Modify: `nosotros.html` (schema.org block ~líneas 28-43, hero sidebar ~línea 106, métricas 1-2 ~líneas 143-152)

Cambios idénticos en 5 sitios (año 2025→2026 en 3 sitios, cantidad 5→4 en 2 sitios). Todo en un commit porque es una única clase de error (dato obsoleto).

- [ ] **Step 1: Verificar estado "antes" con grep**

```bash
cd /mnt/c/Coding/pan
grep -n '"foundingDate": "2025"' nosotros.html
grep -n '"value": 5' nosotros.html
grep -n 'Baleares, 2025' nosotros.html
grep -n 'data-counter="2025">2025' nosotros.html
grep -n 'data-counter="5">5' nosotros.html
```

Expected: cada comando devuelve exactamente 1 línea (5 aciertos totales).

- [ ] **Step 2: Editar `schema.org` — foundingDate**

Usar Edit con:
- old_string: `"foundingDate": "2025",`
- new_string: `"foundingDate": "2026",`

- [ ] **Step 3: Editar `schema.org` — numberOfEmployees**

Usar Edit con:
- old_string: `"numberOfEmployees": { "@type": "QuantitativeValue", "value": 5 }`
- new_string: `"numberOfEmployees": { "@type": "QuantitativeValue", "value": 4 }`

- [ ] **Step 4: Editar hero sidebar**

Usar Edit con:
- old_string: `<span class="ns-hero__sidebar-text">Baleares, 2025</span>`
- new_string: `<span class="ns-hero__sidebar-text">Baleares, 2026</span>`

- [ ] **Step 5: Editar métrica 1 (año)**

Usar Edit con:
- old_string: `<span class="ns-story__metric-value" data-counter="2025">2025</span>`
- new_string: `<span class="ns-story__metric-value" data-counter="2026">2026</span>`

- [ ] **Step 6: Editar métrica 2 (personas)**

Usar Edit con:
- old_string: `<span class="ns-story__metric-value" data-counter="5">5</span>`
- new_string: `<span class="ns-story__metric-value" data-counter="4">4</span>`

- [ ] **Step 7: Verificar que las 5 cadenas antiguas ya no existen**

```bash
cd /mnt/c/Coding/pan
! grep -q '"foundingDate": "2025"' nosotros.html && echo "OK schema foundingDate"
! grep -q '"value": 5' nosotros.html && echo "OK schema numberOfEmployees"
! grep -q 'Baleares, 2025' nosotros.html && echo "OK hero sidebar"
! grep -q 'data-counter="2025">2025' nosotros.html && echo "OK métrica año"
! grep -q 'data-counter="5">5' nosotros.html && echo "OK métrica personas"
```

Expected: 5 líneas "OK …".

- [ ] **Step 8: Verificar que las cadenas nuevas sí existen**

```bash
cd /mnt/c/Coding/pan
grep -q '"foundingDate": "2026"' nosotros.html && echo "OK foundingDate 2026"
grep -q '"value": 4' nosotros.html && echo "OK employees 4"
grep -q 'Baleares, 2026' nosotros.html && echo "OK sidebar 2026"
grep -q 'data-counter="2026">2026' nosotros.html && echo "OK métrica 2026"
grep -q 'data-counter="4">4' nosotros.html && echo "OK métrica 4"
```

Expected: 5 líneas "OK …".

- [ ] **Step 9: Verificación visual**

Abrir http://localhost:3001/nosotros.html. Revisar:
- Sidebar del hero a la derecha: "BALEARES, 2026" (vertical)
- Sección Historia (scroll hasta ~50% de la página): primera métrica "2026" (contador animado), segunda métrica "4".

- [ ] **Step 10: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "fix(nosotros): corrige año de fundación (2026) y tamaño del equipo (4)"
```

---

## Task 2: Hero heading

**Files:**
- Modify: `nosotros.html` (hero section ~líneas 98-102)

Cambio de la última palabra del heading + pequeño cambio de conectivo ("tu" → "cada").

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -n 'detrás de tu' nosotros.html
grep -n 'transformación\.' nosotros.html
```

Expected: 1 línea para cada grep.

- [ ] **Step 2: Editar la segunda línea del heading**

Usar Edit con:
- old_string: `<span class="hero-line"><span class="hero-line__inner">detrás de tu</span></span>`
- new_string: `<span class="hero-line"><span class="hero-line__inner">detrás de cada</span></span>`

- [ ] **Step 3: Editar la tercera línea del heading**

Usar Edit con:
- old_string: `<span class="hero-line"><span class="hero-line__inner ns-hero__heading--accent">transformación.</span></span>`
- new_string: `<span class="hero-line"><span class="hero-line__inner ns-hero__heading--accent">proyecto.</span></span>`

- [ ] **Step 4: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
! grep -q 'detrás de tu' nosotros.html && echo "OK 'detrás de tu' eliminado"
! grep -q 'transformación\.' nosotros.html && echo "OK 'transformación.' eliminado"
grep -q 'detrás de cada' nosotros.html && echo "OK 'detrás de cada' presente"
grep -q '>proyecto\.<' nosotros.html && echo "OK 'proyecto.' presente"
```

Expected: 4 líneas "OK …".

- [ ] **Step 5: Verificación visual**

Abrir http://localhost:3001/nosotros.html (scroll al top). El heading debe mostrar en 3 líneas:
- "El equipo"
- "detrás de cada"
- "proyecto." (la última palabra con accent azul `var(--accent)`, aplicado por la regla `.ns-hero__heading .hero-line:nth-child(3) .hero-line__inner`)

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "refactor(nosotros): reescribe hero heading — 'cada proyecto' vs 'tu transformación'"
```

---

## Task 3: Manifiesto (rewrite + typography)

**Files:**
- Modify: `nosotros.html` (manifiesto blockquote ~líneas 117-123)

Sustituir el blockquote entero. Nuevo texto con `<em>` sobre "es que tu equipo la use cada día". Se eliminan todas las `<span class="ns-manifesto__dim">` y el `<strong>` del cierre actual.

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -c 'ns-manifesto__dim' nosotros.html
grep -c 'No vendemos tecnología' nosotros.html
```

Expected: el primer grep devuelve 3 (una regla CSS + dos usos HTML — ignoraremos CSS, solo nos importa que el HTML baje a 0 después). El segundo devuelve 1.

- [ ] **Step 2: Reemplazar el blockquote**

Usar Edit con:

old_string:
```
            <blockquote class="ns-manifesto__quote reveal">
                <span class="ns-manifesto__dim">No vendemos tecnología.</span>
                Estructuramos tu negocio con herramientas digitales y nos aseguramos de que
                <em>tu equipo las use.</em>
                <span class="ns-manifesto__dim">Si no las usan,</span>
                <strong>no sirve de nada.</strong>
            </blockquote>
```

new_string:
```
            <blockquote class="ns-manifesto__quote reveal">
                La parte complicada no es elegir la herramienta:
                <em>es que tu equipo la use cada día.</em>
                Por eso trabajamos con diseño, formación y acompañamiento &mdash; no solo implementación.
            </blockquote>
```

Notas:
- Se usa `&mdash;` (em-dash entidad HTML) para evitar cualquier problema de encoding.
- Se eliminan los dos `<span class="ns-manifesto__dim">`.
- Se elimina el `<strong>` del cierre (el nuevo texto no necesita peso extra).
- El `<em>` cubre exactamente la frase que redefine el problema.

- [ ] **Step 3: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
! grep -q 'No vendemos tecnología' nosotros.html && echo "OK manifiesto viejo eliminado"
! grep -q 'ns-manifesto__dim".*' nosotros.html.md5-test-ignore 2>/dev/null; \
  test $(grep -c 'class="ns-manifesto__dim"' nosotros.html) -eq 0 && echo "OK ns-manifesto__dim ya no se usa en HTML"
grep -q 'La parte complicada no es elegir la herramienta' nosotros.html && echo "OK nuevo texto presente"
grep -q 'es que tu equipo la use cada día' nosotros.html && echo "OK frase em presente"
grep -q 'diseño, formación y acompañamiento' nosotros.html && echo "OK tríada presente"
```

Expected: 4 líneas "OK …". (La clase `.ns-manifesto__dim` sigue definida en el CSS — eso es intencional por si volvemos a usarla en el futuro. Lo que se verifica es que no se usa en HTML.)

- [ ] **Step 4: Verificación visual**

Abrir http://localhost:3001/nosotros.html, scroll a la sección "MANIFESTO". Debe verse:
- Símbolo decorativo `"` gigante de fondo en azul muy apagado (sigue, `.ns-manifesto__bg-mark`).
- El nuevo texto completo en el registro tipográfico grande (Jost, clamp(1.6rem, 3.8vw, 3.4rem)).
- La frase "es que tu equipo la use cada día" en color azul (`var(--accent)`) por la regla `.ns-manifesto__quote em { color: var(--accent) }`.
- Sin partes "apagadas" con `opacity: 0.6`.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "refactor(nosotros): reescribe manifiesto — menos agresivo, empieza por el problema"
```

---

## Task 4: Historia — narrativa (3 tweaks + tiempo verbal)

**Files:**
- Modify: `nosotros.html` (ns-story__body, ~líneas 137-139)

Polish mínima sobre los 3 párrafos de la narrativa. Cuatro cambios puntuales.

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -q 'decenas de PYMEs' nosotros.html && echo "presente: 'decenas'"
grep -q 'nació en 2025' nosotros.html && echo "presente: 'nació en 2025'"
grep -q 'premisa simple' nosotros.html && echo "presente: 'premisa simple'"
grep -q 'quedamos, porque' nosotros.html && echo "presente: 'quedamos, porque'"
```

Expected: 4 líneas "presente: …".

- [ ] **Step 2: Tweak 1 — "decenas" → "muchas"**

Usar Edit con:
- old_string: `<p>Vimos decenas de PYMEs en Baleares pagar por herramientas digitales que nadie usaba. CRMs vacíos, webs que no convertían, automatizaciones que nadie entendía.</p>`
- new_string: `<p>Vimos a muchas PYMEs en Baleares pagar por herramientas digitales que nadie usaba. CRMs vacíos, webs que no convertían, automatizaciones que nadie entendía.</p>`

- [ ] **Step 3: Tweak 2 — "nació en 2025 con una premisa simple" → "nace en 2026 con una premisa clara"**

Usar Edit con:
- old_string: `CRUX nació en 2025 con una premisa simple:`
- new_string: `CRUX nace en 2026 con una premisa clara:`

- [ ] **Step 4: Tweak 3 — cierre con em-dash**

Usar Edit con:
- old_string: `Y después nos quedamos, porque el primer mes es cuando más preguntas surgen.`
- new_string: `Y después nos quedamos &mdash; el primer mes es cuando más preguntas surgen.`

- [ ] **Step 5: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
! grep -q 'decenas de PYMEs' nosotros.html && echo "OK 'decenas' eliminado"
! grep -q 'nació en 2025' nosotros.html && echo "OK 'nació en 2025' eliminado"
! grep -q 'premisa simple' nosotros.html && echo "OK 'premisa simple' eliminado"
! grep -q 'quedamos, porque' nosotros.html && echo "OK 'quedamos, porque' eliminado"
grep -q 'a muchas PYMEs' nosotros.html && echo "OK 'muchas PYMEs' presente"
grep -q 'nace en 2026 con una premisa clara' nosotros.html && echo "OK 'nace en 2026 … premisa clara' presente"
grep -q 'quedamos &mdash; el primer mes' nosotros.html && echo "OK em-dash presente"
```

Expected: 7 líneas "OK …".

- [ ] **Step 6: Verificación visual**

Abrir http://localhost:3001/nosotros.html, scroll a Historia. El párrafo final debe leer: "CRUX nace en 2026 con una premisa clara: no implementar nada…". El cierre debe mostrar `—` (em-dash renderizado) entre "quedamos" y "el primer mes".

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "refactor(nosotros): pulido de la narrativa de Historia (tiempo presente, em-dash)"
```

---

## Task 5: Historia — 4ª métrica (100% → 0€)

**Files:**
- Modify: `nosotros.html` (4ª métrica, ~líneas 158-162)

Reemplazar la métrica aspiracional "100% · Adopción como objetivo" por "0€ · Diagnóstico inicial". Quitar los atributos `data-counter` y `data-suffix` porque el valor es estático (no hay animación de contador sobre "0€").

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -n 'data-counter="100"' nosotros.html
grep -n 'Adopción como objetivo' nosotros.html
```

Expected: 1 línea cada uno.

- [ ] **Step 2: Reemplazar el bloque de la 4ª métrica**

Usar Edit con:

old_string:
```
                    <div class="ns-story__metric">
                        <span class="ns-story__metric-value" data-counter="100" data-suffix="%">100%</span>
                        <span class="ns-story__metric-rule" aria-hidden="true"></span>
                        <span class="ns-story__metric-label">Adopción como objetivo</span>
                    </div>
```

new_string:
```
                    <div class="ns-story__metric">
                        <span class="ns-story__metric-value">0€</span>
                        <span class="ns-story__metric-rule" aria-hidden="true"></span>
                        <span class="ns-story__metric-label">Diagnóstico inicial</span>
                    </div>
```

Notas:
- Desaparecen `data-counter` y `data-suffix` (el contador animado no tiene sentido sobre "0€" — de 0 a 0 no anima nada).
- El `<span>` sigue con `.ns-story__metric-value` — misma tipografía grande.

- [ ] **Step 3: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
! grep -q 'data-counter="100"' nosotros.html && echo "OK counter 100 eliminado"
! grep -q 'Adopción como objetivo' nosotros.html && echo "OK label viejo eliminado"
grep -q '>0€<' nosotros.html && echo "OK '0€' presente"
grep -q '>Diagnóstico inicial<' nosotros.html && echo "OK label nuevo presente"
```

Expected: 4 líneas "OK …".

- [ ] **Step 4: Verificación visual**

Abrir http://localhost:3001/nosotros.html, sección Historia. La 4ª métrica del bloque derecho (debajo de "Baleares") debe leer:
- Valor grande en azul: `0€`
- Línea decorativa
- Label MAYÚSCULAS: `DIAGNÓSTICO INICIAL`

Comprobar que el contador animado del `data-counter` YA NO se dispara sobre esta métrica (antes animaba de 0 a 100). El `0€` aparece estático al cargar la sección.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "refactor(nosotros): sustituye métrica aspiracional '100%' por '0€ · Diagnóstico inicial'"
```

---

## Task 6: Equipo — reestructurar HTML de las 5 cards

**Files:**
- Modify: `nosotros.html` (5 `<article class="ns-team__card...">`, ~líneas 180-229)

Cambios:

**Card 1 (lead, la grande):**
- Cambiar `<h3>` de "Nombre Apellido" → "Equipo CRUX"
- Cambiar `<p class="ns-team__role">` de "Co-founder & Estrategia" → "4 personas · Mallorca"
- Eliminar `<p class="ns-team__bio">` completo
- Eliminar el `<svg class="ns-team__photo-icon">` (el placeholder nuevo es 100% CSS)

**Cards 2-5 (pequeñas):**
- Renombrar nombres de "Nombre Apellido" → "Persona 01", "Persona 02", "Persona 03", "Persona 04"
- Cambiar roles a "Estrategia", "Diseño", "Operaciones", "Tech" (placeholders hasta que el usuario los llene)
- Eliminar el `<svg class="ns-team__photo-icon">` en cada una

El contenedor `<div class="ns-team__photo ns-team__photo--N">` se mantiene vacío — las reglas CSS (task 7) dibujan la silueta con pseudo-elementos.

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -c 'ns-team__photo-icon' nosotros.html
grep -c 'Nombre Apellido' nosotros.html
grep -c 'ns-team__bio' nosotros.html
```

Expected: 5, 5, 1.

- [ ] **Step 2: Reemplazar la card lead (card 1)**

Usar Edit con:

old_string:
```
                <article class="ns-team__card ns-team__card--lead reveal">
                    <div class="ns-team__photo ns-team__photo--1">
                        <svg class="ns-team__photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Nombre Apellido</h3>
                        <p class="ns-team__role">Co-founder & Estrategia</p>
                        <p class="ns-team__bio">Placeholder para una breve descripción del rol y la persona en el equipo.</p>
                    </div>
                </article>
```

new_string:
```
                <article class="ns-team__card ns-team__card--lead reveal">
                    <div class="ns-team__photo ns-team__photo--1" aria-hidden="true"></div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Equipo CRUX</h3>
                        <p class="ns-team__role">4 personas · Mallorca</p>
                    </div>
                </article>
```

- [ ] **Step 3: Reemplazar card 2 (Persona 01 · Estrategia)**

Usar Edit con:

old_string:
```
                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--2">
                        <svg class="ns-team__photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Nombre Apellido</h3>
                        <p class="ns-team__role">Rol en el equipo</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--3">
                        <svg class="ns-team__photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Nombre Apellido</h3>
                        <p class="ns-team__role">Rol en el equipo</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--4">
                        <svg class="ns-team__photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Nombre Apellido</h3>
                        <p class="ns-team__role">Rol en el equipo</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--5">
                        <svg class="ns-team__photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Nombre Apellido</h3>
                        <p class="ns-team__role">Rol en el equipo</p>
                    </div>
                </article>
```

new_string:
```
                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--2" aria-hidden="true"></div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Persona 01</h3>
                        <p class="ns-team__role">Estrategia</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--3" aria-hidden="true"></div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Persona 02</h3>
                        <p class="ns-team__role">Diseño</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--4" aria-hidden="true"></div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Persona 03</h3>
                        <p class="ns-team__role">Operaciones</p>
                    </div>
                </article>

                <article class="ns-team__card reveal">
                    <div class="ns-team__photo ns-team__photo--5" aria-hidden="true"></div>
                    <div class="ns-team__info">
                        <h3 class="ns-team__name">Persona 04</h3>
                        <p class="ns-team__role">Tech</p>
                    </div>
                </article>
```

- [ ] **Step 4: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
test $(grep -c 'ns-team__photo-icon' nosotros.html) -eq 0 && echo "OK SVGs eliminados"
test $(grep -c 'Nombre Apellido' nosotros.html) -eq 0 && echo "OK 'Nombre Apellido' eliminado"
test $(grep -c 'ns-team__bio' nosotros.html) -eq 0 && echo "OK '.ns-team__bio' eliminado del HTML"
grep -q '>Equipo CRUX<' nosotros.html && echo "OK lead es 'Equipo CRUX'"
grep -q '>4 personas · Mallorca<' nosotros.html && echo "OK role lead"
grep -q '>Persona 01<' nosotros.html && echo "OK Persona 01"
grep -q '>Persona 02<' nosotros.html && echo "OK Persona 02"
grep -q '>Persona 03<' nosotros.html && echo "OK Persona 03"
grep -q '>Persona 04<' nosotros.html && echo "OK Persona 04"
test $(grep -c 'ns-team__photo--[1-5]' nosotros.html) -eq 5 && echo "OK 5 photo placeholders"
```

Expected: 10 líneas "OK …".

- [ ] **Step 5: Verificación visual (preliminar)**

Abrir http://localhost:3001/nosotros.html, scroll al Equipo. Ahora mismo la sección se ve "rota" — los contenedores de foto están vacíos (sin SVG) y las reglas CSS actuales (gradient circular) siguen activas pero sin contenido dentro. Esto es temporal: task 7 añade la silueta con blur.

Lo que sí debe verse correcto:
- 5 cards (1 grande a la izquierda, 4 pequeñas en 2×2 a la derecha en desktop).
- Card grande muestra "Equipo CRUX" + "4 personas · Mallorca".
- Cards pequeñas: "Persona 01 · Estrategia", "Persona 02 · Diseño", "Persona 03 · Operaciones", "Persona 04 · Tech".
- Los círculos/óvalos grises/azulados de las fotos siguen visibles (gradients existentes) pero vacíos por dentro.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/Coding/pan
git add nosotros.html
git commit -m "refactor(nosotros): reestructura bento del Equipo — card grande = equipo, resto = individuales"
```

---

## Task 7: Equipo — CSS del placeholder (silueta con blur)

**Files:**
- Modify: `assets/css/nosotros.css` (sección `/* Photo placeholders */`, ~líneas 377-405)

Reemplazar las reglas actuales de `.ns-team__photo`, `.ns-team__photo--1` ... `--5` y `.ns-team__photo-icon` por un nuevo sistema basado en pseudo-elementos que dibujan la silueta con blur sobre un fondo sólido. El estilo uniforma los 5 placeholders (`--1` deja de tener gradient propio porque la card grande se diferencia solo por `aspect-ratio` via el selector `.ns-team__card--lead .ns-team__photo`).

- [ ] **Step 1: Estado "antes"**

```bash
cd /mnt/c/Coding/pan
grep -c 'ns-team__photo--' assets/css/nosotros.css
grep -q 'border-radius: 50%;' assets/css/nosotros.css && grep -B1 -A1 'border-radius: 50%' assets/css/nosotros.css | head -3
grep -q 'ns-team__photo-icon' assets/css/nosotros.css && echo "regla SVG icon presente"
```

Expected: primer grep ~5-6 líneas (una por cada `--N` + posibles menciones en media queries), la regla `.ns-team__photo-icon` existe.

- [ ] **Step 2: Reemplazar el bloque de reglas del photo**

Usar Edit con:

old_string:
```
/* Photo placeholders — each with unique gradient */
.ns-team__photo {
    width: clamp(80px, 9vw, 110px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.2rem;
    transition: transform 0.5s var(--ease-out), box-shadow 0.4s ease;
}

.ns-team__card:hover .ns-team__photo {
    transform: scale(1.06);
    box-shadow: 0 8px 28px rgba(56, 105, 171, 0.15);
}

.ns-team__photo--1 { background: linear-gradient(145deg, rgba(56, 105, 171, 0.1) 0%, rgba(120, 183, 238, 0.18) 100%); border: 1.5px solid rgba(56, 105, 171, 0.15); }
.ns-team__photo--2 { background: linear-gradient(145deg, rgba(30, 58, 95, 0.08) 0%, rgba(56, 105, 171, 0.14) 100%); border: 1.5px solid rgba(30, 58, 95, 0.12); }
.ns-team__photo--3 { background: linear-gradient(145deg, rgba(78, 130, 180, 0.08) 0%, rgba(120, 183, 238, 0.15) 100%); border: 1.5px solid rgba(78, 130, 180, 0.12); }
.ns-team__photo--4 { background: linear-gradient(145deg, rgba(56, 105, 171, 0.06) 0%, rgba(44, 84, 120, 0.14) 100%); border: 1.5px solid rgba(56, 105, 171, 0.1); }
.ns-team__photo--5 { background: linear-gradient(145deg, rgba(44, 84, 120, 0.08) 0%, rgba(120, 183, 238, 0.12) 100%); border: 1.5px solid rgba(44, 84, 120, 0.1); }

.ns-team__photo-icon {
    width: 34%;
    height: 34%;
    color: var(--accent);
    opacity: 0.35;
}
```

new_string:
```
/* Photo placeholders — silueta con blur sobre fondo azul profundo.
   100% CSS (pseudo-elementos), sin imágenes. Cuando lleguen las fotos reales
   se añade un <img> dentro del contenedor y estas reglas quedan ocultas por él. */
.ns-team__photo {
    width: 100%;
    max-width: clamp(120px, 14vw, 180px);
    aspect-ratio: 1 / 1;
    border-radius: 4px;
    background: #2a3e57;
    position: relative;
    overflow: hidden;
    margin-bottom: 1.2rem;
    transition: transform 0.5s var(--ease-out), box-shadow 0.4s ease;
}

.ns-team__photo::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 38%;
    width: 38%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background: rgba(200, 220, 240, 0.25);
    transform: translate(-50%, -50%);
    filter: blur(8px);
}

.ns-team__photo::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 70%;
    height: 55%;
    border-radius: 50% 50% 0 0;
    background: rgba(200, 220, 240, 0.22);
    transform: translate(-50%, -30%);
    filter: blur(6px);
}

.ns-team__card:hover .ns-team__photo {
    transform: scale(1.04);
    box-shadow: 0 8px 28px rgba(19, 37, 60, 0.25);
}

/* Lead card: foto vertical con siluetas más tenues — sugiere grupo */
.ns-team__card--lead .ns-team__photo {
    max-width: clamp(180px, 26vw, 320px);
    aspect-ratio: 4 / 5;
}

.ns-team__card--lead .ns-team__photo::before {
    width: 14%;
    top: 32%;
    filter: blur(10px);
}

.ns-team__card--lead .ns-team__photo::after {
    width: 30%;
    left: 42%;
    filter: blur(10px);
}
```

Notas:
- Los selectores `.ns-team__photo--1` hasta `--5` se eliminan del CSS — ya no hay gradientes distintos por card. Las clases siguen en el HTML (no molestan) por si en el futuro se quiere recuperar diferenciación.
- `.ns-team__photo-icon` se elimina también (ya no hay SVG en el HTML).
- Shape pasa de círculo (`border-radius: 50%`) a rectángulo con esquinas suaves (`border-radius: 4px`) — la silueta funciona mejor sobre fondo rectangular.
- `max-width` en lugar de `width` porque el contenedor puede crecer en la card lead.

- [ ] **Step 3: Verificar cadenas**

```bash
cd /mnt/c/Coding/pan
! grep -q 'ns-team__photo-icon' assets/css/nosotros.css && echo "OK regla icon eliminada"
! grep -q 'ns-team__photo--1 {' assets/css/nosotros.css && echo "OK gradient --1 eliminado"
! grep -q 'ns-team__photo--5 {' assets/css/nosotros.css && echo "OK gradient --5 eliminado"
grep -q 'background: #2a3e57' assets/css/nosotros.css && echo "OK fondo silueta"
grep -q '.ns-team__photo::before' assets/css/nosotros.css && echo "OK ::before silueta"
grep -q '.ns-team__photo::after' assets/css/nosotros.css && echo "OK ::after silueta"
grep -q '.ns-team__card--lead .ns-team__photo::before' assets/css/nosotros.css && echo "OK lead ::before"
grep -q 'aspect-ratio: 4 / 5' assets/css/nosotros.css && echo "OK lead aspect ratio"
```

Expected: 8 líneas "OK …".

- [ ] **Step 4: Verificación visual en navegador**

Abrir http://localhost:3001/nosotros.html. En la sección Equipo:
- **Card grande** (izquierda): rectángulo vertical (4:5) con fondo azul oscuro `#2a3e57`, con una sutil forma difusa (silueta difuminada, poco visible — da sensación de "grupo velado").
- **4 cards pequeñas**: cuadrados con el mismo azul oscuro, cada uno con la silueta más visible (círculo-cabeza en el tercio superior + semi-círculo-torso saliendo del borde inferior, ambos con blur).
- Hover: la foto hace scale(1.04) y shadow azul oscura.
- No hay bordes circulares, no hay SVG icons, no hay gradients de colores variables.

Probar en mobile (DevTools responsive, ≤768px) que los 5 cards siguen apilándose correctamente (el grid pasa a 1fr 1fr por `@media max-width:1100px` + más tarde a una columna por otros breakpoints — ambas reglas existentes).

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Coding/pan
git add assets/css/nosotros.css
git commit -m "style(nosotros): placeholder de foto con silueta + blur (CSS puro)"
```

---

## Task 8: Smoke test final + reporte

**Files:** Ninguno (solo verificación).

- [ ] **Step 1: Smoke test completo con grep**

```bash
cd /mnt/c/Coding/pan

echo "=== Task 1: datos correctos ==="
grep -q '"foundingDate": "2026"' nosotros.html && echo "  [OK] schema.org foundingDate"
grep -q '"value": 4' nosotros.html && echo "  [OK] schema.org numberOfEmployees"
grep -q 'Baleares, 2026' nosotros.html && echo "  [OK] hero sidebar"
grep -q 'data-counter="2026"' nosotros.html && echo "  [OK] métrica año"
grep -q 'data-counter="4"' nosotros.html && echo "  [OK] métrica personas"

echo "=== Task 2: hero heading ==="
grep -q 'detrás de cada' nosotros.html && echo "  [OK] 'detrás de cada' presente"
grep -q '>proyecto\.<' nosotros.html && echo "  [OK] 'proyecto.' presente"

echo "=== Task 3: manifiesto ==="
grep -q 'La parte complicada no es elegir la herramienta' nosotros.html && echo "  [OK] nuevo manifiesto"
grep -q 'es que tu equipo la use cada día' nosotros.html && echo "  [OK] frase em"

echo "=== Task 4: historia narrativa ==="
grep -q 'a muchas PYMEs' nosotros.html && echo "  [OK] muchas PYMEs"
grep -q 'nace en 2026 con una premisa clara' nosotros.html && echo "  [OK] nace en 2026 + premisa clara"
grep -q 'quedamos &mdash; el primer mes' nosotros.html && echo "  [OK] em-dash"

echo "=== Task 5: 4ª métrica ==="
grep -q '>0€<' nosotros.html && echo "  [OK] 0€"
grep -q '>Diagnóstico inicial<' nosotros.html && echo "  [OK] Diagnóstico inicial"

echo "=== Task 6: equipo HTML ==="
test $(grep -c 'ns-team__photo-icon' nosotros.html) -eq 0 && echo "  [OK] SVGs fuera"
test $(grep -c 'ns-team__bio' nosotros.html) -eq 0 && echo "  [OK] bios fuera"
grep -q '>Equipo CRUX<' nosotros.html && echo "  [OK] card lead = equipo"
test $(grep -c '>Persona 0[1-4]<' nosotros.html) -eq 4 && echo "  [OK] 4 personas placeholder"

echo "=== Task 7: equipo CSS ==="
grep -q '.ns-team__photo::before' assets/css/nosotros.css && echo "  [OK] silueta CSS"
grep -q 'aspect-ratio: 4 / 5' assets/css/nosotros.css && echo "  [OK] lead vertical"
```

Expected: 20 líneas "[OK] …" en total. Si alguna falta, volver a la task correspondiente.

- [ ] **Step 2: Verificación visual completa (navegador)**

Abrir http://localhost:3001/nosotros.html. Recorrer la página de arriba abajo y confirmar:

1. **Hero:** heading "El equipo / detrás de cada / proyecto." — última palabra en azul. Sidebar derecha vertical: "BALEARES, 2026".
2. **Manifiesto:** nuevo texto completo. La frase "es que tu equipo la use cada día" en azul. Sin partes "atenuadas".
3. **Historia:** narrativa empieza con "Vimos a muchas PYMEs…", termina con em-dash "nos quedamos — el primer mes…". Métricas: `2026` / `4` / `Baleares` / `0€`.
4. **Equipo:** 1 card grande (izquierda, rectángulo vertical azul oscuro con silueta muy sutil, título "Equipo CRUX · 4 personas · Mallorca") + 4 cards pequeñas en 2×2 (cuadradas, cada una con silueta cabeza+torso, título "Persona 01..04" + rol).
5. **Filosofía:** sin cambios (4 principios sobre fondo oscuro).
6. **CTA:** sin cambios ("Diagnóstico gratuito. ¿Empezamos?").
7. **Footer:** sin cambios.

- [ ] **Step 3: Verificación responsive (DevTools mobile)**

Abrir DevTools, activar responsive mode. Probar breakpoints:
- **1100px:** el bento del equipo cambia a 2 columnas, lead card pasa arriba span-all.
- **900px:** la historia pasa a 1 columna, las métricas a 2×2.
- **768px:** hero compacto (sidebar oculto), bento 1fr 1fr.
- **480px:** métricas a 1 columna, cards del equipo con padding reducido.

Comprobar que ningún breakpoint rompe (text overflow, cards con aspect ratio roto, etc.).

- [ ] **Step 4: Verificación schema.org**

Abrir `view-source:http://localhost:3001/nosotros.html` (o ver el HTML entregado), buscar el bloque `<script type="application/ld+json">`. Debe contener `"foundingDate": "2026"` y `"numberOfEmployees": { "@type": "QuantitativeValue", "value": 4 }`.

Opcional: pegar el JSON-LD en https://validator.schema.org/ para confirmar que valida.

- [ ] **Step 5: Log de git limpio**

```bash
cd /mnt/c/Coding/pan
git log --oneline -10
```

Expected: los 7 commits de esta iteración, en orden cronológico inverso — el último "style(nosotros): placeholder de foto con silueta + blur (CSS puro)", y antes los otros 6. Las líneas tras esos 7 son commits preexistentes.

- [ ] **Step 6: No hay commit final de "chore"**

No se necesita un commit adicional aquí — cada task ya commiteó lo suyo. Si se quiere un tag o merge, se hace fuera del plan.

---

## Notas de mantenimiento post-implementación

**Lo que queda pendiente del usuario (no bloquea la implementación del plan):**
- Subir la foto de equipo (formato aprox. 4:5 vertical, ej. `assets/images/equipo-crux.webp` + fallback `.jpeg`).
- Subir 4 fotos individuales (cuadradas, ej. `assets/images/equipo-persona-01.webp` …).
- Sustituir los nombres "Persona 01..04" y roles placeholder por los reales.
- Decidir si el énfasis de Mallorca (aplazado en el spec) se incorpora en una iteración posterior.

**Cuando lleguen las fotos reales:**
En el HTML, dentro de cada `<div class="ns-team__photo ns-team__photo--N">` añadir un `<img>` (o `<picture>` con `webp`+`jpeg` fallback siguiendo el patrón del resto del sitio). Ejemplo:

```html
<div class="ns-team__photo ns-team__photo--2" aria-hidden="true">
    <img src="/assets/images/equipo-persona-01.webp" alt="" width="400" height="400" loading="lazy">
</div>
```

Y añadir una regla CSS para que la imagen cubra el contenedor y oculte las siluetas:

```css
.ns-team__photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.ns-team__photo:has(img)::before,
.ns-team__photo:has(img)::after {
    display: none;
}
```

Esto es un follow-up separado, no parte de este plan.
