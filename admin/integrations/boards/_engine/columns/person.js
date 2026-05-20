// columns/person.js
// Render: stack de avatares con iniciales.
// Editor: trigger + popover con buscador + lista filtrable.

import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';

function initials(name) {
    if (!name) return '?';
    return name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function Avatar({ member, size = 'sm' }) {
    return html`
        <span class=${size === 'lg' ? 'b-avatar b-avatar-lg' : 'b-avatar'}
              title=${member.name}
              style=${{ background: member.color || 'var(--accent)' }}>
            ${initials(member.name)}
        </span>
    `;
}

register({
    type: 'person',
    render: (value, ctx) => {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        const team = ctx?.team || [];
        const members = arr.map((u) => team.find((m) => m.username === u)).filter(Boolean);
        if (members.length === 0) return html`<span></span>`;
        return html`
            <div style=${{ display: 'flex', paddingLeft: '4px' }}>
                ${members.map((m, i) => html`
                    <span key=${m.username} style=${{ marginLeft: i === 0 ? 0 : '-7px' }}>
                        <${Avatar} member=${m} />
                    </span>
                `)}
            </div>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        const team = ctx?.team || [];
        const selectedMembers = arr.map((u) => team.find((m) => m.username === u)).filter(Boolean);

        function toggle(u) {
            if (arr.includes(u)) onChange(arr.filter((x) => x !== u));
            else onChange([...arr, u]);
        }

        return html`
            <${Popover}
                width=${280}
                trigger=${(openIt, isOpen) => html`
                    <button type="button"
                            class="b-cell-trigger"
                            data-open=${isOpen ? 'true' : 'false'}
                            onClick=${openIt}
                            aria-label=${ctx.column.name}>
                        ${selectedMembers.length === 0 ? html`
                            <span class="b-cell-trigger-placeholder">— sin asignar —</span>
                        ` : html`
                            <div style=${{ display: 'flex' }}>
                                ${selectedMembers.map((m, i) => html`
                                    <span key=${m.username} style=${{ marginLeft: i === 0 ? 0 : '-7px' }}>
                                        <${Avatar} member=${m} />
                                    </span>
                                `)}
                            </div>
                            <span style=${{ color: 'var(--text-3)' }}>
                                ${selectedMembers.length === 1 ? selectedMembers[0].name : `${selectedMembers.length} personas`}
                            </span>
                        `}
                        <span class="b-cell-trigger-caret">
                            <${Icon} name="chevron-down" size=${14} />
                        </span>
                    </button>
                `}>
                ${(close) => html`<${PersonPickerBody} team=${team} arr=${arr} toggle=${toggle} />`}
            <//>
        `;
    },
    compare: (a, b) => {
        const al = Array.isArray(a) ? a.length : 0;
        const bl = Array.isArray(b) ? b.length : 0;
        return bl - al;
    },
    defaultConfig: {},
});

function PersonPickerBody({ team, arr, toggle }) {
    const [q, setQ] = useState('');
    const filtered = team.filter((m) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return (m.name || '').toLowerCase().includes(s) || (m.username || '').toLowerCase().includes(s);
    });
    return html`
        <div class="b-popover-search">
            <input type="text"
                   value=${q}
                   onChange=${(e) => setQ(e.target.value)}
                   placeholder="Buscar persona…"
                   autoFocus />
        </div>
        <div class="b-popover-list">
            ${filtered.length === 0 ? html`
                <div class="b-popover-empty">Sin coincidencias.</div>
            ` : filtered.map((m) => {
                const selected = arr.includes(m.username);
                return html`
                    <div key=${m.username}
                         class="b-popover-item"
                         data-selected=${selected ? 'true' : 'false'}
                         onClick=${() => toggle(m.username)}>
                        <span style=${{ background: m.color, width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                            ${(m.name || '?').slice(0, 1)}
                        </span>
                        <span>${m.name}</span>
                        <span class="b-popover-item-check">
                            <${Icon} name="check" size=${14} strokeWidth=${2.6} />
                        </span>
                    </div>
                `;
            })}
        </div>
    `;
}
