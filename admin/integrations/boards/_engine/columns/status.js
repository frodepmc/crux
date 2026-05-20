// columns/status.js
// Status: chip de color a partir de config.options[{id, label, color}].
// config: { options: [{id, label, color}] }
import { html } from 'htm/react';
import { register } from './registry.js';

function findOption(value, config) {
    const opts = config?.options || [];
    return opts.find((o) => o.id === value) || null;
}

register({
    type: 'status',
    render: (value, ctx) => {
        const opt = findOption(value, ctx?.column?.config);
        if (!opt) return html`<span></span>`;
        return html`
            <span style=${{
                background: opt.color || 'var(--accent)',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: 'var(--r-1)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            }}>${opt.label}</span>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const opts = ctx?.column?.config?.options || [];
        return html`
            <select class="b-input b-input-status"
                    value=${value || ''}
                    onChange=${(e) => onChange(e.target.value || null)}
                    aria-label=${ctx.column.name}>
                <option value="">—</option>
                ${opts.map((o) => html`<option key=${o.id} value=${o.id}>${o.label}</option>`)}
            </select>
        `;
    },
    compare: (a, b, config) => {
        const opts = config?.options || [];
        const ai = opts.findIndex((o) => o.id === a);
        const bi = opts.findIndex((o) => o.id === b);
        return ai - bi;
    },
    kanbanGroupKey: (value) => value || null,
    defaultConfig: { options: [] },
});
