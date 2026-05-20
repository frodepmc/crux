// columns/number.js
import { html } from 'htm/react';
import { register } from './registry.js';

function format(value, config) {
    if (value == null || value === '') return '';
    const n = Number(value);
    if (Number.isNaN(n)) return '';
    const prefix = config?.prefix || '';
    const suffix = config?.suffix || '';
    const formatted = n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
    return prefix + formatted + suffix;
}

register({
    type: 'number',
    render: (value, ctx) => html`<span style=${{ fontVariantNumeric: 'tabular-nums' }}>${format(value, ctx?.column?.config)}</span>`,
    renderEditor: (value, ctx, onChange) => html`
        <input class="b-input b-input-number"
               type="number"
               step="any"
               value=${value == null ? '' : value}
               onChange=${(e) => {
                   const v = e.target.value;
                   onChange(v === '' ? null : Number(v));
               }}
               aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => (Number(a) || 0) - (Number(b) || 0),
    defaultConfig: { prefix: '', suffix: '' },
});
