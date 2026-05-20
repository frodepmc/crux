// views/TableView.js
// Vista Tabla: render de filas + click para abrir drawer + DnD nativo de reorden.

import { html } from 'htm/react';
import { useState, useRef } from 'react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';

export function TableView({ store }) {
    const state = useStore(store);
    const { meta, itemIndex, itemsById, team } = state;
    const [draggingId, setDraggingId] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;
    const columns = (meta.columns || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const itemsInOrder = itemIndex
        .map((entry) => ({ entry, item: itemsById[entry.id] }))
        .filter((x) => x.item);

    if (itemsInOrder.length === 0) {
        return html`<div class="b-empty">No hay items en este board.</div>`;
    }

    function onDragStart(item) {
        setDraggingId(item.id);
    }
    function onDragOver(e, overItem) {
        e.preventDefault();
        if (overItem.id !== draggingId) setDropTargetId(overItem.id);
    }
    function onDragEnd() {
        setDraggingId(null);
        setDropTargetId(null);
    }
    async function onDrop(e, targetItem) {
        e.preventDefault();
        if (!draggingId || draggingId === targetItem.id) return onDragEnd();
        const targetEntry = itemIndex.find((x) => x.id === targetItem.id);
        if (!targetEntry) return onDragEnd();
        const sameGroup = itemIndex.filter((x) => x.groupId === targetEntry.groupId);
        const targetIdx = sameGroup.findIndex((x) => x.id === targetItem.id);
        await store.reorderItem(draggingId, targetEntry.groupId, targetIdx);
        onDragEnd();
    }

    return html`
        <div class="b-table-wrap">
            <table class="b-table">
                <thead>
                    <tr>
                        <th style=${{ width: '24px' }}></th>
                        <th>Nombre</th>
                        ${columns.map((c) => html`<th key=${c.id}>${c.name}</th>`)}
                    </tr>
                </thead>
                <tbody>
                    ${itemsInOrder.map(({ item }) => html`
                        <${TableRow}
                            key=${item.id}
                            item=${item}
                            columns=${columns}
                            team=${team}
                            isDragging=${item.id === draggingId}
                            isDropTarget=${item.id === dropTargetId}
                            onDragStart=${() => onDragStart(item)}
                            onDragOver=${(e) => onDragOver(e, item)}
                            onDragEnd=${onDragEnd}
                            onDrop=${(e) => onDrop(e, item)}
                            onClick=${() => store.openDrawer(item.id)} />
                    `)}
                </tbody>
            </table>
        </div>
    `;
}

function TableRow({ item, columns, team, isDragging, isDropTarget,
                   onDragStart, onDragOver, onDragEnd, onDrop, onClick }) {
    const handleRef = useRef(null);
    const [draggable, setDraggable] = useState(false);

    return html`
        <tr data-item-id=${item.id}
            data-dragging=${isDragging ? 'true' : 'false'}
            data-drop-target=${isDropTarget ? 'true' : 'false'}
            draggable=${draggable}
            onDragStart=${onDragStart}
            onDragOver=${onDragOver}
            onDragEnd=${() => { setDraggable(false); onDragEnd(); }}
            onDrop=${onDrop}
            onClick=${(e) => {
                if (e.target.closest('.b-row-handle')) return;
                onClick();
            }}>
            <td onMouseDown=${() => setDraggable(true)}
                onMouseUp=${() => setDraggable(false)}>
                <span ref=${handleRef} class="b-row-handle" aria-hidden="true">⋮⋮</span>
            </td>
            <td class="b-cell-name" data-label="Nombre">${item.name}</td>
            ${columns.map((col) => {
                const colType = getColumnType(col.type);
                const value = item.cells?.[col.id];
                return html`<td key=${col.id} data-label=${col.name}>${colType.render(value, { column: col, team })}</td>`;
            })}
        </tr>
    `;
}
