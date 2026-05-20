// columns/link.js
import { html } from 'htm/react';
import { register } from './registry.js';

function shortHost(url) {
    try { return new URL(url).host; } catch { return url; }
}

register({
    type: 'link',
    render: (value) => value
        ? html`<a href=${value} target="_blank" rel="noopener" onClick=${(e) => e.stopPropagation()} style=${{ color: 'var(--accent)' }}>${shortHost(value)}</a>`
        : html`<span></span>`,
    renderEditor: (value, ctx, onChange) => html`
        <input class="b-input b-input-link"
               type="url"
               value=${value || ''}
               onChange=${(e) => onChange(e.target.value)}
               placeholder="https://…"
               aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => String(a || '').localeCompare(String(b || '')),
    defaultConfig: {},
});
