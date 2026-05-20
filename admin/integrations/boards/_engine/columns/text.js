// columns/text.js
import { html } from 'htm/react';
import { register } from './registry.js';

register({
    type: 'text',
    render: (value) => html`<span>${value || ''}</span>`,
    renderEditor: (value, ctx, onChange) => html`
        <input class="b-input b-input-text"
               type="text"
               value=${value || ''}
               onChange=${(e) => onChange(e.target.value)}
               maxLength=${200}
               placeholder="—"
               aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => String(a || '').localeCompare(String(b || '')),
    defaultConfig: {},
});
