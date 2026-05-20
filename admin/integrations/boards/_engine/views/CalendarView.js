// views/CalendarView.js
// Vista mes: items posicionados según su columna date o daterange (configurable
// en meta.views.calendar.columnId; fallback al primer column de tipo date/daterange).
// Drag de pill a otro día → store.updateCell con la nueva fecha (cambia 'start' en daterange).

import { html } from 'htm/react';
import { useState } from 'react';
import { useStore } from '../hooks.js';

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function ymdToDate(ymd) {
    if (!ymd) return null;
    const d = new Date(ymd + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
}
function dateToYmd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function findCalendarColumn(meta) {
    const explicit = meta.views?.calendar?.columnId;
    if (explicit) {
        const c = meta.columns.find((x) => x.id === explicit);
        if (c) return c;
    }
    return meta.columns.find((c) => c.type === 'date' || c.type === 'daterange') || null;
}

function getItemDate(item, col) {
    const value = item.cells?.[col.id];
    if (col.type === 'date') return ymdToDate(value);
    if (col.type === 'daterange') return ymdToDate(value?.start);
    return null;
}

function getItemDateYmd(item, col) {
    const value = item.cells?.[col.id];
    if (col.type === 'date') return value || null;
    if (col.type === 'daterange') return value?.start || null;
    return null;
}

function setItemDate(col, currentValue, newYmd) {
    if (col.type === 'date') return newYmd;
    if (col.type === 'daterange') {
        const cur = currentValue || { start: null, end: null };
        if (cur.end && cur.start) {
            // Mantener duración
            const startD = ymdToDate(cur.start);
            const endD = ymdToDate(cur.end);
            const newStartD = ymdToDate(newYmd);
            const ms = endD - startD;
            const newEndD = new Date(newStartD.getTime() + ms);
            return { start: newYmd, end: dateToYmd(newEndD) };
        }
        return { ...cur, start: newYmd };
    }
    return null;
}

export function CalendarView({ store }) {
    const state = useStore(store);
    const { meta, itemIndex, itemsById } = state;
    const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
    const [draggingId, setDraggingId] = useState(null);
    const [dropTargetYmd, setDropTargetYmd] = useState(null);

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;
    const col = findCalendarColumn(meta);
    if (!col) {
        return html`
            <div class="b-empty">
                Este board no tiene columna de fecha.<br/>
                Añade una columna tipo <code>date</code> o <code>daterange</code> y configura <code>meta.views.calendar.columnId</code>.
            </div>
        `;
    }

    // Build calendar grid: 6 rows × 7 cols, lunes-first
    const firstOfMonth = startOfMonth(cursor);
    const dow0 = (firstOfMonth.getDay() + 6) % 7;  // monday-based
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - dow0);
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        cells.push(d);
    }

    const items = itemIndex.map((entry) => itemsById[entry.id]).filter(Boolean);
    const itemsByYmd = {};
    for (const item of items) {
        const ymd = getItemDateYmd(item, col);
        if (!ymd) continue;
        if (!itemsByYmd[ymd]) itemsByYmd[ymd] = [];
        itemsByYmd[ymd].push(item);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    async function onDropToDay(targetYmd) {
        if (!draggingId) return;
        const item = store.getState().itemsById[draggingId];
        if (!item) return;
        const currentValue = item.cells?.[col.id];
        const next = setItemDate(col, currentValue, targetYmd);
        await store.updateCell(draggingId, col.id, next);
        setDraggingId(null);
        setDropTargetYmd(null);
    }

    return html`
        <div class="b-cal-wrap">
            <div class="b-cal-header">
                <button class="b-cal-nav" onClick=${() => setCursor(addMonths(cursor, -1))} aria-label="Mes anterior">← Anterior</button>
                <div class="b-cal-month">${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}</div>
                <button class="b-cal-nav" onClick=${() => setCursor(addMonths(cursor, 1))} aria-label="Mes siguiente">Siguiente →</button>
                <button class="b-cal-nav" onClick=${() => setCursor(startOfMonth(new Date()))} style=${{ marginLeft: 'auto' }}>Hoy</button>
            </div>

            <div class="b-cal-grid">
                ${DOW.map((d) => html`<div key=${d} class="b-cal-dow">${d}</div>`)}
                ${cells.map((d) => {
                    const ymd = dateToYmd(d);
                    const outOfMonth = d.getMonth() !== cursor.getMonth();
                    const isToday = isSameDay(d, today);
                    const dayItems = itemsByYmd[ymd] || [];
                    return html`
                        <div key=${ymd} class="b-cal-day"
                             data-outside-month=${outOfMonth ? 'true' : 'false'}
                             data-today=${isToday ? 'true' : 'false'}
                             data-drop-active=${ymd === dropTargetYmd ? 'true' : 'false'}
                             onDragOver=${(e) => { e.preventDefault(); if (draggingId) setDropTargetYmd(ymd); }}
                             onDrop=${(e) => { e.preventDefault(); onDropToDay(ymd); }}>
                            <div class="b-cal-day-num">${d.getDate()}</div>
                            ${dayItems.map((item) => html`
                                <div key=${item.id}
                                     class="b-cal-pill"
                                     draggable="true"
                                     data-dragging=${item.id === draggingId ? 'true' : 'false'}
                                     onDragStart=${() => setDraggingId(item.id)}
                                     onDragEnd=${() => { setDraggingId(null); setDropTargetYmd(null); }}
                                     onClick=${() => store.openDrawer(item.id)}
                                     title=${item.name}>
                                    ${item.name}
                                </div>
                            `)}
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
}
