// columns/date.js
// Date: ISO yyyy-mm-dd. Render relativo + absoluto en tooltip.
import { html } from 'htm/react';
import { register } from './registry.js';

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
        ? html`<span style=${{ color: relColor(value) }} title=${value}>${format(value)}</span>`
        : html`<span></span>`,
    renderEditor: (value, ctx, onChange) => html`
        <input class="b-input b-input-date"
               type="date"
               value=${value || ''}
               onChange=${(e) => onChange(e.target.value || null)}
               aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => {
        const an = a ? new Date(a).getTime() : Infinity;
        const bn = b ? new Date(b).getTime() : Infinity;
        return an - bn;
    },
    defaultConfig: {},
});
