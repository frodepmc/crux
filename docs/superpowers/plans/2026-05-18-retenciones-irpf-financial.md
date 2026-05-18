# Retenciones IRPF en `financial.html` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir soporte de retenciones IRPF (`0/7/15/19 %`) a `admin/integrations/financial.html`: schema por movimiento, función `retencionTrimestre()`, nueva columna "Ret." en la tabla de movimientos, total de retenciones en el footer y panel "Retenciones IRPF Trimestral" inmediatamente debajo del panel IVA existente. Spec: `docs/superpowers/specs/2026-05-18-retenciones-irpf-financial-design.md`.

**Architecture:** Ediciones directas sobre un único single-page con React 18 + Babel CDN. Sin build, sin tests automáticos. Verificación = grep + lectura + Playwright (screenshot + interacción manual). Cada task es un commit independiente y deja la app funcionando.

**Tech Stack:** HTML + React 18 UMD + `@babel/standalone` + ApexCharts. Servidor estático Python http.server :3000. Playwright MCP para verificación visual.

**Preview URL:** http://localhost:3000/admin/integrations/financial.html

**Nota sobre auth:** el panel admin redirige a `/admin/` si no hay sesión. Para verificación visual el usuario humano debe loguearse una vez en su navegador antes de comprobar cada task. La sesión persiste entre tasks.

**Archivos afectados:**
- `admin/integrations/financial.html` (todas las tasks)

No se crean archivos nuevos. No se tocan otros archivos.

---

## Task 1: Constantes y helper `calcRetencion`

**Files:**
- Modify: `admin/integrations/financial.html` (justo después del bloque de IVA, ~línea 951)

- [ ] **Step 1: Verificar estado actual**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "TIPOS_IVA\|calcIVA\|TIPOS_RETENCION\|calcRetencion" admin/integrations/financial.html
```

Expected output (líneas pueden variar ±5):
```
948:    const TIPOS_IVA = [0, 4, 10, 21];
950:    function calcIVA(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }
951:    function calcTotalConIVA(importe, tipo) { return Number(importe || 0) + calcIVA(importe, tipo); }
1107:      var ivaOpts = TIPOS_IVA.map(function(v) { return { value: String(v), label: v + " %" }; });
1442:                    return s + calcIVA(m.importe, m.iva == null ? IVA_DEFAULT : m.iva);
1444:                  }, 0);
```

`TIPOS_RETENCION` y `calcRetencion` no deben aparecer aún.

- [ ] **Step 2: Insertar las constantes inmediatamente después de `calcTotalConIVA`**

Usa `Edit` sobre `admin/integrations/financial.html`.

`old_string`:
```
    function calcIVA(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }
    function calcTotalConIVA(importe, tipo) { return Number(importe || 0) + calcIVA(importe, tipo); }
    /* Trimestre (0-3) de un mes (0-11): T1=Ene-Mar, T2=Abr-Jun, T3=Jul-Sep, T4=Oct-Dic */
```

`new_string`:
```
    function calcIVA(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }
    function calcTotalConIVA(importe, tipo) { return Number(importe || 0) + calcIVA(importe, tipo); }

    /* Retenciones IRPF — tipos vigentes en España:
       0 % (no aplica), 7 % (profesionales primeros 2 años), 15 % (profesionales),
       19 % (alquileres, capital). Default 0 porque la mayoría de movimientos no
       llevan retención. Se aplica tanto a ingresos (cliente nos retiene → soportada)
       como a gastos a profesionales/alquileres (CRUX retiene → practicada).
       Si el tipo es 0, no se computa en la liquidación. */
    const TIPOS_RETENCION = [0, 7, 15, 19];
    const RETENCION_DEFAULT = 0;
    function calcRetencion(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }

    /* Trimestre (0-3) de un mes (0-11): T1=Ene-Mar, T2=Abr-Jun, T3=Jul-Sep, T4=Oct-Dic */
```

- [ ] **Step 3: Verificar que las constantes están bien insertadas**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "TIPOS_RETENCION\|RETENCION_DEFAULT\|calcRetencion" admin/integrations/financial.html
```

Expected:
```
[línea]:    const TIPOS_RETENCION = [0, 7, 15, 19];
[línea]:    const RETENCION_DEFAULT = 0;
[línea]:    function calcRetencion(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }
```

- [ ] **Step 4: Smoke-check de carga del archivo**

Navega en Playwright a `http://localhost:3000/admin/integrations/financial.html`. Tras login (si redirige), confirma que la página carga sin errores en consola (`browser_console_messages`). Buscar `0 errors`.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): constantes y helper de retención IRPF

TIPOS_RETENCION, RETENCION_DEFAULT y calcRetencion siguiendo el
mismo patrón que el bloque de IVA.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Función `retencionTrimestre`

**Files:**
- Modify: `admin/integrations/financial.html` (justo después de `ivaTrimestre`, ~línea 977)

- [ ] **Step 1: Localizar `ivaTrimestre`**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -nE "function (iva|retencion)Trimestre" admin/integrations/financial.html
```

Expected:
```
[línea]:    function ivaTrimestre(movs, year, trimestre) {
```

`retencionTrimestre` no debe existir aún.

- [ ] **Step 2: Insertar `retencionTrimestre` después del cierre de `ivaTrimestre`**

`old_string`:
```
      return { repercutido: rep, soportado: sop, soportadoNoDeducible: sopNoDeducible, aLiquidar: rep - sop };
    }

    /* Helpers: parsear fecha ISO + utilidades de derivación */
```

`new_string`:
```
      return { repercutido: rep, soportado: sop, soportadoNoDeducible: sopNoDeducible, aLiquidar: rep - sop };
    }

    /* Liquidación de retenciones IRPF por trimestre y año:
       practicadas = sum(retención de costes_dir + opex con retencion > 0)
                     — lo que CRUX retiene al pagar profesionales/alquileres.
                     Se ingresa en Hacienda trimestralmente (mod. 111 / 115).
       soportadas  = sum(retención de ingresos con retencion > 0)
                     — lo que el cliente retiene a CRUX. Se recupera en la
                     declaración anual del IS, NO compensa trimestralmente.
       aIngresar   = practicadas (lo que realmente se paga al cierre de Q). */
    function retencionTrimestre(movs, year, trimestre) {
      var meses = mesesDeTrimestre(trimestre);
      var practicadas = 0, soportadas = 0;
      movs.forEach(function(m) {
        var p = parseFechaISO(m.fecha);
        if (!p || p.year !== year || meses.indexOf(p.month) === -1) return;
        var tipoRet = m.retencion == null ? 0 : Number(m.retencion);
        if (tipoRet <= 0) return;
        var retMov = calcRetencion(m.importe, tipoRet);
        if (m.tipo === "ingreso") soportadas += retMov;
        else if (m.tipo === "coste_dir" || m.tipo === "opex") practicadas += retMov;
      });
      return { practicadas: practicadas, soportadas: soportadas, aIngresar: practicadas };
    }

    /* Helpers: parsear fecha ISO + utilidades de derivación */
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "function retencionTrimestre" admin/integrations/financial.html
```

Debe imprimir una sola línea.

- [ ] **Step 4: Smoke-check en navegador**

Recarga `http://localhost:3000/admin/integrations/financial.html`. Sin errores en consola. La tabla y los paneles existentes siguen renderizándose.

En la consola del navegador:
```js
retencionTrimestre([{fecha: "2026-04-15", tipo: "coste_dir", importe: 1000, retencion: 15}], 2026, 1)
// Esperado: { practicadas: 150, soportadas: 0, aIngresar: 150 }
```

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): retencionTrimestre — liquidación por Q de IRPF

Función gemela a ivaTrimestre. Practicadas (gastos a profesionales)
suman al modelo 111. Soportadas (en ingresos) son informativas — se
recuperan en la declaración anual, no compensan trimestralmente.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Default `retencion: 0` al crear movimientos nuevos

**Files:**
- Modify: `admin/integrations/financial.html` (~línea 1317, dentro de `TabMovimientos`)

- [ ] **Step 1: Localizar el objeto `nuevo`**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "nuevoMovId()\|var nuevo = {" admin/integrations/financial.html
```

Buscar la línea con `var nuevo = { id: nuevoMovId(), ...`.

- [ ] **Step 2: Añadir `retencion: RETENCION_DEFAULT`**

`old_string`:
```
        var nuevo = { id: nuevoMovId(), fecha: fecha, tipo: tipo, categoria: (CATEGORIAS[tipo] && CATEGORIAS[tipo][0]) || "", concepto: "", importe: 0, cliente: "", iva: IVA_DEFAULT };
```

`new_string`:
```
        var nuevo = { id: nuevoMovId(), fecha: fecha, tipo: tipo, categoria: (CATEGORIAS[tipo] && CATEGORIAS[tipo][0]) || "", concepto: "", importe: 0, cliente: "", iva: IVA_DEFAULT, retencion: RETENCION_DEFAULT };
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "retencion: RETENCION_DEFAULT" admin/integrations/financial.html
```

Debe imprimir una sola línea.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): default retencion=0 en mov creation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Grid de 9 columnas + header de columna "Ret."

Tres ediciones del mismo `gridTemplateColumns` (header, row, footer) + 1 nuevo `<span>` en el header. Todo va en un commit para no romper el layout en pasos intermedios.

**Files:**
- Modify: `admin/integrations/financial.html`
  - Header de tabla (~línea 1409)
  - `MovimientoRow` (~línea 1112)
  - Footer de tabla (~línea 1446)

- [ ] **Step 1: Verificar los 3 sitios donde aparece el grid actual**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -nE 'gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 36px"' admin/integrations/financial.html
```

Expected: 3 matches (líneas ~1112, ~1409, ~1446).

- [ ] **Step 2: Header — cambiar grid y añadir `<span>Ret.</span>`**

`old_string`:
```
                <div style={{ display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 36px", gap: 0, padding: "12px 18px", borderBottom: "1px solid " + C.border, background: C.surfaceHover, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                  <span>Fecha</span>
                  <span>Tipo</span>
                  <span>Categoría</span>
                  <span>Concepto</span>
                  <span>Cliente</span>
                  <span style={{ textAlign: "right" }}>Importe (base)</span>
                  <span style={{ textAlign: "center" }} title="Tipo de IVA + flag deducible (gastos)">IVA · Ded.</span>
                  <span></span>
                </div>
```

`new_string`:
```
                <div style={{ display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px", gap: 0, padding: "12px 18px", borderBottom: "1px solid " + C.border, background: C.surfaceHover, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                  <span>Fecha</span>
                  <span>Tipo</span>
                  <span>Categoría</span>
                  <span>Concepto</span>
                  <span>Cliente</span>
                  <span style={{ textAlign: "right" }}>Importe (base)</span>
                  <span style={{ textAlign: "center" }} title="Tipo de IVA + flag deducible (gastos)">IVA · Ded.</span>
                  <span style={{ textAlign: "center" }} title="Retención IRPF (0 % = no aplica)">Ret.</span>
                  <span></span>
                </div>
```

- [ ] **Step 3: `MovimientoRow` — cambiar el grid del row**

`old_string`:
```
      return React.createElement("div", { className: "crux-row", style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 36px", gap: 0, padding: "8px 18px", borderBottom: idx < total - 1 ? "1px solid " + C.border : "none", alignItems: "center" } },
```

`new_string`:
```
      return React.createElement("div", { className: "crux-row", style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px", gap: 0, padding: "8px 18px", borderBottom: idx < total - 1 ? "1px solid " + C.border : "none", alignItems: "center" } },
```

- [ ] **Step 4: Footer de la tabla — cambiar el grid**

`old_string`:
```
                  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 36px", gap: 0, padding: "12px 18px", borderTop: "2px solid " + C.border, background: C.surfaceHover, alignItems: "center" } },
```

`new_string`:
```
                  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px", gap: 0, padding: "12px 18px", borderTop: "2px solid " + C.border, background: C.surfaceHover, alignItems: "center" } },
```

- [ ] **Step 5: Verificar que ya no queda ningún grid de 8 cols**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -nE 'gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 36px"' admin/integrations/financial.html
```

Expected: ningún match.

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -nE 'gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px"' admin/integrations/financial.html
```

Expected: 3 matches.

- [ ] **Step 6: Verificación visual con Playwright**

Navega a `http://localhost:3000/admin/integrations/financial.html` (recarga). Ve al tab "Movimientos". Toma `browser_take_screenshot` y comprueba que:
- El header de la tabla tiene la nueva columna "RET." entre "IVA · DED." y la columna vacía.
- Cada fila tiene una celda vacía nueva donde irá el selector (paso siguiente).
- El footer no rompe el alineamiento.

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): columna 'Ret.' en la tabla de movimientos (estructura)

Grid de 8 → 9 columnas en header, row y footer. Añade el header
'Ret.' (selector y total se rellenan en commits siguientes).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Selector de retención en `MovimientoRow`

**Files:**
- Modify: `admin/integrations/financial.html` (`MovimientoRow`, justo antes del botón Delete, ~línea 1230)

- [ ] **Step 1: Localizar el bloque Delete**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "Delete — doble clic para confirmar" admin/integrations/financial.html
```

Expected: una línea (comentario al inicio del bloque del botón).

- [ ] **Step 2: Insertar el selector de retención antes del bloque Delete**

`old_string`:
```
        ),
        /* Delete — doble clic para confirmar (sin modal nativo) */
        React.createElement("button", {
          onClick: function() { if (armado) { removeMov(m.id); } else { setArmado(true); } },
```

`new_string`:
```
        ),
        /* Retención — selector de tipo IRPF (0/7/15/19 %). Atenuado si tipo = 0. */
        (function() {
          var retencionActual = m.retencion == null ? 0 : Number(m.retencion);
          var retOpts = TIPOS_RETENCION.map(function(v) { return { value: String(v), label: v + " %" }; });
          return React.createElement("div", { style: { padding: "0 4px", display: "flex", justifyContent: "center", alignItems: "center" } },
            React.createElement(SelectField, {
              value: String(retencionActual),
              onChange: function(v) { updateMov(m.id, "retencion", Number(v)); },
              options: retOpts,
              size: "xs",
              ariaLabel: "Tipo de retención IRPF",
              chevronColor: C.textDim,
              style: {
                background: "transparent",
                borderColor: "transparent",
                color: retencionActual > 0 ? C.textSec : C.textDim,
                opacity: retencionActual > 0 ? 1 : 0.5,
                fontWeight: 600,
                fontSize: 10,
                fontFamily: mono,
                width: "100%",
              }
            })
          );
        })(),
        /* Delete — doble clic para confirmar (sin modal nativo) */
        React.createElement("button", {
          onClick: function() { if (armado) { removeMov(m.id); } else { setArmado(true); } },
```

- [ ] **Step 3: Verificar el insert**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "ariaLabel: \"Tipo de retención IRPF\"" admin/integrations/financial.html
```

Expected: una línea.

- [ ] **Step 4: Verificación visual con Playwright**

Recarga `http://localhost:3000/admin/integrations/financial.html`. En el tab Movimientos:
- Cada fila tiene un selector pequeño "0 %" atenuado en la columna "RET.".
- Cambia el de una fila a "15 %": el color pasa a más visible (textSec, opacity 1).
- Crea un movimiento nuevo: aparece con "0 %" por defecto.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): selector de retención IRPF por movimiento

SelectField compacto 0/7/15/19 % en cada fila. Atenuado cuando
el tipo es 0 (la mayoría de movimientos).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Total de retención en el footer de la tabla

**Files:**
- Modify: `admin/integrations/financial.html` (footer de la tabla, ~línea 1442–1457)

- [ ] **Step 1: Localizar el bloque del footer**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "var totalIVA = filtrados.reduce" admin/integrations/financial.html
```

Expected: una línea.

- [ ] **Step 2: Añadir el cálculo de `totalRet` y la nueva celda del footer**

`old_string`:
```
                  var totalIVA = filtrados.reduce(function(s, m) {
                    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return s;
                    return s + calcIVA(m.importe, m.iva == null ? IVA_DEFAULT : m.iva);
                  }, 0);
                  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px", gap: 0, padding: "12px 18px", borderTop: "2px solid " + C.border, background: C.surfaceHover, alignItems: "center" } },
                    React.createElement("span", { style: { gridColumn: "1 / 6", fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 } },
                      "Total " + (vistaAnual ? "año " + selAnyo : MESES_NOMBRE[selMes] + " " + selAnyo) + " · " + (filtroTipo === "todos" ? "todos los tipos" : TIPO_LABEL[filtroTipo])
                    ),
                    React.createElement("div", { style: { textAlign: "right" } },
                      React.createElement("div", { style: { fontSize: 14, fontFamily: mono, fontWeight: 700, color: C.white } }, fmt(Math.round(totalBase)) + " €"),
                      totalIVA > 0 ? React.createElement("div", { style: { fontSize: 9, fontFamily: mono, color: C.textDim, marginTop: 2 } }, fmt(Math.round(totalBase + totalIVA)) + " € c/IVA") : null
                    ),
                    React.createElement("div", { style: { textAlign: "center" } },
                      totalIVA > 0 ? React.createElement("span", { title: "IVA del periodo (todos los tipos seleccionados)", style: { fontSize: 11, fontFamily: mono, color: C.textDim, fontWeight: 600 } }, "+" + fmt(Math.round(totalIVA))) : React.createElement("span", { style: { fontSize: 10, color: C.textDim } }, "—")
                    ),
                    React.createElement("span", null)
                  );
```

`new_string`:
```
                  var totalIVA = filtrados.reduce(function(s, m) {
                    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return s;
                    return s + calcIVA(m.importe, m.iva == null ? IVA_DEFAULT : m.iva);
                  }, 0);
                  var totalRet = filtrados.reduce(function(s, m) {
                    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return s;
                    return s + calcRetencion(m.importe, m.retencion == null ? 0 : m.retencion);
                  }, 0);
                  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "120px 110px 150px 1fr 120px 130px 130px 90px 36px", gap: 0, padding: "12px 18px", borderTop: "2px solid " + C.border, background: C.surfaceHover, alignItems: "center" } },
                    React.createElement("span", { style: { gridColumn: "1 / 6", fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 } },
                      "Total " + (vistaAnual ? "año " + selAnyo : MESES_NOMBRE[selMes] + " " + selAnyo) + " · " + (filtroTipo === "todos" ? "todos los tipos" : TIPO_LABEL[filtroTipo])
                    ),
                    React.createElement("div", { style: { textAlign: "right" } },
                      React.createElement("div", { style: { fontSize: 14, fontFamily: mono, fontWeight: 700, color: C.white } }, fmt(Math.round(totalBase)) + " €"),
                      totalIVA > 0 ? React.createElement("div", { style: { fontSize: 9, fontFamily: mono, color: C.textDim, marginTop: 2 } }, fmt(Math.round(totalBase + totalIVA)) + " € c/IVA") : null
                    ),
                    React.createElement("div", { style: { textAlign: "center" } },
                      totalIVA > 0 ? React.createElement("span", { title: "IVA del periodo (todos los tipos seleccionados)", style: { fontSize: 11, fontFamily: mono, color: C.textDim, fontWeight: 600 } }, "+" + fmt(Math.round(totalIVA))) : React.createElement("span", { style: { fontSize: 10, color: C.textDim } }, "—")
                    ),
                    React.createElement("div", { style: { textAlign: "center" } },
                      totalRet > 0 ? React.createElement("span", { title: "Retención IRPF del periodo (todos los tipos seleccionados)", style: { fontSize: 11, fontFamily: mono, color: C.textDim, fontWeight: 600 } }, "−" + fmt(Math.round(totalRet))) : React.createElement("span", { style: { fontSize: 10, color: C.textDim } }, "—")
                    ),
                    React.createElement("span", null)
                  );
```

- [ ] **Step 3: Verificar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "var totalRet = filtrados.reduce" admin/integrations/financial.html
```

Expected: una línea.

- [ ] **Step 4: Verificación visual**

Recarga. En el tab Movimientos:
- Cuando ningún movimiento del periodo tiene retención > 0: la celda muestra "—".
- Cambia un movimiento a 15 % de retención: la celda del footer muestra "−{importe}" en mono dim.
- Cambia el filtro de tipo: el total respeta el filtro (igual que el total de IVA).

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): total de retención en el footer de movimientos

Suma de la retención del periodo filtrado, igual que ya se hace
con el IVA. Aparece atenuada cuando no hay movimientos con retención.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Panel "Retenciones IRPF Trimestral {año}"

Se renderiza inmediatamente después del bloque IVA, antes de "Cuentas por Cobrar".

**Files:**
- Modify: `admin/integrations/financial.html` (después del cierre del bloque IVA, ~línea 2441)

- [ ] **Step 1: Localizar el cierre del bloque IVA y la apertura de Cuentas por Cobrar**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "IVA trimestral del año en curso\|Cuentas por Cobrar (estático" admin/integrations/financial.html
```

Expected: dos comentarios (apertura del bloque IVA y comentario del bloque Cuentas por Cobrar).

- [ ] **Step 2: Insertar el bloque del panel de retenciones**

`old_string`:
```
          {/* ── Cuentas por Cobrar (estático, a día de hoy) ── */}
```

`new_string`:
```
          {/* ── Retenciones IRPF trimestrales del año en curso ── */}
          {(function(){
            var trims = [0, 1, 2, 3].map(function(t) { return Object.assign({ q: t }, retencionTrimestre(movimientos, hoyAnyo, t)); });
            var trimActual = trimestreDeMes(hoyMes);
            var totalAnual = trims.reduce(function(a, t) { return { prac: a.prac + t.practicadas, sop: a.sop + t.soportadas, ing: a.ing + t.aIngresar }; }, { prac: 0, sop: 0, ing: 0 });
            var hayDatos = totalAnual.prac > 0 || totalAnual.sop > 0;
            return React.createElement(Card, { style: { marginBottom: 16 } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                  React.createElement(CardLabel, null, "Retenciones IRPF Trimestral " + hoyAnyo),
                  React.createElement("span", { style: { fontSize: 8, color: C.accent, background: C.accentGlow, padding: "2px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 } }, "DERIVADO")
                ),
                React.createElement("span", { style: { fontSize: 11, color: C.textDim, fontStyle: "italic" } }, "Practicadas (mod. 111) y soportadas (declaración anual)")
              ),
              !hayDatos ? React.createElement("div", { style: { padding: "20px 0", textAlign: "center", fontSize: 11, color: C.textDim } }, "Sin movimientos con retención este año.") :
              React.createElement("div", { className: "crux-grid-4", style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 } },
                trims.map(function(t) {
                  var esActual = t.q === trimActual;
                  var color = t.aIngresar > 0 ? C.amber : C.textDim;
                  return React.createElement("div", { key: t.q, style: { background: esActual ? C.accentGlow : "rgba(255,255,255,0.02)", borderRadius: 8, padding: "14px 14px", borderLeft: "3px solid " + (esActual ? C.accent : C.border) } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 } },
                      React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: esActual ? C.accent2 : C.textSec, letterSpacing: 0.4 } }, "Q" + (t.q + 1)),
                      esActual ? React.createElement("span", { style: { fontSize: 8, color: C.accent, background: "rgba(56,105,171,0.18)", padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.4 } }, "ACTUAL") : null
                    ),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0" } },
                      React.createElement("span", { style: { fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.3 } }, "Practicadas"),
                      React.createElement("span", { style: { fontSize: 11, fontFamily: mono, color: C.text } }, fmt(Math.round(t.practicadas)) + " €")
                    ),
                    t.soportadas > 0 ? React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0 3px" }, title: "Retención que clientes nos practican al pagar — se recupera en la declaración anual del IS, no compensa trimestralmente" },
                      React.createElement("span", { style: { fontSize: 8, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.3, fontStyle: "italic" } }, "Soportadas"),
                      React.createElement("span", { style: { fontSize: 10, fontFamily: mono, color: C.textDim, fontStyle: "italic" } }, fmt(Math.round(t.soportadas)) + " €")
                    ) : null,
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0 0", marginTop: 6, borderTop: "1px solid " + C.border } },
                      React.createElement("span", { style: { fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.3 } }, "A ingresar"),
                      React.createElement("span", { style: { fontSize: 14, fontFamily: mono, fontWeight: 700, color: color } }, (t.aIngresar > 0 ? "+" : "") + fmt(Math.round(t.aIngresar)) + " €")
                    )
                  );
                })
              ),
              hayDatos ? React.createElement("div", { style: { paddingTop: 12, borderTop: "1px solid " + C.border, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 10, color: C.textDim, fontStyle: "italic" } }, "Modelo 111 — retenciones IRPF a profesionales/alquileres. Las soportadas se recuperan en la declaración anual."),
                React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "baseline" } },
                  React.createElement("span", { style: { fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 } }, "Saldo anual practicadas:"),
                  React.createElement("span", { style: { fontSize: 14, fontFamily: mono, fontWeight: 700, color: totalAnual.prac > 0 ? C.amber : C.textDim } }, (totalAnual.prac > 0 ? "+" : "") + fmt(Math.round(totalAnual.prac)) + " €")
                )
              ) : null
            );
          })()}

          {/* ── Cuentas por Cobrar (estático, a día de hoy) ── */}
```

- [ ] **Step 3: Verificar la inserción**

```bash
cd /mnt/c/codigo/Crux/pan/pan && grep -n "Retenciones IRPF Trimestral\|Retenciones IRPF trimestrales del año en curso" admin/integrations/financial.html
```

Expected: dos matches (comentario y CardLabel).

- [ ] **Step 4: Verificación visual**

Recarga. En el tab donde está el panel IVA (KPIs, o el que corresponda):
- El nuevo panel "Retenciones IRPF Trimestral 2026" aparece justo debajo del IVA.
- Sin movimientos con retención: muestra "Sin movimientos con retención este año."
- Tras añadir un coste_dir 1.000 € fecha 2026-04-15 con retención 15 %: Q2 muestra "Practicadas 150 €" y "A ingresar +150 €" en amber.
- Tras añadir un ingreso 1.000 € fecha 2026-04-15 con retención 15 %: Q2 muestra también "Soportadas 150 €" (gris italic), y "A ingresar" sigue siendo 150 € (las soportadas no restan).
- El saldo anual practicadas refleja el acumulado.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/codigo/Crux/pan/pan && git add admin/integrations/financial.html
git commit -m "$(cat <<'EOF'
feat(fin): panel 'Retenciones IRPF Trimestral'

Calcado del panel de IVA pero con la diferencia fiscal de que las
soportadas no compensan trimestralmente — A ingresar = practicadas.
Footer aclara el modelo 111 y la recuperación anual de soportadas.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Verificación final end-to-end

Smoke test completo del comportamiento. Si algo falla, abrir issue/follow-up y no marcar la task como completada hasta resolver.

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Recargar `http://localhost:3000/admin/integrations/financial.html` en Playwright**

Toma `browser_take_screenshot` del estado inicial (sin retenciones).

- [ ] **Step 2: Smoke test desde el navegador**

En el tab Movimientos, año 2026, mes Abril:

1. Crear movimiento: tipo `coste_dir`, importe `1000`, concepto "Asesor fiscal", retención `15 %`.
2. Crear movimiento: tipo `ingreso`, importe `2000`, concepto "Servicios", retención `7 %`.
3. Crear movimiento: tipo `opex`, importe `800`, concepto "Alquiler oficina", retención `19 %`.

Esperado en el panel "Retenciones IRPF Trimestral 2026", box Q2:
- Practicadas: `150 + 152 = 302 €` (15% de 1000 + 19% de 800)
- Soportadas: `140 €` (7% de 2000)
- A ingresar: `+302 €` (amber)

Saldo anual practicadas: `+302 €`.

- [ ] **Step 3: Smoke test del footer de la tabla**

Con los 3 movimientos creados arriba, en vista "Mensual" Abril 2026, filtro "todos":
- El total de retención del footer debe mostrar `−442 €` (302 + 140).

Cambiar filtro a "ingreso": debe mostrar `−140 €`.
Cambiar filtro a "coste_dir": debe mostrar `−150 €`.

- [ ] **Step 4: Smoke test de borrado**

Eliminar el ingreso de 2.000 €. El panel actualiza:
- Soportadas Q2 desaparece (vuelve a 0, no se muestra la línea).
- Practicadas Q2 sigue en `302 €`.

- [ ] **Step 5: Limpiar los movimientos de prueba**

Eliminar los 3 movimientos creados durante la verificación.

- [ ] **Step 6: Confirmar estado limpio**

Snapshot final. Panel "Retenciones IRPF Trimestral 2026" vuelve a mostrar "Sin movimientos con retención este año." (a menos que ya hubiera datos reales del usuario).

- [ ] **Step 7: Commit final si quedó algún ajuste de polish** (opcional — si no hay nada que cambiar, saltar)

```bash
cd /mnt/c/codigo/Crux/pan/pan && git status
# Si hay diffs no deseados, git checkout -- admin/integrations/financial.html para limpiar
```
