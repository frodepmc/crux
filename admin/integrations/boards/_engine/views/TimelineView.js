// views/TimelineView.js
// Vista Timeline: flex layout con label col + bars area.

import { html } from 'htm/react';
import { useState, useRef } from 'react';
import { useStore } from '../hooks.js';
import { applyFilters } from '../filters.js';
import { Icon } from '../ui/Icon.js';

const LABEL_PX = 220;
const ROW_PX = 52;
const BAR_GAP = 6;

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

    const minDate = new Date(Math.min(...rangedItems.map((r) => r.start.getTime())));
    const maxDate = new Date(Math.max(...rangedItems.map((r) => r.end.getTime())));
    const startD = addDays(minDate, -5);
    const endD = addDays(maxDate, 5);
    const totalDays = diffDays(startD, endD) + 1;
    const barsWidth = totalDays * dayPx;

    const days = [];
    for (let i = 0; i < totalDays; i += 1) days.push(addDays(startD, i));

    // Build month spans
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

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const rowIndexById = {};
    rangedItems.forEach((r, i) => { rowIndexById[r.item.id] = i; });

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

    // Coords RELATIVAS al bars-area (no incluyen LABEL_PX)
    function barLeft(r) { return diffDays(startD, r.start) * dayPx; }
    function barWidth(r) { return Math.max((diffDays(r.start, r.end) + 1) * dayPx, dayPx); }
    function barRight(r) { return barLeft(r) + barWidth(r); }
    function rowMidY(r) { return rowIndexById[r.item.id] * ROW_PX + ROW_PX / 2; }
    function arrowPath(from, to) {
        const x1 = barRight(from);
        const y1 = rowMidY(from);
        const x2 = barLeft(to) - BAR_GAP;
        const y2 = rowMidY(to);
        const dx = Math.max(20, Math.abs(x2 - x1) / 2);
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }
    function barTextOverflowOffset(r) {
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
                        <span class="b-tl-conflict">
                            <${Icon} name="alert-triangle" size=${13} strokeWidth=${2.2} />
                            ${conflictCount} en conflicto
                        </span>
                    ` : null}
                </div>
                <div class="b-tl-zoom">
                    <span>Zoom</span>
                    <button class="b-tl-nav" onClick=${() => setDayPx(Math.max(12, dayPx - 8))} aria-label="Zoom out">
                        <${Icon} name="minus" size=${13} strokeWidth=${2.4} />
                    </button>
                    <span class="b-tl-zoom-value">${dayPx}px/día</span>
                    <button class="b-tl-nav" onClick=${() => setDayPx(Math.min(64, dayPx + 8))} aria-label="Zoom in">
                        <${Icon} name="plus" size=${13} strokeWidth=${2.4} />
                    </button>
                </div>
            </div>

            <div class="b-tl-scroller">
                <div class="b-tl-grid">

                    <!-- Axis row -->
                    <div class="b-tl-axis">
                        <div class="b-tl-axis-label-spacer">Tarea</div>
                        <div class="b-tl-axis-bars">
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
                    </div>

                    <!-- Rows -->
                    <div class="b-tl-rows">
                        ${rangedItems.map((r) => {
                            const overflowOffset = barTextOverflowOffset(r);
                            return html`
                                <div key=${r.item.id} class="b-tl-row">
                                    <div class="b-tl-row-label" title=${r.item.name}>${r.item.name}</div>
                                    <div class="b-tl-row-bars" style=${{ width: barsWidth + 'px' }}>
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
                                </div>
                            `;
                        })}

                        <svg class="b-tl-arrows" width=${barsWidth} height=${rangedItems.length * ROW_PX}>
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
