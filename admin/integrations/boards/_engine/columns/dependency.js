// columns/dependency.js
// Dependency: array de itemIds del mismo board. Render como pills con nombres.
import { html } from 'htm/react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';

register({
    type: 'dependency',
    render: (value, ctx) => {
        const ids = Array.isArray(value) ? value : (value ? [value] : []);
        const itemsById = ctx?.itemsById || {};
        if (ids.length === 0) return html`<span></span>`;
        return html`
            <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                ${ids.map((id) => {
                    const target = itemsById[id];
                    const label = target ? target.name : id;
                    return html`
                        <span key=${id} style=${{
                            background: 'var(--accent-chip-bg)',
                            color: 'var(--accent-chip-fg)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                        }}>
                            <${Icon} name="arrow-right" size=${10} strokeWidth=${2.6} style=${{ marginRight: '4px' }} />
                            ${label}
                        </span>
                    `;
                })}
            </div>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const ids = Array.isArray(value) ? value : (value ? [value] : []);
        const itemsById = ctx?.itemsById || {};
        const allItems = Object.values(itemsById).filter((it) => !ids.includes(it.id) && it.id !== ctx?.item?.id);
        function add(targetId) {
            if (!targetId || ids.includes(targetId)) return;
            onChange([...ids, targetId]);
        }
        function remove(targetId) {
            onChange(ids.filter((x) => x !== targetId));
        }
        return html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    ${ids.map((id) => {
                        const target = itemsById[id];
                        const label = target ? target.name : id;
                        return html`
                            <span key=${id} style=${{
                                background: 'var(--accent-chip-bg)',
                                color: 'var(--accent-chip-fg)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}>
                                <${Icon} name="arrow-right" size=${10} strokeWidth=${2.6} />
                                ${label}
                                <button onClick=${() => remove(id)} style=${{ color: 'inherit', padding: '0 2px', lineHeight: 1, display: 'inline-flex' }} aria-label="Quitar">
                                    <${Icon} name="x" size=${10} strokeWidth=${2.6} />
                                </button>
                            </span>
                        `;
                    })}
                </div>
                <select class="b-input"
                        value=""
                        onChange=${(e) => { add(e.target.value); e.target.value = ''; }}
                        aria-label="Añadir dependencia">
                    <option value="">Añadir dependencia…</option>
                    ${allItems.map((it) => html`<option key=${it.id} value=${it.id}>${it.name}</option>`)}
                </select>
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
