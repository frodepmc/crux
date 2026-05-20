// views/KanbanView.js
// Vista Kanban: agrupa items por el valor de la columna configurada en
// meta.views.kanban.columnId. Cards verticales, DnD entre columnas.

import { html } from 'htm/react';
import { useState } from 'react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';

const NO_VALUE = '__no_value__';

function buildColumns(items, kanbanColumn) {
    const opts = kanbanColumn?.config?.options || [];
    const colDefs = opts.map((o) => ({
        key: o.id,
        label: o.label,
        color: o.color || 'var(--text-5)',
        items: [],
    }));
    const noValueCol = { key: NO_VALUE, label: 'Sin asignar', color: 'var(--text-5)', items: [] };

    for (const item of items) {
        const value = item.cells?.[kanbanColumn.id];
        const colType = getColumnType(kanbanColumn.type);
        const groupKey = colType.kanbanGroupKey ? colType.kanbanGroupKey(value, kanbanColumn.config) : value;
        const target = colDefs.find((c) => c.key === groupKey) || noValueCol;
        target.items.push(item);
    }

    return noValueCol.items.length > 0 ? [...colDefs, noValueCol] : colDefs;
}

export function KanbanView({ store }) {
    const state = useStore(store);
    const { meta, itemIndex, itemsById, team } = state;
    const [draggingId, setDraggingId] = useState(null);
    const [dropTargetKey, setDropTargetKey] = useState(null);

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;

    const kanbanColumnId = meta.views?.kanban?.columnId;
    const kanbanColumn = (meta.columns || []).find((c) => c.id === kanbanColumnId);

    if (!kanbanColumn) {
        return html`
            <div class="b-empty">
                Este board no tiene columna Kanban configurada.<br/>
                Define <code>meta.views.kanban.columnId</code> apuntando a una columna de tipo <code>status</code>.
            </div>
        `;
    }

    const items = itemIndex.map((entry) => itemsById[entry.id]).filter(Boolean);
    const columns = buildColumns(items, kanbanColumn);

    if (columns.length === 0) {
        return html`<div class="b-empty">La columna Kanban no tiene fases configuradas.</div>`;
    }

    return html`
        <div class="b-kanban-wrap">
            <div class="b-kanban">
                ${columns.map((col) => html`
                    <${KanbanColumn}
                        key=${col.key}
                        col=${col}
                        meta=${meta}
                        team=${team}
                        store=${store}
                        kanbanColumn=${kanbanColumn}
                        draggingId=${draggingId}
                        setDraggingId=${setDraggingId}
                        dropTargetKey=${dropTargetKey}
                        setDropTargetKey=${setDropTargetKey} />
                `)}
            </div>
        </div>
    `;
}

function KanbanColumn({ col, meta, team, store, kanbanColumn, draggingId, setDraggingId, dropTargetKey, setDropTargetKey }) {
    const otherColumns = (meta.columns || [])
        .filter((c) => c.id !== kanbanColumn.id)
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 3);

    function onDragOver(e) {
        e.preventDefault();
        if (draggingId && col.key !== NO_VALUE) setDropTargetKey(col.key);
    }
    async function onDrop(e) {
        e.preventDefault();
        if (!draggingId || col.key === NO_VALUE) { setDropTargetKey(null); setDraggingId(null); return; }
        const item = store.getState().itemsById[draggingId];
        if (!item) return;
        const currentValue = item.cells?.[kanbanColumn.id];
        if (currentValue !== col.key) {
            await store.updateCell(draggingId, kanbanColumn.id, col.key);
        }
        setDropTargetKey(null);
        setDraggingId(null);
    }

    return html`
        <div class="b-kanban-col"
             data-drop-active=${col.key === dropTargetKey ? 'true' : 'false'}
             onDragOver=${onDragOver}
             onDrop=${onDrop}>
            <div class="b-kanban-col-header">
                <span class="b-kanban-col-chip" style=${{ background: col.color }} />
                <span class="b-kanban-col-label">${col.label}</span>
                <span class="b-kanban-col-count">${col.items.length}</span>
            </div>
            <div class="b-kanban-col-body">
                ${col.items.length === 0
                    ? html`<div class="b-kanban-empty">Vacío</div>`
                    : col.items.map((item) => html`
                        <${KanbanCard}
                            key=${item.id}
                            item=${item}
                            otherColumns=${otherColumns}
                            team=${team}
                            store=${store}
                            isDragging=${item.id === draggingId}
                            onDragStart=${() => setDraggingId(item.id)}
                            onDragEnd=${() => { setDraggingId(null); setDropTargetKey(null); }} />
                    `)}
            </div>
        </div>
    `;
}

function KanbanCard({ item, otherColumns, team, store, isDragging, onDragStart, onDragEnd }) {
    return html`
        <div class="b-kanban-card"
             draggable="true"
             data-dragging=${isDragging ? 'true' : 'false'}
             onDragStart=${onDragStart}
             onDragEnd=${onDragEnd}
             onClick=${() => store.openDrawer(item.id)}>
            <div class="b-kanban-card-title">${item.name}</div>
            <div class="b-kanban-card-meta">
                ${otherColumns.map((col) => {
                    const ct = getColumnType(col.type);
                    const value = item.cells?.[col.id];
                    const isEmpty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
                    if (isEmpty) return null;
                    return html`
                        <div key=${col.id} class="b-kanban-card-row">
                            <span class="b-kanban-card-label">${col.name}</span>
                            ${ct.render(value, { column: col, team })}
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
}
