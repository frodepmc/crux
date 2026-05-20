// columns/number.js
// Render: número formateado con prefix/suffix.
// Editor: input limpio sin spinners nativos + steppers laterales − / +.

import { html } from 'htm/react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';

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
    renderEditor: (value, ctx, onChange) => {
        const step = ctx?.column?.config?.step || 1;
        const current = value == null ? null : Number(value);

        function dec() {
            const base = Number.isFinite(current) ? current : 0;
            onChange(Math.round((base - step) * 1e6) / 1e6);
        }
        function inc() {
            const base = Number.isFinite(current) ? current : 0;
            onChange(Math.round((base + step) * 1e6) / 1e6);
        }
        function onInput(e) {
            const v = e.target.value;
            if (v === '') { onChange(null); return; }
            const n = Number(v);
            if (!Number.isNaN(n)) onChange(n);
        }

        return html`
            <span class="b-num-wrap">
                <button class="b-num-step" type="button"
                        onClick=${(e) => { e.preventDefault(); dec(); }}
                        aria-label="Decrementar">
                    <${Icon} name="minus" size=${12} strokeWidth=${2.4} />
                </button>
                <input class="b-num-input"
                       type="number"
                       step="any"
                       value=${current == null ? '' : current}
                       onChange=${onInput}
                       aria-label=${ctx.column.name} />
                <button class="b-num-step" type="button"
                        onClick=${(e) => { e.preventDefault(); inc(); }}
                        aria-label="Incrementar">
                    <${Icon} name="plus" size=${12} strokeWidth=${2.4} />
                </button>
            </span>
        `;
    },
    compare: (a, b) => (Number(a) || 0) - (Number(b) || 0),
    defaultConfig: { prefix: '', suffix: '', step: 1 },
});
