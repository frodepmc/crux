// columns/daterange.js
// Date range: { start: 'yyyy-mm-dd', end: 'yyyy-mm-dd' }. Render relativo.
import { html } from 'htm/react';
import { register } from './registry.js';

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
        return html`<span style=${{ color: rangeColor(value) }} title=${title}>${label}</span>`;
    },
    renderEditor: (value, ctx, onChange) => {
        const v = value || { start: '', end: '' };
        function update(k, val) {
            const next = { ...v, [k]: val || null };
            // Si ambos vacíos, devuelve null
            if (!next.start && !next.end) onChange(null);
            else onChange(next);
        }
        return html`
            <div style=${{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input class="b-input b-input-date"
                       type="date"
                       value=${v.start || ''}
                       onChange=${(e) => update('start', e.target.value)}
                       aria-label=${ctx.column.name + ' inicio'} />
                <span style=${{ color: 'var(--text-5)' }}>→</span>
                <input class="b-input b-input-date"
                       type="date"
                       value=${v.end || ''}
                       onChange=${(e) => update('end', e.target.value)}
                       aria-label=${ctx.column.name + ' fin'} />
            </div>
        `;
    },
    compare: (a, b) => {
        const ae = a?.end ? new Date(a.end).getTime() : Infinity;
        const be = b?.end ? new Date(b.end).getTime() : Infinity;
        return ae - be;
    },
    defaultConfig: {},
});
