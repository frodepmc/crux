// columns/daterange.js
// Render: rango compacto.
// Editor: trigger + popover con dos calendars (start + end) en pestañas.

import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';
import { CalendarPicker } from '../ui/CalendarPicker.js';

function shortDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function rangeColor(value) {
    if (!value || !value.end) return null;
    const end = new Date(value.end + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.round((end - now) / 86400000);
    if (days < 0) return 'var(--err)';
    if (days <= 2) return 'var(--warn)';
    return 'var(--text-3)';
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
                width=${320}
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
                ${(close) => html`<${DateRangePickerBody} value=${value} onChange=${onChange} />`}
            <//>
        `;
    },
    compare: (a, b) => {
        const ae = a?.end ? new Date(a.end).getTime() : Infinity;
        const be = b?.end ? new Date(b.end).getTime() : Infinity;
        return ae - be;
    },
    defaultConfig: {},
});

function DateRangePickerBody({ value, onChange }) {
    const v = value || { start: null, end: null };
    const [mode, setMode] = useState('start');

    function update(field, val) {
        const next = { ...v, [field]: val };
        if (!next.start && !next.end) onChange(null);
        else onChange(next);
    }

    return html`
        <div style=${{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line-1)' }}>
            <button type="button"
                    onClick=${() => setMode('start')}
                    class="b-btn b-btn-tab"
                    aria-current=${mode === 'start' ? 'true' : 'false'}
                    style=${{ flex: 1, borderRadius: 0, minHeight: 32 }}>
                <span style=${{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', letterSpacing: 'var(--letter-label)', textTransform: 'uppercase' }}>Inicio</span>
                ${v.start ? html`<span style=${{ marginLeft: 6, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>${shortDate(v.start)}</span>` : null}
            </button>
            <button type="button"
                    onClick=${() => setMode('end')}
                    class="b-btn b-btn-tab"
                    aria-current=${mode === 'end' ? 'true' : 'false'}
                    style=${{ flex: 1, borderRadius: 0, minHeight: 32 }}>
                <span style=${{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', letterSpacing: 'var(--letter-label)', textTransform: 'uppercase' }}>Fin</span>
                ${v.end ? html`<span style=${{ marginLeft: 6, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>${shortDate(v.end)}</span>` : null}
            </button>
        </div>
        <${CalendarPicker}
            value=${mode === 'start' ? v.start : v.end}
            rangeStart=${v.start}
            rangeEnd=${v.end}
            onChange=${(val) => update(mode, val)}
            onClear=${() => update(mode, null)} />
    `;
}
