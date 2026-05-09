# Iteración de la página Nosotros — diseño

**Fecha:** 2026-04-22
**Archivo objetivo:** `nosotros.html` (+ posibles ajustes en `assets/css/nosotros.css`)
**Estado actual del archivo:** untracked en git (nunca se ha commiteado)

---

## 1. Contexto

La página `nosotros.html` existe en el repo pero está sin commitear. Tiene 6 secciones (Hero, Manifiesto, Historia + métricas, Equipo, Filosofía, CTA) más footer. Varias contienen contenido placeholder, datos incorrectos o copy que se siente demasiado marketing-speak / agresivo.

Esta iteración corrige 4 secciones (Hero, Manifiesto, Historia, Equipo) y arregla datos erróneos que aparecen en varios sitios (año de fundación, tamaño de equipo).

## 2. Alcance

### Dentro de alcance
- Hero — heading principal + sidebar (año)
- Manifiesto — reescritura del texto
- Historia — métricas (cambio de 1 métrica + fixes de datos) + narrativa (polish mínima)
- Equipo — reestructuración del bento grid, placeholders de foto, info por card
- Datos estructurados (`schema.org`) — `foundingDate` y `numberOfEmployees`

### Fuera de alcance (no se tocan)
- Sección Filosofía (4 principios)
- CTA final (Diagnóstico gratuito + botones WhatsApp/Email)
- Nav / Footer / meta-tags (salvo las correcciones de datos ya listadas)
- Añadir secciones nuevas

### Aplazado (decisiones ya tomadas, pendiente de implementar en iteración futura)
- Énfasis de Mallorca: sidebar específico ("Palma de Mallorca"), coordenadas editoriales (`39°34′N · 2°39′E`), detalle geográfico en narrativa ("De Palma a Inca, de Manacor a Ibiza…"), micro-sección "Aquí trabajamos" con contorno de las Islas. Las 4 opciones quedan documentadas para retomar más adelante.

## 3. Decisiones por sección

### 3.1. Hero

**Heading principal** — sustituir la última palabra para salir del registro consultor.

| Antes | Después |
|---|---|
| El equipo detrás de tu *transformación.* | El equipo detrás de cada *proyecto.* |

La estructura tipográfica se mantiene: 3 líneas con la última palabra en italic/accent (misma clase `ns-hero__heading--accent`).

**Sidebar** — actualizar año.

| Antes | Después |
|---|---|
| Baleares, 2025 | Baleares, 2026 |

### 3.2. Manifiesto

**Reemplazar texto completo.**

| Antes | Después |
|---|---|
| "No vendemos tecnología. Estructuramos tu negocio con herramientas digitales y nos aseguramos de que tu equipo las use. Si no las usan, no sirve de nada." | "La parte complicada no es elegir la herramienta: es que tu equipo la use cada día. Por eso trabajamos con diseño, formación y acompañamiento — no solo implementación." |

**Tratamiento tipográfico del nuevo texto:**
- Quitar el uso actual de `.ns-manifesto__dim` — el nuevo texto no necesita dimming selectivo porque ya tiene ritmo propio (dos puntos + em-dash).
- Mantener el símbolo decorativo `"` de fondo (`.ns-manifesto__bg-mark`).
- Aplicar `<em>` sobre la frase "es que tu equipo la use cada día" (es la redefinición del problema, va marcada en italic).

### 3.3. Historia — métricas

Las 4 métricas del bloque `ns-story__metrics`:

| # | Métrica actual | Métrica nueva | Motivo |
|---|---|---|---|
| 1 | **2025** · Año de fundación | **2026** · Año de fundación | Dato incorrecto — CRUX se funda en 2026. `data-counter="2025"` → `data-counter="2026"`. |
| 2 | **5** · Personas en el equipo | **4** · Personas en el equipo | Dato incorrecto — son 4. `data-counter="5"` → `data-counter="4"`. |
| 3 | **Baleares** · Base de operaciones | Sin cambios | — |
| 4 | **100%** · Adopción como objetivo | **0€** · Diagnóstico inicial | La antigua es aspiracional (100% "como objetivo"). La nueva es pragmática: conecta con el CTA del final ("Diagnóstico gratuito"), dato real, sin pose. Quitar `data-counter="100"` y `data-suffix="%"` — el "0€" no necesita contador animado. |

### 3.4. Historia — narrativa

**Polish mínima** — 3 tweaks puntuales sobre el texto existente. No se reescribe.

Cambios:

1. Primer párrafo: "decenas de PYMEs" → "muchas PYMEs"
2. Tercer párrafo, primera frase: "CRUX nació en 2025 con una premisa **simple**" → "CRUX **nace** en 2026 con una premisa **clara**" (presente porque aún estamos dentro del año; "clara" suena menos cliché que "simple").
3. Tercer párrafo, cierre: reemplazar la coma + "porque" por em-dash: "Y después nos quedamos**, porque** el primer mes…" → "Y después nos quedamos **—** el primer mes…"

Texto final del tercer párrafo:

> "CRUX nace en 2026 con una premisa clara: no implementar nada que tu equipo no vaya a usar. Cada proyecto empieza con un diagnóstico, sigue con un plan concreto y termina con formación real. Y después nos quedamos — el primer mes es cuando más preguntas surgen."

### 3.5. Equipo — estructura

**Layout asimétrico: 1 card grande + 4 pequeñas = 5 tarjetas.**

- **Card grande** (izquierda, ocupa 2 filas): foto del equipo (los 4 juntos). Semánticamente equivalente a la actual `ns-team__card--lead`.
- **4 cards pequeñas** (en 2×2 a la derecha): cada miembro del equipo individualmente.

No se modifica el grid CSS. La `ns-team__card--lead` sigue existiendo en el mismo slot (izquierda, 2 filas) — solo cambia el contenido: antes era una persona (nombre + rol + bio), ahora es la foto del equipo + título genérico.

Conteo de cards antes y después:
- **Antes:** 5 cards = 1 lead (founder con bio) + 4 miembros sin bio.
- **Después:** 5 cards = 1 equipo (foto de grupo, sin bio) + 4 miembros individuales sin bio.

Por tanto el número total de cards es el mismo (5). El cambio es semántico, no estructural.

### 3.6. Equipo — placeholder de foto

**Silueta con blur.** 100% CSS, sin imágenes. Mientras no se suban las fotos reales, el contenedor de cada foto muestra:

- Fondo: color sólido `#2a3e57` (azul profundo, dentro de la paleta existente).
- Dos pseudo-elementos (`::before` + `::after`) con `filter: blur(8px)` para sugerir silueta humana:
  - `::before` — círculo (cabeza) en el tercio superior, `rgba(200,220,240,0.25)`.
  - `::after` — semicírculo (torso) abriéndose desde la parte inferior, `rgba(200,220,240,0.22)`.

**Card grande:** misma técnica pero con aspect ratio vertical `4/5` en vez de `1/1`, y las siluetas reducidas (`width:14%` aprox. para la cabeza) para sugerir "grupo" sin dibujar 4 figuras literales.

Cuando lleguen las fotos reales, se reemplaza cada placeholder por un `<img>` (o `<picture>` con `webp` + fallback `jpeg`, siguiendo el patrón del resto del sitio) en el mismo contenedor. Las reglas del placeholder pueden convivir con la imagen real (con `.ns-team__photo.has-image` desactivando los pseudos) o eliminarse cuando todas las fotos estén subidas. La estructura del grid no cambia en ninguno de los dos casos.

### 3.7. Equipo — info por card

**Nivel minimal** (tipo galería).

**Card grande (equipo):**
- Foto del equipo
- Título: "Equipo CRUX"
- Subtítulo: "4 personas · Mallorca"
- Sin bio ni tagline adicional.

**Cards pequeñas (individuales):**
- Foto individual
- Nombre (formato "Nombre Apellido" — pendiente del usuario)
- Rol (ej. "Estrategia", "Diseño", "Operaciones", "Tech" — pendiente del usuario)
- Sin bio, sin links a redes sociales.

Se elimina del HTML actual el párrafo `.ns-team__bio` que existe en la card lead (era "Placeholder para una breve descripción..."). Ya no hay bio en ninguna card.

### 3.8. Data fixes en `schema.org`

En el bloque `<script type="application/ld+json">` del `<head>`:

```diff
- "foundingDate": "2025",
+ "foundingDate": "2026",
  "areaServed": { "@type": "Place", "name": "Islas Baleares, España" },
- "numberOfEmployees": { "@type": "QuantitativeValue", "value": 5 }
+ "numberOfEmployees": { "@type": "QuantitativeValue", "value": 4 }
```

## 4. Contenido pendiente del usuario

Estos items no bloquean la implementación — se pueden meter con placeholders y reemplazar después:

- **4 nombres reales** + **4 roles reales** de los miembros del equipo (para las cards pequeñas).
- **4 fotos individuales** (formato cuadrado, al menos 400×400px).
- **1 foto de equipo** (formato vertical aprox. 4:5, al menos 800×1000px).

Mientras tanto, las cards muestran la silueta con blur como placeholder (ver 3.6) y nombres genéricos ("Persona 01", "Persona 02"…) o similar.

## 5. Archivos a modificar

- **`nosotros.html`** — todas las secciones listadas arriba + `schema.org`.
- **`assets/css/nosotros.css`** — ajustes mínimos:
  - Placeholder de foto (silueta con blur): nuevas reglas CSS para `.ns-team__photo`.
  - Si el cambio de contenido de la card lead (antes persona, ahora equipo) requiere ajuste de padding/aspect-ratio.

No se crean archivos nuevos. No se añaden dependencias JS.

## 6. No-alcance de mantenimiento

Esta iteración no incluye:
- Añadir counters animados para la nueva métrica "0€" (el "0" es estático, no necesita animación).
- Cambios en el CTA, Filosofía, Footer.
- Cambios en Hero: label "Sobre nosotros" o fondo cinematográfico.
- Cambios responsive más allá de lo que ya cubre `nosotros.css` (el grid 1+4 debería colapsar a stack en mobile con las reglas existentes).
