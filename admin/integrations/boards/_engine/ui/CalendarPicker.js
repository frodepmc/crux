// ui/CalendarPicker.js
// Mini calendario reutilizable. Soporta selección simple y rango con preview.

import { html } from 'htm/react';
import { useState } from 'react';
import { Icon } from './Icon.js';

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function ymdToDate(ymd) { if (!ymd) return null; const d = new Date(ymd + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
function dateToYmd(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

export function CalendarPicker({
    value,
    rangeStart,
    rangeEnd,
    onChange,
    onClear,
    onHover,        // (ymd | null) => void  — para preview de rango
    hoverPreview,   // ymd | null — extremo tentativo que el padre quiere mostrar
}) {
    const initial = ymdToDate(value) || ymdToDate(rangeStart) || new Date();
    const [cursor, setCursor] = useState(startOfMonth(initial));

    const firstOfMonth = startOfMonth(cursor);
    const dow0 = (firstOfMonth.getDay() + 6) % 7;
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
    const hover = ymdToDate(hoverPreview);

    function isSameDay(a, b) {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    // Compute effective range (committed + hover preview)
    // - If rs+re both set, range is [rs, re]
    // - If rs only + hover: range is [min(rs,hover), max(rs,hover)] (preview)
    // - If re only + hover: range is [min(re,hover), max(re,hover)] (preview)
    let effStart = rs;
    let effEnd = re;
    if (rs && !re && hover) {
        effStart = rs < hover ? rs : hover;
        effEnd = rs < hover ? hover : rs;
    } else if (re && !rs && hover) {
        effStart = re < hover ? re : hover;
        effEnd = re < hover ? hover : re;
    } else if (rs && re && hover) {
        // Hover during second-click: show tentative range from rs to hover
        effStart = rs < hover ? rs : hover;
        effEnd = rs < hover ? hover : rs;
    }

    function isInRange(d) {
        if (!effStart || !effEnd) return false;
        return d > effStart && d < effEnd;
    }
    function isRangeStart(d) { return isSameDay(d, effStart); }
    function isRangeEnd(d) { return isSameDay(d, effEnd); }

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
            <div class="b-cal-picker-grid"
                 onMouseLeave=${() => onHover && onHover(null)}>
                ${DOW.map((d) => html`<div key=${d} class="b-cal-picker-dow">${d}</div>`)}
                ${cells.map((d) => {
                    const ymd = dateToYmd(d);
                    const outside = d.getMonth() !== cursor.getMonth();
                    const isToday = isSameDay(d, today);
                    const isSel = isSameDay(d, selected);
                    const isRStart = isRangeStart(d);
                    const isREnd = isRangeEnd(d);
                    const inRange = isInRange(d);
                    return html`
                        <button type="button"
                                key=${ymd}
                                class="b-cal-picker-day"
                                data-outside=${outside ? 'true' : 'false'}
                                data-today=${isToday ? 'true' : 'false'}
                                data-selected=${(isSel || isRStart || isREnd) ? 'true' : 'false'}
                                data-in-range=${inRange ? 'true' : 'false'}
                                data-range-start=${isRStart ? 'true' : 'false'}
                                data-range-end=${isREnd ? 'true' : 'false'}
                                onMouseEnter=${() => onHover && onHover(ymd)}
                                onClick=${() => onChange(ymd)}>
                            ${d.getDate()}
                        </button>
                    `;
                })}
            </div>
            <div class="b-cal-picker-footer">
                <button type="button" class="b-cal-picker-clear" onClick=${() => setCursor(startOfMonth(new Date()))}>
                    Ir a hoy
                </button>
                ${onClear && (value || rangeStart || rangeEnd) ? html`
                    <button type="button" class="b-cal-picker-clear" onClick=${onClear}>
                        Limpiar
                    </button>
                ` : null}
            </div>
        </div>
    `;
}
