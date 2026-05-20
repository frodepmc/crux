// columns/daterange.js
// Render: rango compacto.
// Editor: trigger + popover con range-select inteligente + presets + hover preview.

import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';
import { CalendarPicker } from '../ui/CalendarPicker.js';

function ymdToDate(ymd) { if (!ymd) return null; const d = new Date(ymd + 'T00:00:00'); return Number.isNaN(d.getTime()) ? null : d; }
function dateToYmd(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

function shortDate(iso) {
    if (!iso) return '';
    const d = ymdToDate(iso);
    if (!d) return iso;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function rangeColor(value) {
    if (!value || !value.end) return null;
    const end = ymdToDate(value.end);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.round((end - now) / 86400000);
    if (days < 0) return 'var(--err)';
    if (days <= 2) return 'var(--warn)';
    return 'var(--text-3)';
}

function rangeDuration(start, end) {
    const a = ymdToDate(start);
    const b = ymdToDate(end);
    if (!a || !b) return null;
    return Math.round((b - a) / 86400000) + 1;
}

register({
    type: 'daterange',
    render: (value) => {
        if (!value || (!value.start && !value.end)) return html`<span></span>`;
        const label = value.start && value.end
            ? `${shortDate(value.start)} – ${shortDate(value.end)}`
            : (value.start || value.end ? shortDate(value.start || value.end) : '');
        const title = value.start && value.end
            ? `${value.start} → ${value.end}`
            : (value.start || value.end);
        return html`<span style=${{ color: rangeColor(value), fontVariantNumeric: 'tabular-nums' }} title=${title}>${label}</span>`;
    },
    renderEditor: (value, ctx, onChange) => {
        return html`
            <${Popover}
                width=${480}
                trigger=${(openIt, isOpen) => {
                    const label = value && value.start && value.end
                        ? `${shortDate(value.start)} – ${shortDate(value.end)}`
                        : (value && (value.start || value.end) ? shortDate(value.start || value.end) : null);
                    return html`
                        <button type="button"
                                class="b-cell-trigger"
                                data-open=${isOpen ? 'true' : 'false'}
                                onClick=${openIt}
                                aria-label=${ctx.column.name}>
                            ${label ? html`
                                <${Icon} name="calendar" size=${14} strokeWidth=${1.75} style=${{ color: 'var(--text-4)' }} />
                                <span style=${{ color: rangeColor(value), fontVariantNumeric: 'tabular-nums' }}>${label}</span>
                            ` : html`
                                <${Icon} name="calendar" size=${14} strokeWidth=${1.75} style=${{ color: 'var(--text-5)' }} />
                                <span class="b-cell-trigger-placeholder">— sin rango —</span>
                            `}
                            <span class="b-cell-trigger-caret">
                                <${Icon} name="chevron-down" size=${14} />
                            </span>
                        </button>
                    `;
                }}>
                ${(close) => html`<${DateRangePickerBody} value=${value} onChange=${onChange} onClose=${close} />`}
            <//>
        `;
    },
    compare: (a, b) => {
        const ae = a?.end ? ymdToDate(a.end).getTime() : Infinity;
        const be = b?.end ? ymdToDate(b.end).getTime() : Infinity;
        return ae - be;
    },
    defaultConfig: {},
});

function startOfWeek(d) {
    const day = (d.getDay() + 6) % 7;  // monday-based
    const out = new Date(d);
    out.setDate(d.getDate() - day);
    out.setHours(0, 0, 0, 0);
    return out;
}
function endOfWeek(d) {
    const sow = startOfWeek(d);
    sow.setDate(sow.getDate() + 6);
    return sow;
}
function startOfNextMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d, n) {
    const r = new Date(d); r.setDate(r.getDate() + n); r.setHours(0, 0, 0, 0); return r;
}

const PRESETS = [
    {
        id: 'today',
        label: 'Hoy',
        build: () => { const d = new Date(); d.setHours(0,0,0,0); return { start: dateToYmd(d), end: dateToYmd(d) }; },
    },
    {
        id: 'tomorrow',
        label: 'Mañana',
        build: () => { const d = addDays(new Date(), 1); return { start: dateToYmd(d), end: dateToYmd(d) }; },
    },
    {
        id: 'this-week',
        label: 'Esta semana',
        build: () => { const a = startOfWeek(new Date()); const b = endOfWeek(new Date()); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'next-week',
        label: 'Próxima semana',
        build: () => { const a = addDays(startOfWeek(new Date()), 7); const b = addDays(a, 6); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'next-7',
        label: 'Próximos 7 días',
        build: () => { const a = new Date(); a.setHours(0,0,0,0); const b = addDays(a, 6); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'next-14',
        label: 'Próximos 14 días',
        build: () => { const a = new Date(); a.setHours(0,0,0,0); const b = addDays(a, 13); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'next-30',
        label: 'Próximos 30 días',
        build: () => { const a = new Date(); a.setHours(0,0,0,0); const b = addDays(a, 29); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'this-month',
        label: 'Este mes',
        build: () => { const a = new Date(new Date().getFullYear(), new Date().getMonth(), 1); const b = endOfMonth(new Date()); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
    {
        id: 'next-month',
        label: 'Próximo mes',
        build: () => { const a = startOfNextMonth(new Date()); const b = endOfMonth(a); return { start: dateToYmd(a), end: dateToYmd(b) }; },
    },
];

function DateRangePickerBody({ value, onChange, onClose }) {
    const v = value || { start: null, end: null };
    // Step: 'start' = next click sets start, 'end' = next click sets end
    // Si ya hay start+end, asume que el usuario quiere "restart": next click = start
    const initialStep = v.start && !v.end ? 'end' : 'start';
    const [step, setStep] = useState(initialStep);
    const [hoverPreview, setHoverPreview] = useState(null);

    function commit(next) {
        if (!next.start && !next.end) onChange(null);
        else onChange(next);
    }

    function onDayClick(ymd) {
        if (step === 'start') {
            // Empezar rango nuevo
            commit({ start: ymd, end: null });
            setStep('end');
            setHoverPreview(null);
            return;
        }
        // step === 'end'
        const s = ymdToDate(v.start);
        const newEnd = ymdToDate(ymd);
        if (!s) {
            // No había start → tratar este click como start
            commit({ start: ymd, end: null });
            setStep('end');
            return;
        }
        if (newEnd < s) {
            // Swap: el click fue antes que el start → invertir
            commit({ start: ymd, end: v.start });
        } else {
            commit({ start: v.start, end: ymd });
        }
        setHoverPreview(null);
        setStep('start');  // restart for next interaction
        if (onClose) onClose();
    }

    function applyPreset(preset) {
        const r = preset.build();
        commit(r);
        setStep('start');
        if (onClose) onClose();
    }

    function clearAll() {
        commit({ start: null, end: null });
        setStep('start');
        setHoverPreview(null);
    }

    const duration = rangeDuration(v.start, v.end);

    return html`
        <div style=${{ display: 'flex', maxHeight: '420px' }}>
            <aside class="b-range-presets">
                <div class="b-range-presets-title">Atajos</div>
                ${PRESETS.map((p) => html`
                    <button key=${p.id} type="button" class="b-range-preset" onClick=${() => applyPreset(p)}>
                        ${p.label}
                    </button>
                `)}
                ${(v.start || v.end) ? html`
                    <button type="button" class="b-range-preset b-range-preset-danger" onClick=${clearAll}>
                        <${Icon} name="x" size=${12} strokeWidth=${2.4} />
                        Limpiar rango
                    </button>
                ` : null}
            </aside>
            <div class="b-range-calendar">
                <div class="b-range-summary">
                    <div class="b-range-summary-row">
                        <span class="b-range-summary-label" data-active=${step === 'start' ? 'true' : 'false'}>Inicio</span>
                        <span class="b-range-summary-value">${v.start ? shortDate(v.start) : '—'}</span>
                    </div>
                    <div class="b-range-summary-arrow"><${Icon} name="arrow-right" size=${12} strokeWidth=${2.2} /></div>
                    <div class="b-range-summary-row">
                        <span class="b-range-summary-label" data-active=${step === 'end' ? 'true' : 'false'}>Fin</span>
                        <span class="b-range-summary-value">${v.end ? shortDate(v.end) : '—'}</span>
                    </div>
                    ${duration ? html`
                        <span class="b-range-summary-duration">${duration} día${duration === 1 ? '' : 's'}</span>
                    ` : null}
                </div>
                <div class="b-range-hint">
                    ${step === 'start' && !v.start ? 'Selecciona fecha de inicio' : null}
                    ${step === 'end' ? (v.start ? 'Selecciona fecha de fin' : 'Selecciona fecha') : null}
                    ${step === 'start' && v.start && v.end ? 'Haz click para reiniciar el rango' : null}
                </div>
                <${CalendarPicker}
                    rangeStart=${v.start}
                    rangeEnd=${v.end}
                    hoverPreview=${step === 'end' ? hoverPreview : null}
                    onHover=${setHoverPreview}
                    onChange=${onDayClick}
                    onClear=${clearAll} />
            </div>
        </div>
    `;
}
