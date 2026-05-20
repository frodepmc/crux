// columns/email.js
import { html } from 'htm/react';
import { register } from './registry.js';

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

register({
    type: 'email',
    render: (value) => value
        ? html`<a href=${'mailto:' + value} onClick=${(e) => e.stopPropagation()} style=${{ color: 'var(--accent)' }}>${value}</a>`
        : html`<span></span>`,
    renderEditor: (value, ctx, onChange) => {
        const invalid = value && !RE.test(value);
        return html`
            <input class="b-input b-input-email"
                   type="email"
                   value=${value || ''}
                   onChange=${(e) => onChange(e.target.value)}
                   placeholder="alguien@dominio.com"
                   aria-invalid=${invalid ? 'true' : 'false'}
                   aria-label=${ctx.column.name} />
        `;
    },
    compare: (a, b) => String(a || '').localeCompare(String(b || '')),
    defaultConfig: {},
});
