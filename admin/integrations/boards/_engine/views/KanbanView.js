// views/KanbanView.js
// Vista Kanban: agrupa items por el valor de la columna configurada en
// meta.views.kanban.columnId. Cards verticales, DnD entre columnas.

import { html } from 'htm/react';
import { useState } from 'react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';
import { applyFilters } from '../filters.js';
import { Icon } from '../ui/Icon.js';

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
    const [cardDropTargetId, setCardDropTargetId] = useState(null);
    const [cardDropPosition, setCardDropPosition] = useState(null);

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;

    const kanbanColumnId = meta.views?.kanban?.columnId;
    const kanbanColumn = (meta.columns || []).find((c) => c.id === kanbanColumnId);

    if (!kanbanColumn) {
        return html`
            <div class="b-empty">
                <${Icon} name="filter" size=${28} strokeWidth=${1.5} style=${{ marginBottom: '12px', opacity: 0.5 }} />
                <div class="b-empty-title">Sin columna Kanban configurada</div>
                <div class="b-empty-sub">
                    Añade una columna de tipo <code>status</code> al board y configúrala como <code>meta.views.kanban.columnId</code>.
                </div>
            </div>
        `;
    }

    const prefs = store.getBoardPrefs();
    const allItems = itemIndex.map((entry) => itemsById[entry.id]).filter(Boolean);
    const items = applyFilters(allItems, { filters: prefs.filters, search: prefs.search });
    const columns = buildColumns(items, kanbanColumn);

    if (columns.length === 0) {
        return html`
            <div class="b-empty">
                <div class="b-empty-title">Sin fases configuradas</div>
                <div class="b-empty-sub">La columna Kanban no tiene <code>options</code> en su <code>config</code>.</div>
            </div>
        `;
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
                        setDropTargetKey=${setDropTargetKey}
                        cardDropTargetId=${cardDropTargetId}
                        setCardDropTargetId=${setCardDropTargetId}
                        cardDropPosition=${cardDropPosition}
                        setCardDropPosition=${setCardDropPosition}
                        itemIndex=${itemIndex} />
                `)}
            </div>
        </div>
    `;
}

function KanbanColumn({ col, meta, team, store, kanbanColumn, draggingId, setDraggingId, dropTargetKey, setDropTargetKey, cardDropTargetId, setCardDropTargetId, cardDropPosition, setCardDropPosition, itemIndex }) {
    const otherColumns = (meta.columns || [])
        .filter((c) => c.id !== kanbanColumn.id)
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 3);

    function onColDragOver(e) {
        e.preventDefault();
        if (draggingId && col.key !== NO_VALUE) setDropTargetKey(col.key);
    }
    async function onColDrop(e) {
        e.preventDefault();
        if (!draggingId || col.key === NO_VALUE) { setDropTargetKey(null); setDraggingId(null); return; }
        const item = store.getState().itemsById[draggingId];
        if (!item) return;
        const currentValue = item.cells?.[kanbanColumn.id];
        // Drop on empty area of column → change status if needed, push to end
        if (currentValue !== col.key) {
            await store.updateCell(draggingId, kanbanColumn.id, col.key);
        }
        setDropTargetKey(null);
        setCardDropTargetId(null);
        setCardDropPosition(null);
        setDraggingId(null);
    }

    function onCardDragOver(e, hoverItem) {
        e.preventDefault();
        e.stopPropagation();
        if (hoverItem.id === draggingId) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setCardDropTargetId(hoverItem.id);
        setCardDropPosition(e.clientY < midY ? 'top' : 'bottom');
        setDropTargetKey(col.key);
    }

    async function onCardDrop(e, hoverItem) {
        e.preventDefault();
        e.stopPropagation();
        if (!draggingId || hoverItem.id === draggingId) {
            setCardDropTargetId(null);
            setCardDropPosition(null);
            setDropTargetKey(null);
            setDraggingId(null);
            return;
        }
        const item = store.getState().itemsById[draggingId];
        if (!item) return;
        const currentStatus = item.cells?.[kanbanColumn.id];

        // 1. Si el status cambia, primero actualizar status
        if (currentStatus !== col.key) {
            await store.updateCell(draggingId, kanbanColumn.id, col.key);
        }

        // 2. Reorder dentro del item-index global
        const targetEntry = itemIndex.find((x) => x.id === hoverItem.id);
        if (targetEntry) {
            const sameGroup = itemIndex.filter((x) => x.groupId === targetEntry.groupId);
            let targetIdx = sameGroup.findIndex((x) => x.id === hoverItem.id);
            if (cardDropPosition === 'bottom') targetIdx += 1;
            const sourceIdx = sameGroup.findIndex((x) => x.id === draggingId);
            if (sourceIdx !== -1 && sourceIdx < targetIdx) targetIdx -= 1;
            await store.reorderItem(draggingId, targetEntry.groupId, targetIdx);
        }

        setCardDropTargetId(null);
        setCardDropPosition(null);
        setDropTargetKey(null);
        setDraggingId(null);
    }

    return html`
        <div class="b-kanban-col"
             data-drop-active=${col.key === dropTargetKey ? 'true' : 'false'}
             onDragOver=${onColDragOver}
             onDrop=${onColDrop}>
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
                            isDropTarget=${item.id === cardDropTargetId}
                            dropPosition=${item.id === cardDropTargetId ? cardDropPosition : null}
                            onDragStart=${() => setDraggingId(item.id)}
                            onDragOver=${(e) => onCardDragOver(e, item)}
                            onDrop=${(e) => onCardDrop(e, item)}
                            onDragEnd=${() => { setDraggingId(null); setDropTargetKey(null); setCardDropTargetId(null); setCardDropPosition(null); }} />
                    `)}
            </div>
            ${col.key !== NO_VALUE ? html`
                <button class="b-kanban-add-card"
                        onClick=${async () => {
                            const t = store.getState().summary?.type;
                            const seedName = t === 'crm' ? 'Lead sin título' : t === 'tasks' ? 'Tarea sin título' : 'Item sin título';
                            const groupId = store.getState().meta?.groups?.[0]?.id || 'g_default';
                            const item = await store.createItem({
                                name: seedName,
                                groupId,
                                cells: { [kanbanColumn.id]: col.key },
                            });
                            if (item) store.openDrawer(item.id);
                        }}
                        aria-label=${'Añadir tarjeta a ' + col.label}>
                    <${Icon} name="plus" size=${12} strokeWidth=${2.4} />
                    Añadir
                </button>
            ` : null}
        </div>
    `;
}

function KanbanCard({ item, otherColumns, team, store, isDragging, isDropTarget, dropPosition, onDragStart, onDragOver, onDragEnd, onDrop }) {
    const state = store.getState();
    return html`
        <div class="b-kanban-card"
             draggable="true"
             data-dragging=${isDragging ? 'true' : 'false'}
             data-drop-target=${isDropTarget ? 'true' : 'false'}
             data-drop-position=${isDropTarget && dropPosition ? dropPosition : 'none'}
             onDragStart=${onDragStart}
             onDragOver=${onDragOver}
             onDragEnd=${onDragEnd}
             onDrop=${onDrop}
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
                            ${ct.render(value, { column: col, team, itemsById: state.itemsById })}
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
}
