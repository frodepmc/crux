// views/TimelineView.js
// Vista Timeline: barras horizontales por daterange, eje de días con mes header,
// flechas SVG entre items conectados por columna 'dependency'.
// Zoom in/out con dayPx state.

import { html } from 'htm/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../hooks.js';
import { applyFilters } from '../filters.js';

const LABEL_PX = 220;
const ROW_PX = 52;
const BAR_GAP = 6;  // espacio entre el final del bar source y la flecha entrante

function ymdToDate(ymd) { if (!ymd) return null; const d = new Date(ymd + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
function dateToYmd(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function diffDays(a, b) { return Math.round((b - a) / 86400000); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtMonthShort(d) {
    const names = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${names[d.getMonth()]} ${d.getFullYear()}`;
}

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
    const [dayPx, setDayPx] = useState(28);
    const scrollerRef = useRef(null);

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

    // Rango temporal a mostrar: min start - 5 días, max end + 5 días
    const minDate = new Date(Math.min(...rangedItems.map((r) => r.start.getTime())));
    const maxDate = new Date(Math.max(...rangedItems.map((r) => r.end.getTime())));
    const startD = addDays(minDate, -5);
    const endD = addDays(maxDate, 5);
    const totalDays = diffDays(startD, endD) + 1;
    const totalWidth = totalDays * dayPx + LABEL_PX;

    // Build days array
    const days = [];
    for (let i = 0; i < totalDays; i += 1) {
        const d = addDays(startD, i);
        days.push(d);
    }

    // Build month spans (consecutive days in same month → one cell)
    const monthSpans = [];
    let cursor = 0;
    while (cursor < days.length) {
        const currentMonth = days[cursor].getMonth();
        const currentYear = days[cursor].getFullYear();
        let span = 1;
        while (cursor + span < days.length &&
               days[cursor + span].getMonth() === currentMonth &&
               days[cursor + span].getFullYear() === currentYear) {
            span += 1;
        }
        monthSpans.push({
            startIdx: cursor,
            span,
            label: fmtMonthShort(days[cursor]),
        });
        cursor += span;
    }

    // Today index (puede caer fuera del rango)
    const today = new Date(); today.setHours(0, 0, 0, 0);

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
                if (!fromR) continue;
                const conflict = fromR.end > r.start;
                arrows.push({ from: fromR, to: r, conflict });
            }
        }
    }

    function barLeft(r) {
        return LABEL_PX + diffDays(startD, r.start) * dayPx;
    }
    function barWidth(r) {
        return Math.max((diffDays(r.start, r.end) + 1) * dayPx, dayPx);
    }
    function barRight(r) {
        return barLeft(r) + barWidth(r);
    }
    function rowMidY(r) {
        return rowIndexById[r.item.id] * ROW_PX + ROW_PX / 2;
    }
    function arrowPath(from, to) {
        const x1 = barRight(from);
        const y1 = rowMidY(from);
        const x2 = barLeft(to) - BAR_GAP;
        const y2 = rowMidY(to);
        const dx = Math.max(20, Math.abs(x2 - x1) / 2);
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }

    function barTextOverflowOffset(r) {
        // Cuando la barra es muy estrecha y el nombre no cabe, devolvemos posición
        // a la derecha de la barra para escribir el nombre fuera. Estimación: 7px/char.
        const estTextWidth = (r.item.name?.length || 0) * 7 + 16;
        return estTextWidth > barWidth(r) ? barRight(r) + 6 : null;
    }

    const conflictCount = arrows.filter((a) => a.conflict).length;

    return html`
        <div class="b-tl-wrap">
            <div class="b-tl-header">
                <div class="b-tl-counts">
                    <span><strong>${rangedItems.length}</strong> items con rango</span>
                    <span>·</span>
                    <span><strong>${arrows.length}</strong> dependencia${arrows.length === 1 ? '' : 's'}</span>
                    ${conflictCount > 0 ? html`
                        <span class="b-tl-conflict">⚠ ${conflictCount} en conflicto</span>
                    ` : null}
                </div>
                <div class="b-tl-zoom">
                    <span>Zoom</span>
                    <button class="b-tl-nav" onClick=${() => setDayPx(Math.max(12, dayPx - 8))} aria-label="Zoom out">−</button>
                    <span class="b-tl-zoom-value">${dayPx}px/día</span>
                    <button class="b-tl-nav" onClick=${() => setDayPx(Math.min(64, dayPx + 8))} aria-label="Zoom in">+</button>
                </div>
            </div>

            <div class="b-tl-scroller" ref=${scrollerRef}>
                <div class="b-tl-grid" style=${{ width: totalWidth + 'px' }}>
                    <div class="b-tl-axis" style=${{ marginLeft: LABEL_PX + 'px', width: (totalWidth - LABEL_PX) + 'px' }}>
                        <div class="b-tl-axis-months">
                            ${monthSpans.map((ms) => html`
                                <div key=${ms.startIdx}
                                     class="b-tl-axis-month"
                                     style=${{ width: (ms.span * dayPx) + 'px' }}>
                                    ${ms.label}
                                </div>
                            `)}
                        </div>
                        <div class="b-tl-axis-days">
                            ${days.map((d) => {
                                const dow = d.getDay();
                                const weekend = dow === 0 || dow === 6;
                                const isToday = isSameDay(d, today);
                                return html`
                                    <div key=${dateToYmd(d)}
                                         class="b-tl-axis-tick"
                                         data-weekend=${weekend ? 'true' : 'false'}
                                         data-today=${isToday ? 'true' : 'false'}
                                         style=${{ width: dayPx + 'px' }}>
                                        ${d.getDate()}
                                    </div>
                                `;
                            })}
                        </div>
                    </div>

                    <div class="b-tl-rows" style=${{ position: 'relative' }}>
                        ${rangedItems.map((r) => {
                            const overflowOffset = barTextOverflowOffset(r);
                            return html`
                                <div key=${r.item.id} class="b-tl-row">
                                    <div class="b-tl-row-label" title=${r.item.name}>${r.item.name}</div>
                                    <div class="b-tl-bar"
                                         style=${{ left: barLeft(r) + 'px', width: barWidth(r) + 'px' }}
                                         onClick=${() => store.openDrawer(r.item.id)}
                                         title=${`${dateToYmd(r.start)} → ${dateToYmd(r.end)}`}>
                                        ${overflowOffset == null ? r.item.name : ''}
                                    </div>
                                    ${overflowOffset != null ? html`
                                        <div class="b-tl-bar-overflow"
                                             style=${{ left: overflowOffset + 'px' }}>
                                            ${r.item.name}
                                        </div>
                                    ` : null}
                                </div>
                            `;
                        })}

                        <svg class="b-tl-arrows" width=${totalWidth} height=${rangedItems.length * ROW_PX}>
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
