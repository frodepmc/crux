# Retenciones IRPF en `financial.html` — diseño

**Fecha:** 2026-05-18
**Archivo objetivo:** `admin/integrations/financial.html`
**Estado actual:** los movimientos llevan IVA (`m.iva`, `m.ivaDeducible`) y se liquida trimestralmente vía `ivaTrimestre()`. No existe modelado de retenciones IRPF.

---

## 1. Contexto

`financial.html` registra movimientos atómicos (ingresos, costes directos, OPEX) con base imponible y tipo de IVA. La función `ivaTrimestre(movs, year, t)` deriva `repercutido / soportado / soportadoNoDeducible / aLiquidar` y se renderiza en el panel "IVA Trimestral {año}" (modelo 303 simplificado).

Falta cubrir las **retenciones IRPF**: la SL retiene IRPF a profesionales/alquileres cuando paga (modelo 111), y a su vez puede sufrir retenciones cuando emite facturas a personas físicas o por rendimientos sometidos a retención. Pedro quiere paralelismo total con el patrón de IVA — mismo selector por fila, mismo panel trimestral derivado.

## 2. Alcance

### Dentro de alcance
- Schema: añadir campo `m.retencion` (number, default `0`) a cada movimiento.
- Constantes y helpers: `TIPOS_RETENCION`, `RETENCION_DEFAULT`, `calcRetencion()`, `retencionTrimestre()`.
- UI del row de movimiento: nueva columna "Ret." con selector compacto `0 / 7 / 15 / 19 %`.
- Header y footer de la tabla de movimientos: nueva columna + total de retenciones del periodo filtrado.
- Mov creation default: `retencion: 0` cuando se crea un nuevo movimiento.
- Panel "Retenciones IRPF Trimestral {año}" inmediatamente debajo del panel IVA, con el mismo lenguaje visual (4 boxes Q1-Q4, badge DERIVADO, saldo anual).

### Fuera de alcance
- Distinción mod. 111 (profesionales) vs mod. 115 (alquileres): se agrupa todo en un panel unificado.
- Toggle "se computa o no" análogo al `ivaDeducible`: el tipo `0 %` ya cubre el caso de "no aplica". Si el tipo es `>0`, siempre cuenta.
- Cálculo del neto cobrado/pagado (importe + IVA − retención) en la línea bajo el importe: se queda como está (sólo `c/IVA`). El detalle granular vive en el panel trimestral.
- Migración de movimientos existentes: los registros previos sin `m.retencion` se tratan como `0` vía `m.retencion == null ? 0 : m.retencion` (no se persiste backfill).
- Tab "Movimientos" y otros tabs distintos al del panel IVA: el panel nuevo se renderiza junto al panel IVA en su mismo tab.

## 3. Schema y constantes

Añadir bajo el bloque de IVA (línea ~948):

```js
/* Retenciones IRPF — tipos vigentes en España:
   0 % (no aplica), 7 % (profesionales primeros 2 años), 15 % (profesionales),
   19 % (alquileres, capital). Default 0 porque la mayoría de movimientos no
   llevan retención. Se aplica tanto a ingresos (cliente nos retiene → soportada)
   como a gastos a profesionales/alquileres (CRUX retiene → practicada).
   Si el tipo es 0, no se computa en la liquidación. */
const TIPOS_RETENCION = [0, 7, 15, 19];
const RETENCION_DEFAULT = 0;
function calcRetencion(importe, tipo) { return Number(importe || 0) * Number(tipo || 0) / 100; }
```

## 4. Cálculo trimestral

Función gemela a `ivaTrimestre()`, añadir justo debajo:

```js
/* Liquidación de retenciones por trimestre y año:
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
```

## 5. UI del row de movimiento

### 5.1. Grid

Pasar el `gridTemplateColumns` de 8 a 9 columnas en los **tres** sitios donde aparece (header línea 1409, row líneas 1112, footer línea 1446):

```
"120px 110px 150px 1fr 120px 130px 130px 90px 36px"
                                          ^^^^
                                          Ret.
```

### 5.2. Header (línea 1409–1418)

Añadir entre la celda `IVA · Ded.` y la última celda vacía:

```jsx
<span style={{ textAlign: "center" }} title="Retención IRPF (0 % = no aplica)">Ret.</span>
```

### 5.3. Selector en `MovimientoRow` (después del bloque IVA, línea ~1229)

Antes del botón Delete:

```js
/* Retención — selector de tipo IRPF (0/7/15/19 %) */
var retencionActual = m.retencion == null ? 0 : Number(m.retencion);
var retOpts = TIPOS_RETENCION.map(function(v) { return { value: String(v), label: v + " %" }; });
React.createElement("div", { style: { padding: "0 4px", display: "flex", justifyContent: "center" } },
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
)
```

Las filas con `retencion === 0` quedan atenuadas (opacity 0.5) para no llamar la atención visual — la mayoría estarán así.

### 5.4. Footer de totales (línea 1446–1458)

Añadir una celda con el total de retención del periodo filtrado, antes de la última celda vacía:

```js
var totalRet = filtrados.reduce(function(s, m) {
  if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return s;
  return s + calcRetencion(m.importe, m.retencion == null ? 0 : m.retencion);
}, 0);
```

```jsx
<div style={{ textAlign: "center" }}>
  {totalRet > 0
    ? <span title="Retención IRPF del periodo (todos los tipos seleccionados)" style={{ fontSize: 11, fontFamily: mono, color: C.textDim, fontWeight: 600 }}>−{fmt(Math.round(totalRet))}</span>
    : <span style={{ fontSize: 10, color: C.textDim }}>—</span>}
</div>
```

### 5.5. Mov creation default (línea 1317)

Añadir `retencion: RETENCION_DEFAULT` al objeto `nuevo`:

```js
var nuevo = { id: nuevoMovId(), fecha: fecha, tipo: tipo, categoria: (CATEGORIAS[tipo] && CATEGORIAS[tipo][0]) || "", concepto: "", importe: 0, cliente: "", iva: IVA_DEFAULT, retencion: RETENCION_DEFAULT };
```

## 6. Panel "Retenciones IRPF Trimestral {año}"

Renderizar inmediatamente después del bloque IVA (después de línea 2441), antes de "Cuentas por Cobrar". Estructura calcada del IVA con las diferencias listadas en la tabla 6.1 abajo.

Pseudocódigo del cálculo previo al render (se traduce a `React.createElement(Card, ...)` siguiendo el mismo patrón que el bloque IVA, líneas 2389–2441):

```js
{(function(){
  var trims = [0, 1, 2, 3].map(function(t) { return Object.assign({ q: t }, retencionTrimestre(movimientos, hoyAnyo, t)); });
  var trimActual = trimestreDeMes(hoyMes);
  var totalAnual = trims.reduce(function(a, t) {
    return { prac: a.prac + t.practicadas, sop: a.sop + t.soportadas, ing: a.ing + t.aIngresar };
  }, { prac: 0, sop: 0, ing: 0 });
  var hayDatos = totalAnual.prac > 0 || totalAnual.sop > 0;
  // Render Card con:
  //   - Título: "Retenciones IRPF Trimestral " + hoyAnyo + badge DERIVADO
  //   - Subtitle (a la derecha): "Practicadas (mod. 111) y soportadas (declaración anual)"
  //   - Si !hayDatos: empty state "Sin movimientos con retención este año."
  //   - Si hayDatos: grid de 4 boxes (uno por trimestre). Cada box muestra:
  //       línea 1: "Practicadas"   fmt(t.practicadas) + " €"
  //       línea 2 (solo si t.soportadas > 0):
  //                "Soportadas"     fmt(t.soportadas) + " €"  (en color textDim, fontStyle italic — informativo)
  //       separador horizontal
  //       línea 3: "A ingresar"   fmt(t.aIngresar) + " €"
  //                color: amber si >0, textDim si =0 (nunca verde — no hay devolución trimestral)
  //   - Footer (solo si hayDatos):
  //       izquierda: "Modelo 111 — retenciones IRPF a profesionales y alquileres.
  //                   Las soportadas (en ingresos) se recuperan en la declaración
  //                   anual del Impuesto de Sociedades, no compensan trimestralmente."
  //       derecha: "Saldo anual practicadas:" + fmt(totalAnual.prac) + " €"
})()}
```

### 6.1. Diferencias clave con el panel IVA

| Aspecto | Panel IVA | Panel Retenciones |
|---|---|---|
| Subtitle | "Repercutido − Soportado de los movimientos del trimestre" | "Practicadas (mod. 111) y soportadas (declaración anual)" |
| Línea 1 del Q | Repercutido | Practicadas |
| Línea 2 del Q | Soportado (−) | Soportadas (sin signo — no resta) |
| Línea 3 condicional | No deducible (si > 0) | — (no aplica) |
| Saldo del Q | A pagar / A devolver = rep − sop | A ingresar = practicadas (las soportadas NO restan) |
| Color del saldo | amber si >0, green si <0 | amber si >0, textDim si =0 (nunca negativo) |
| Footer | "Liquidación trimestral mod. 303" | "Modelo 111 — las soportadas se recuperan anualmente" |
| Saldo anual | rep − sop acumulado | sum(practicadas) acumulado |

### 6.2. Empty state

Si `totalAnual.prac === 0 && totalAnual.sop === 0`, mostrar "Sin movimientos con retención este año." (mismo patrón que IVA).

## 7. Notas fiscales

- Las retenciones **soportadas** (cliente retiene a CRUX al pagar una factura emitida) son comunes cuando CRUX factura a una empresa por servicios profesionales si tributa como persona física, o por rendimientos del capital. Para una SL es menos habitual pero el modelo lo soporta por simetría con el IVA.
- Las **practicadas** son lo relevante operativamente: CRUX retiene al pagar a autónomos (7 % primeros 2 años, 15 % general) y al pagar alquiler de oficina (19 %). El total trimestral se ingresa con el modelo 111 (profesionales) o 115 (alquileres) antes del día 20 del mes siguiente al cierre del trimestre.
- En la práctica: si el usuario crea un gasto de tipo `opex` con concepto "Alquiler oficina" e importe 1.000 €, debería marcar retención 19 % → `practicadas += 190 €` en ese Q.

## 8. Plan de pruebas

Verificar en Playwright o a ojo:

1. Crear un ingreso de 1.000 € con retención 15 %. Confirmar:
   - El selector de retención muestra `15 %` en la nueva columna.
   - El total c/IVA en la línea inferior del importe sigue mostrándose como antes (no se altera por retención).
   - El panel "Retenciones IRPF Trimestral" suma 150 € a "Soportadas" del Q correspondiente, y "A ingresar" sigue en 0 (las soportadas no cuentan).
2. Crear un OPEX de 1.000 € (alquiler) con retención 19 %. Confirmar:
   - "Practicadas" del Q suma 190 €.
   - "A ingresar" del Q = 190 €.
   - Saldo anual practicadas se incrementa.
3. Movimiento existente sin `m.retencion` (registros viejos): el selector muestra `0 %` y no afecta al panel.
4. Cambiar la retención de un movimiento de 0 % a 15 %: el panel se actualiza automáticamente (reactividad de React).
5. Eliminar un movimiento con retención: el panel se decrementa.
6. Filtrar la tabla por tipo "ingreso" o "coste_dir": el total de retención del footer refleja sólo lo filtrado, pero el panel trimestral mantiene la vista global del año.
7. El grid de 9 columnas no rompe el layout responsive (`min-width: 1180px` puede necesitar subir un poco — comprobar).
