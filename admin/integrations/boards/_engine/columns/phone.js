// columns/phone.js
import { html } from 'htm/react';
import { register } from './registry.js';

register({
    type: 'phone',
    render: (value) => value
        ? html`<a href=${'tel:' + value} onClick=${(e) => e.stopPropagation()} style=${{ color: 'var(--accent)' }}>${value}</a>`
        : html`<span></span>`,
    renderEditor: (value, ctx, onChange) => html`
        <input class="b-input b-input-phone"
               type="tel"
               value=${value || ''}
               onChange=${(e) => onChange(e.target.value)}
               placeholder="+34 600 000 000"
               aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => String(a || '').localeCompare(String(b || '')),
    defaultConfig: {},
});
