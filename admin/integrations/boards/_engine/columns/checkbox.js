// columns/checkbox.js
// Boolean simple. Render como ✓/space.
import { html } from 'htm/react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';

register({
    type: 'checkbox',
    render: (value) => html`
        <span style=${{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px', height: '18px',
            border: '1px solid var(--line-2)',
            borderRadius: '3px',
            background: value ? 'var(--ok)' : 'transparent',
            color: '#fff',
            fontSize: 'var(--fs-xs)',
            fontWeight: 'var(--fw-bold)',
        }}>${value ? html`<${Icon} name="check" size=${12} strokeWidth=${3} color="#fff" />` : ''}</span>
    `,
    renderEditor: (value, ctx, onChange) => html`
        <label style=${{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox"
                   checked=${!!value}
                   onChange=${(e) => onChange(e.target.checked)}
                   aria-label=${ctx.column.name} />
            <span style=${{ fontSize: 'var(--fs-md)', color: 'var(--text-3)' }}>${value ? 'Sí' : 'No'}</span>
        </label>
    `,
    compare: (a, b) => (b ? 1 : 0) - (a ? 1 : 0),
    defaultConfig: {},
});
