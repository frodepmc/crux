// columns/person.js
// Person: array de usernames. Render como avatares con iniciales.
// El ctx incluye ctx.team = [{ username, name, color }] desde el store.
import { html } from 'htm/react';
import { register } from './registry.js';

function initials(name) {
    if (!name) return '?';
    return name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function avatar(member) {
    return html`
        <span key=${member.username} title=${member.name} style=${{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: member.color || 'var(--accent)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 700,
            border: '1px solid var(--bg-elevated)',
            marginLeft: '-4px',
        }}>${initials(member.name)}</span>
    `;
}

register({
    type: 'person',
    render: (value, ctx) => {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        const team = ctx?.team || [];
        const members = arr.map((u) => team.find((m) => m.username === u)).filter(Boolean);
        if (members.length === 0) return html`<span></span>`;
        return html`<div style=${{ display: 'flex', paddingLeft: '4px' }}>${members.map(avatar)}</div>`;
    },
    renderEditor: (value, ctx, onChange) => {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        const team = ctx?.team || [];
        function toggle(u) {
            if (arr.includes(u)) onChange(arr.filter((x) => x !== u));
            else onChange([...arr, u]);
        }
        return html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                ${team.map((m) => html`
                    <label key=${m.username} style=${{
                        display: 'flex', gap: '8px', alignItems: 'center',
                        padding: '4px 6px', borderRadius: '4px',
                        background: arr.includes(m.username) ? 'var(--accent-soft)' : 'transparent',
                        cursor: 'pointer',
                    }}>
                        <input type="checkbox"
                               checked=${arr.includes(m.username)}
                               onChange=${() => toggle(m.username)} />
                        ${avatar(m)}
                        <span style=${{ fontSize: 'var(--fs-md)' }}>${m.name}</span>
                    </label>
                `)}
            </div>
        `;
    },
    compare: (a, b) => {
        const al = Array.isArray(a) ? a.length : 0;
        const bl = Array.isArray(b) ? b.length : 0;
        return bl - al;
    },
    defaultConfig: {},
});
