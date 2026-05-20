// columns/tags.js
// Render: chips con color (hash de nombre).
// Editor: trigger + popover con buscador, sugerencias del board, y create-on-Enter.

import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';

function tagColor(tag, config) {
    const palette = config?.palette || ['#3869AB', '#5CB88A', '#D4A84A', '#D96B6B', '#9B5DE5', '#06B6D4', '#F59E0B', '#EC4899'];
    let h = 0;
    for (let i = 0; i < tag.length; i += 1) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
}

function TagChip({ label, config, onRemove }) {
    const color = tagColor(label, config);
    return html`
        <span class="b-chip"
              style=${{ background: color, color: '#fff' }}>
            ${label}
            ${onRemove ? html`
                <button type="button"
                        onClick=${(e) => { e.stopPropagation(); onRemove(); }}
                        aria-label=${'Quitar ' + label}
                        style=${{
                            background: 'rgba(0,0,0,0.18)',
                            color: '#fff',
                            border: 0,
                            padding: 1,
                            width: 14, height: 14,
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}>
                    <${Icon} name="x" size=${9} strokeWidth=${2.6} />
                </button>
            ` : null}
        </span>
    `;
}

register({
    type: 'tags',
    render: (value, ctx) => {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0) return html`<span></span>`;
        return html`
            <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                ${arr.map((t) => html`<${TagChip} key=${t} label=${t} config=${ctx?.column?.config} />`)}
            </div>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const arr = Array.isArray(value) ? value : [];
        return html`
            <${Popover}
                width=${280}
                trigger=${(openIt, isOpen) => html`
                    <button type="button"
                            class="b-cell-trigger"
                            data-open=${isOpen ? 'true' : 'false'}
                            onClick=${openIt}
                            aria-label=${ctx.column.name}>
                        ${arr.length === 0 ? html`
                            <span class="b-cell-trigger-placeholder">— sin tags —</span>
                        ` : html`
                            <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                                ${arr.map((t) => html`<${TagChip} key=${t} label=${t} config=${ctx?.column?.config} />`)}
                            </div>
                        `}
                        <span class="b-cell-trigger-caret">
                            <${Icon} name="chevron-down" size=${14} />
                        </span>
                    </button>
                `}>
                ${(close) => html`<${TagsPickerBody} ctx=${ctx} arr=${arr} onChange=${onChange} />`}
            <//>
        `;
    },
    compare: (a, b) => (Array.isArray(a) ? a.length : 0) - (Array.isArray(b) ? b.length : 0),
    defaultConfig: {},
});

function TagsPickerBody({ ctx, arr, onChange }) {
    const [q, setQ] = useState('');
    // Sugerencias: todos los tags presentes en items del board (estado del store)
    const itemsById = ctx?.itemsById || {};
    const columnId = ctx?.column?.id;
    const suggestions = new Set();
    for (const it of Object.values(itemsById)) {
        const v = it.cells?.[columnId];
        if (Array.isArray(v)) for (const t of v) suggestions.add(t);
    }
    const allTags = [...suggestions].sort();
    const term = q.trim();
    const filtered = allTags.filter((t) => !term || t.toLowerCase().includes(term.toLowerCase()));
    const canCreate = term && !allTags.some((t) => t.toLowerCase() === term.toLowerCase());

    function toggle(t) {
        if (arr.includes(t)) onChange(arr.filter((x) => x !== t));
        else onChange([...arr, t]);
    }
    function create() {
        if (!canCreate) return;
        if (!arr.includes(term)) onChange([...arr, term]);
        setQ('');
    }
    function onKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (canCreate) create();
        }
    }

    return html`
        <div class="b-popover-search">
            <input type="text"
                   value=${q}
                   onChange=${(e) => setQ(e.target.value)}
                   onKeyDown=${onKey}
                   placeholder="Buscar o crear tag…"
                   autoFocus />
        </div>
        <div class="b-popover-list">
            ${canCreate ? html`
                <div class="b-popover-item" onClick=${create}>
                    <${Icon} name="plus" size=${14} strokeWidth=${2.4} />
                    <span>Crear "<strong>${term}</strong>"</span>
                </div>
            ` : null}
            ${filtered.length === 0 && !canCreate ? html`
                <div class="b-popover-empty">Sin tags en este board.</div>
            ` : filtered.map((t) => {
                const selected = arr.includes(t);
                return html`
                    <div key=${t}
                         class="b-popover-item"
                         data-selected=${selected ? 'true' : 'false'}
                         onClick=${() => toggle(t)}>
                        <span class="b-chip-dot" style=${{ background: tagColor(t, ctx?.column?.config) }}></span>
                        <span>${t}</span>
                        <span class="b-popover-item-check">
                            <${Icon} name="check" size=${14} strokeWidth=${2.6} />
                        </span>
                    </div>
                `;
            })}
        </div>
        ${arr.length > 0 ? html`
            <div class="b-popover-footer" style=${{ display: 'flex', flexWrap: 'wrap', gap: 4, textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
                ${arr.map((t) => html`<${TagChip} key=${t} label=${t} config=${ctx?.column?.config} onRemove=${() => onChange(arr.filter((x) => x !== t))} />`)}
            </div>
        ` : null}
    `;
}
