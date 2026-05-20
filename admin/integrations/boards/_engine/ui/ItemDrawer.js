// ui/ItemDrawer.js
// Drawer lateral con las cells del item, editables.
// Cada cell usa renderEditor del tipo de columna correspondiente.

import { html } from 'htm/react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';

export function ItemDrawer({ store }) {
    const state = useStore(store);
    const { drawer, itemsById, meta, team } = state;
    if (!drawer.open || !drawer.itemId) return null;
    const item = itemsById[drawer.itemId];
    if (!item) return null;

    const columns = (meta?.columns || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    function updateCell(columnId, value) {
        store.updateCell(item.id, columnId, value);
    }

    return html`
        <div class="b-drawer-veil" onClick=${() => store.closeDrawer()} />
        <aside class="b-drawer" role="dialog" aria-label="Detalle item">
            <header style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
                <h2>${item.name}</h2>
                <button onClick=${() => store.closeDrawer()} style=${{ color: 'var(--text-4)', padding: '4px 8px' }} aria-label="Cerrar">✕</button>
            </header>

            <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <${Field} label="Nombre" id="name">
                    <input class="b-input" type="text" value=${item.name}
                           onChange=${(e) => store.updateCell(item.id, '__name__', e.target.value)}
                           aria-label="Nombre" />
                <//>

                ${columns.map((col) => {
                    const ct = getColumnType(col.type);
                    return html`
                        <${Field} key=${col.id} label=${col.name} id=${col.id}>
                            ${ct.renderEditor(item.cells?.[col.id], { column: col, team }, (v) => updateCell(col.id, v))}
                        <//>
                    `;
                })}

                <div style=${{ marginTop: 'var(--sp-5)', borderTop: '1px solid var(--line-1)', paddingTop: 'var(--sp-3)' }}>
                    <button onClick=${() => {
                        if (confirm('¿Borrar este item?')) store.deleteItemById(item.id);
                    }} style=${{ color: 'var(--err)', fontSize: '0.85rem' }}>Borrar item</button>
                </div>
            </div>
        </aside>
    `;
}

function Field({ label, id, children }) {
    return html`
        <div>
            <label for=${id} style=${{
                display: 'block',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-5)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: 'var(--sp-1)',
            }}>${label}</label>
            ${children}
        </div>
    `;
}
