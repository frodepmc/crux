// views/TimelineView.js
// Vista Timeline: barras horizontales por daterange, eje de días, flechas SVG entre
// items conectados por el column de tipo 'dependency'.
//
// Configuración:
//   meta.views.timeline.columnId  → columna daterange a usar (fallback: primera daterange).
//   La columna 'dependency' se busca automáticamente (primera del board).

import { html } from 'htm/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../hooks.js';
import { applyFilters } from '../filters.js';

const DAY_PX = 28;  // ancho por día
const LABEL_PX = 220;

function ymdToDate(ymd) { if (!ymd) return null; const d = new Date(ymd + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
function dateToYmd(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function diffDays(a, b) { return Math.round((b - a) / 86400000); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtMonth(d) { return d.toLocaleDateString('es-ES', { month: 'short' }); }

function findTimelineColumn(meta) {
    const explicit = meta.views?.timeline?.columnId;
    if (explicit) {
        const c = meta.columns.find((x) => x.id === explicit);
        if (c && c.type === 'daterange') return c;
    }
    return meta.columns.find((c) => c.type === 'daterange') || null;
}

function findDependencyColumn(meta) {
    return meta.columns.find((c) => c.type === 'dependency') || null;
}

export function TimelineView({ store }) {
    const state = useStore(store);
    const { meta, itemIndex, itemsById } = state;
    const scrollerRef = useRef(null);
    const [scrollX, setScrollX] = useState(0);

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;
    const dateCol = findTimelineColumn(meta);
    if (!dateCol) {
        return html`
            <div class="b-empty">
                Este board no tiene columna de tipo <code>daterange</code>.<br/>
                Añade una y configura <code>meta.views.timeline.columnId</code>.
            </div>
        `;
    }
    const depCol = findDependencyColumn(meta);

    const prefs = store.getBoardPrefs();
    const allItems = itemIndex.map((entry) => itemsById[entry.id]).filter(Boolean);
    const items = applyFilters(allItems, { filters: prefs.filters, search: prefs.search });
    const rangedItems = items
        .map((it) => {
            const v = it.cells?.[dateCol.id];
            if (!v || !v.start || !v.end) return null;
            const s = ymdToDate(v.start);
            const e = ymdToDate(v.end);
            if (!s || !e) return null;
            return { item: it, start: s, end: e };
        })
        .filter(Boolean);

    if (rangedItems.length === 0) {
        return html`<div class="b-empty">Sin items con rango de fechas para mostrar en Timeline.</div>`;
    }

    // Rango temporal a mostrar: min start - 3 días, max end + 3 días
    const minDate = new Date(Math.min(...rangedItems.map((r) => r.start.getTime())));
    const maxDate = new Date(Math.max(...rangedItems.map((r) => r.end.getTime())));
    const startD = addDays(minDate, -3);
    const endD = addDays(maxDate, 3);
    const totalDays = diffDays(startD, endD) + 1;
    const totalWidth = totalDays * DAY_PX + LABEL_PX;

    // Render ticks (uno por día; marcamos inicio de mes)
    const ticks = [];
    for (let i = 0; i < totalDays; i += 1) {
        const d = addDays(startD, i);
        ticks.push({
            d,
            isMonthStart: d.getDate() === 1,
            label: d.getDate() === 1 ? `${fmtMonth(d)} ${d.getFullYear()}` : String(d.getDate()),
        });
    }

    // Index of items para encontrar la row index por id (para flechas)
    const rowIndexById = {};
    rangedItems.forEach((r, i) => { rowIndexById[r.item.id] = i; });

    // Construir flechas
    const arrows = [];
    if (depCol) {
        for (const r of rangedItems) {
            const deps = r.item.cells?.[depCol.id];
            const ids = Array.isArray(deps) ? deps : (deps ? [deps] : []);
            for (const fromId of ids) {
                const fromR = rangedItems.find((x) => x.item.id === fromId);
                if (!fromR) continue;  // dep apunta a item sin rango
                const conflict = fromR.end > r.start;  // dep "from" termina después de cuando "to" empieza
                arrows.push({
                    from: fromR,
                    to: r,
                    conflict,
                });
            }
        }
    }

    function barLeft(r) {
        return LABEL_PX + diffDays(startD, r.start) * DAY_PX;
    }
    function barWidth(r) {
        return Math.max((diffDays(r.start, r.end) + 1) * DAY_PX, DAY_PX);
    }
    function arrowPath(from, to) {
        const x1 = LABEL_PX + (diffDays(startD, from.end) + 1) * DAY_PX;
        const y1 = rowIndexById[from.item.id] * 44 + 22;  // mid-row
        const x2 = LABEL_PX + diffDays(startD, to.start) * DAY_PX;
        const y2 = rowIndexById[to.item.id] * 44 + 22;
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    }

    return html`
        <div class="b-tl-wrap">
            <div class="b-tl-header">
                <div style=${{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                    ${rangedItems.length} items con rango · ${arrows.length} dependencia${arrows.length === 1 ? '' : 's'}
                    ${arrows.filter((a) => a.conflict).length > 0 ? html`
                        <span style=${{ marginLeft: '12px', color: 'var(--warn)' }}>
                            ⚠ ${arrows.filter((a) => a.conflict).length} dependencia${arrows.filter((a) => a.conflict).length === 1 ? '' : 's'} en conflicto
                        </span>
                    ` : null}
                </div>
            </div>

            <div class="b-tl-scroller" ref=${scrollerRef}>
                <div class="b-tl-grid" style=${{ width: totalWidth + 'px' }}>
                    <div class="b-tl-axis" style=${{ marginLeft: LABEL_PX + 'px' }}>
                        ${ticks.map((t) => html`
                            <div key=${dateToYmd(t.d)}
                                 class="b-tl-axis-tick"
                                 data-month-start=${t.isMonthStart ? 'true' : 'false'}
                                 style=${{ width: DAY_PX + 'px' }}>
                                ${t.label}
                            </div>
                        `)}
                    </div>

                    <div class="b-tl-rows" style=${{ position: 'relative' }}>
                        ${rangedItems.map((r) => html`
                            <div key=${r.item.id} class="b-tl-row">
                                <div class="b-tl-row-label" title=${r.item.name}>${r.item.name}</div>
                                <div class="b-tl-bar"
                                     style=${{ left: barLeft(r) + 'px', width: barWidth(r) + 'px' }}
                                     onClick=${() => store.openDrawer(r.item.id)}
                                     title=${`${dateToYmd(r.start)} → ${dateToYmd(r.end)}`}>
                                    ${r.item.name}
                                </div>
                            </div>
                        `)}

                        <svg class="b-tl-arrows" width=${totalWidth} height=${rangedItems.length * 44}>
                            <defs>
                                <marker id="tl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                    <path class="b-tl-arrow-head" d="M 0 0 L 10 5 L 0 10 z" />
                                </marker>
                                <marker id="tl-arrow-conflict" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                    <path class="b-tl-arrow-head" data-conflict="true" d="M 0 0 L 10 5 L 0 10 z" />
                                </marker>
                            </defs>
                            ${arrows.map((a, i) => html`
                                <path key=${i}
                                      class="b-tl-arrow-line"
                                      data-conflict=${a.conflict ? 'true' : 'false'}
                                      d=${arrowPath(a.from, a.to)}
                                      marker-end=${a.conflict ? 'url(#tl-arrow-conflict)' : 'url(#tl-arrow)'} />
                            `)}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
}
