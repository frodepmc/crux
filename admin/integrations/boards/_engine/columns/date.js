// columns/date.js
// Render: fecha relativa con color según urgencia.
// Editor: trigger + mini calendar picker.

import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';
import { CalendarPicker } from '../ui/CalendarPicker.js';

function format(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function relColor(iso) {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.round((d - now) / 86400000);
    if (days < 0) return 'var(--err)';
    if (days <= 2) return 'var(--warn)';
    return 'var(--text-3)';
}

register({
    type: 'date',
    render: (value) => value
        ? html`<span style=${{ color: relColor(value), fontVariantNumeric: 'tabular-nums' }} title=${value}>${format(value)}</span>`
        : html`<span></span>`,
    renderEditor: (value, ctx, onChange) => {
        return html`
            <${Popover}
                width=${280}
                trigger=${(openIt, isOpen) => html`
                    <button type="button"
                            class="b-cell-trigger"
                            data-open=${isOpen ? 'true' : 'false'}
                            onClick=${openIt}
                            aria-label=${ctx.column.name}>
                        ${value ? html`
                            <${Icon} name="calendar" size=${14} strokeWidth=${1.75} style=${{ color: 'var(--text-4)' }} />
                            <span style=${{ color: relColor(value), fontVariantNumeric: 'tabular-nums' }}>
                                ${format(value)}
                            </span>
                        ` : html`
                            <${Icon} name="calendar" size=${14} strokeWidth=${1.75} style=${{ color: 'var(--text-5)' }} />
                            <span class="b-cell-trigger-placeholder">— sin fecha —</span>
                        `}
                        <span class="b-cell-trigger-caret">
                            <${Icon} name="chevron-down" size=${14} />
                        </span>
                    </button>
                `}>
                ${(close) => html`
                    <${CalendarPicker}
                        value=${value}
                        onChange=${(v) => { onChange(v); close(); }}
                        onClear=${() => { onChange(null); close(); }} />
                `}
            <//>
        `;
    },
    compare: (a, b) => {
        const an = a ? new Date(a).getTime() : Infinity;
        const bn = b ? new Date(b).getTime() : Infinity;
        return an - bn;
    },
    defaultConfig: {},
});
