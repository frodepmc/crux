// ui/ItemDrawer.js
// Drawer lateral con las cells del item, editables.
// Cada cell usa renderEditor del tipo de columna correspondiente.

import { html } from 'htm/react';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';
import { Icon } from './Icon.js';

export function ItemDrawer({ store }) {
    const state = useStore(store);
    const { drawer, itemsById, meta, team } = state;
    if (!drawer.open || !drawer.itemId) return null;
    const item = itemsById[drawer.itemId];
    if (!item) return null;

    const columns = (meta?.columns || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    const comments = state.commentsByItemId?.[item.id];

    useEffect(() => {
        if (comments === undefined) store.loadComments(item.id);
    }, [item.id, comments]);

    // Cerrar drawer con Escape (a menos que el foco esté en un textarea con texto)
    useEffect(() => {
        function onKey(e) {
            if (e.key !== 'Escape') return;
            const tag = e.target?.tagName;
            // Si el usuario está escribiendo en un textarea con contenido, no robar el Escape
            if (tag === 'TEXTAREA' && e.target.value) return;
            store.closeDrawer();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [store]);

    function updateCell(columnId, value) {
        store.updateCell(item.id, columnId, value);
    }

    return html`
        <div class="b-drawer-veil" onClick=${() => store.closeDrawer()} />
        <aside class="b-drawer" role="dialog" aria-label="Detalle item">
            <header class="b-drawer-header">
                <h2>${item.name}</h2>
                <button class="b-btn b-btn-ghost b-btn-icon" onClick=${() => store.closeDrawer()} aria-label="Cerrar">
                    <${Icon} name="x" size=${18} />
                </button>
            </header>

            <div class="b-drawer-body">
                <${Field} label="Nombre" id="name">
                    <${NameInput} item=${item} store=${store} />
                <//>

                ${columns.map((col) => {
                    const ct = getColumnType(col.type);
                    return html`
                        <${Field} key=${col.id} label=${col.name} id=${col.id}>
                            ${ct.renderEditor(item.cells?.[col.id], { column: col, team, itemsById: state.itemsById, item }, (v) => updateCell(col.id, v))}
                        <//>
                    `;
                })}

                <${CommentsSection} store=${store} item=${item} comments=${comments || []} />

                <div style=${{ marginTop: 'var(--sp-5)', borderTop: '1px solid var(--line-1)', paddingTop: 'var(--sp-3)' }}>
                    <button class="b-btn b-btn-danger b-btn-sm" onClick=${() => { if (confirm('¿Borrar este item?')) store.deleteItemById(item.id); }}>
                        <${Icon} name="trash" size=${14} />
                        Borrar item
                    </button>
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
                fontSize: 'var(--fs-xs)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-4)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--letter-label)',
                marginBottom: '8px',
            }}>${label}</label>
            ${children}
        </div>
    `;
}

function NameInput({ item, store }) {
    const [draft, setDraft] = useState(item.name);
    const itemId = item.id;
    const ref = useRef(null);
    // Cuando el item cambia (otro user lo editó), resync el draft
    useEffect(() => { setDraft(item.name); }, [itemId, item.name]);
    useEffect(() => {
        // Autofocus + select-all when the item looks freshly created
        const seedNames = ['Item sin título', 'Lead sin título', 'Tarea sin título', 'Nuevo item'];
        if (seedNames.includes(item.name) && ref.current) {
            ref.current.focus();
            ref.current.select();
        }
    }, [itemId]);

    function commit() {
        if (draft !== item.name) store.updateCell(itemId, '__name__', draft);
    }
    return html`
        <input class="b-input" type="text" value=${draft}
               ref=${ref}
               onChange=${(e) => setDraft(e.target.value)}
               onBlur=${commit}
               onKeyDown=${(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
               aria-label="Nombre" />
    `;
}

function CommentsSection({ store, item, comments }) {
    const [draft, setDraft] = useState('');
    const [pending, setPending] = useState(false);
    const profile = store.getState().profile || (typeof window !== 'undefined' ? window.__cruxProfile : null);

    async function send() {
        if (!draft.trim() || pending) return;
        setPending(true);
        const added = await store.addComment(item.id, draft.trim());
        setPending(false);
        if (added) setDraft('');
    }

    function fmtDate(iso) {
        if (!iso) return '';
        try { return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    }

    return html`
        <div style=${{ marginTop: 'var(--sp-5)', borderTop: '1px solid var(--line-1)', paddingTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style=${{
                fontSize: 'var(--fs-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-5)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--letter-label)',
            }}>Comentarios (${comments.length})</div>

            ${comments.length === 0
                ? html`<div style=${{ color: 'var(--text-5)', fontSize: 'var(--fs-sm)', fontStyle: 'italic' }}>Sin comentarios todavía.</div>`
                : comments.map((c) => {
                    const isMine = profile && c.authorId === profile.username;
                    const isAdmin = profile && profile.role === 'admin';
                    const canDelete = isMine || isAdmin;
                    return html`
                        <div key=${c.id} style=${{
                            background: 'var(--bg-base)',
                            border: '1px solid var(--line-1)',
                            borderRadius: 'var(--r-2)',
                            padding: 'var(--sp-3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}>
                            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-5)' }}>
                                <strong style=${{ color: 'var(--text-2)' }}>${c.authorId}</strong>
                                <span style=${{ fontFamily: 'var(--font-mono)' }}>${fmtDate(c.createdAt)}</span>
                                ${canDelete ? html`
                                    <button class="b-btn b-btn-ghost b-btn-icon b-btn-sm" onClick=${() => {
                                        if (confirm('¿Borrar comentario?')) store.removeComment(item.id, c.id);
                                    }} style=${{ marginLeft: 'auto', color: 'var(--err)' }} aria-label="Borrar comentario" title=${isMine ? 'Borrar mi comentario' : 'Borrar comentario (admin)'}>
                                        <${Icon} name="trash" size=${12} />
                                    </button>
                                ` : null}
                            </div>
                            <div style=${{ color: 'var(--text-2)', fontSize: 'var(--fs-md)', whiteSpace: 'pre-wrap' }}>${c.text}</div>
                        </div>
                    `;
                })}

            <div style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <textarea class="b-input"
                          rows=${3}
                          value=${draft}
                          onChange=${(e) => setDraft(e.target.value)}
                          placeholder="Escribe un comentario…"
                          aria-label="Nuevo comentario" />
                <div style=${{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button class="b-btn b-btn-primary b-btn-sm" onClick=${send} disabled=${!draft.trim() || pending}>
                        <${Icon} name="send" size=${12} strokeWidth=${2.4} />
                        ${pending ? 'Enviando…' : 'Comentar'}
                    </button>
                </div>
            </div>
        </div>
    `;
}
