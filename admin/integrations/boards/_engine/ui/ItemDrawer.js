// ui/ItemDrawer.js
// Drawer lateral con las cells del item, editables.
// Cada cell usa renderEditor del tipo de columna correspondiente.

import { html } from 'htm/react';
import { useEffect, useState } from 'react';
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

    function updateCell(columnId, value) {
        store.updateCell(item.id, columnId, value);
    }

    return html`
        <div class="b-drawer-veil" onClick=${() => store.closeDrawer()} />
        <aside class="b-drawer" role="dialog" aria-label="Detalle item">
            <header style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
                <h2>${item.name}</h2>
                <button onClick=${() => store.closeDrawer()} style=${{ color: 'var(--text-4)', padding: '4px 8px' }} aria-label="Cerrar"><${Icon} name="x" size=${18} /></button>
            </header>

            <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
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
                    <button onClick=${() => {
                        if (confirm('¿Borrar este item?')) store.deleteItemById(item.id);
                    }} style=${{ color: 'var(--err)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
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
    // Cuando el item cambia (otro user lo editó), resync el draft
    useEffect(() => { setDraft(item.name); }, [itemId, item.name]);

    function commit() {
        if (draft !== item.name) store.updateCell(itemId, '__name__', draft);
    }
    return html`
        <input class="b-input" type="text" value=${draft}
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
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-5)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
            }}>Comentarios (${comments.length})</div>

            ${comments.length === 0
                ? html`<div style=${{ color: 'var(--text-5)', fontSize: '0.8rem', fontStyle: 'italic' }}>Sin comentarios todavía.</div>`
                : comments.map((c) => {
                    const isMine = profile && c.authorId === profile.username;
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
                            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-5)' }}>
                                <strong style=${{ color: 'var(--text-2)' }}>${c.authorId}</strong>
                                <span style=${{ fontFamily: 'var(--font-mono)' }}>${fmtDate(c.createdAt)}</span>
                                ${isMine ? html`
                                    <button onClick=${() => {
                                        if (confirm('¿Borrar comentario?')) store.removeComment(item.id, c.id);
                                    }} style=${{ marginLeft: 'auto', color: 'var(--err)', display: 'inline-flex', alignItems: 'center' }} aria-label="Borrar comentario">
                                        <${Icon} name="trash" size=${12} />
                                    </button>
                                ` : null}
                            </div>
                            <div style=${{ color: 'var(--text-2)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>${c.text}</div>
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
                    <button onClick=${send} disabled=${!draft.trim() || pending} style=${{
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--r-1)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        opacity: (!draft.trim() || pending) ? 0.4 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <${Icon} name="send" size=${12} strokeWidth=${2.2} />
                        ${pending ? 'Enviando…' : 'Comentar'}
                    </button>
                </div>
            </div>
        </div>
    `;
}
