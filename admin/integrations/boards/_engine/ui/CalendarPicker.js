// ui/CalendarPicker.js
// Mini calendario reutilizable para fechas. Soporta selección simple y rango.

import { html } from 'htm/react';
import { useState } from 'react';
import { Icon } from './Icon.js';

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function ymdToDate(ymd) { if (!ymd) return null; const d = new Date(ymd + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
function dateToYmd(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

export function CalendarPicker({ value, rangeStart, rangeEnd, onChange, onClear }) {
    const initial = ymdToDate(value) || ymdToDate(rangeStart) || new Date();
    const [cursor, setCursor] = useState(startOfMonth(initial));

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

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selected = ymdToDate(value);
    const rs = ymdToDate(rangeStart);
    const re = ymdToDate(rangeEnd);

    function isSameDay(a, b) {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function isInRange(d) {
        if (!rs || !re) return false;
        return d > rs && d < re;
    }

    return html`
        <div class="b-cal-picker">
            <div class="b-cal-picker-head">
                <button type="button" class="b-btn b-btn-ghost b-btn-icon b-btn-sm"
                        onClick=${() => setCursor(addMonths(cursor, -1))}
                        aria-label="Mes anterior">
                    <${Icon} name="chevron-left" size=${14} />
                </button>
                <div class="b-cal-picker-title">${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}</div>
                <button type="button" class="b-btn b-btn-ghost b-btn-icon b-btn-sm"
                        onClick=${() => setCursor(addMonths(cursor, 1))}
                        aria-label="Mes siguiente">
                    <${Icon} name="chevron-right" size=${14} />
                </button>
            </div>
            <div class="b-cal-picker-grid">
                ${DOW.map((d) => html`<div key=${d} class="b-cal-picker-dow">${d}</div>`)}
                ${cells.map((d) => {
                    const ymd = dateToYmd(d);
                    const outside = d.getMonth() !== cursor.getMonth();
                    const isToday = isSameDay(d, today);
                    const isSelected = isSameDay(d, selected) || isSameDay(d, rs) || isSameDay(d, re);
                    const inRange = isInRange(d);
                    return html`
                        <button type="button"
                                key=${ymd}
                                class="b-cal-picker-day"
                                data-outside=${outside ? 'true' : 'false'}
                                data-today=${isToday ? 'true' : 'false'}
                                data-selected=${isSelected ? 'true' : 'false'}
                                data-in-range=${inRange ? 'true' : 'false'}
                                data-range-start=${isSameDay(d, rs) ? 'true' : 'false'}
                                data-range-end=${isSameDay(d, re) ? 'true' : 'false'}
                                onClick=${() => onChange(ymd)}>
                            ${d.getDate()}
                        </button>
                    `;
                })}
            </div>
            <div class="b-cal-picker-footer">
                <button type="button" class="b-cal-picker-clear" onClick=${() => setCursor(startOfMonth(new Date()))}>
                    Hoy
                </button>
                ${onClear && value ? html`
                    <button type="button" class="b-cal-picker-clear" onClick=${onClear}>
                        Limpiar
                    </button>
                ` : null}
            </div>
        </div>
    `;
}
