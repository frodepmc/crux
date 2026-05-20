// columns/longtext.js
import { html } from 'htm/react';
import { register } from './registry.js';

register({
    type: 'longtext',
    render: (value) => {
        const text = value || '';
        const short = text.length > 60 ? text.slice(0, 57) + '…' : text;
        return html`<span style=${{ color: 'var(--text-4)', fontStyle: 'italic' }}>${short}</span>`;
    },
    renderEditor: (value, ctx, onChange) => html`
        <textarea class="b-input b-textarea"
                  value=${value || ''}
                  onChange=${(e) => onChange(e.target.value)}
                  rows=${4}
                  placeholder="—"
                  aria-label=${ctx.column.name} />
    `,
    compare: (a, b) => String(a || '').localeCompare(String(b || '')),
    defaultConfig: {},
});
