// views/TableView.js
// Vista Tabla: render de filas + click para abrir drawer + DnD nativo de reorden.

import { html } from 'htm/react';
import { useState } from 'react';
import { useStore } from '../hooks.js';
import { getColumnType } from '../columns/registry.js';
import { applyFilters, applySort } from '../filters.js';
import { Icon } from '../ui/Icon.js';

export function TableView({ store }) {
    const state = useStore(store);
    const { meta, itemIndex, itemsById, team } = state;
    const [draggingId, setDraggingId] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [dropPosition, setDropPosition] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    function toggleGroup(gid) {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(gid)) next.delete(gid);
            else next.add(gid);
            return next;
        });
    }

    if (!meta) return html`<div class="b-empty">Cargando…</div>`;
    const columns = (meta.columns || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    const prefs = store.getBoardPrefs();
    const sortActive = prefs.sortBy != null;
    const allItems = itemIndex.map((entry) => itemsById[entry.id]).filter(Boolean);
    const filtered = applyFilters(allItems, { filters: prefs.filters, search: prefs.search });
    const columnsById = Object.fromEntries((meta.columns || []).map((c) => [c.id, c]));
    let sorted = filtered;
    if (prefs.sortBy === '__name__') {
        sorted = filtered.slice().sort((a, b) => {
            const r = String(a.name || '').localeCompare(String(b.name || ''));
            return prefs.sortDir === 'desc' ? -r : r;
        });
    } else if (prefs.sortBy) {
        sorted = applySort(filtered, { sortBy: prefs.sortBy, sortDir: prefs.sortDir }, columnsById);
    }
    const itemsInOrder = sorted.map((item) => ({ entry: itemIndex.find((x) => x.id === item.id), item }));

    function toggleSort(columnId) {
        if (prefs.sortBy === columnId) {
            if (prefs.sortDir === 'asc') store.setSort(columnId, 'desc');
            else store.clearSort();
        } else {
            store.setSort(columnId, 'asc');
        }
    }
    function sortIndicator(columnId) {
        if (prefs.sortBy !== columnId) return null;
        return html`<${Icon} name=${prefs.sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size=${12} strokeWidth=${2.4} style=${{ marginLeft: '4px' }} />`;
    }

    if (itemsInOrder.length === 0) {
        if (allItems.length > 0) {
            return html`
                <div class="b-empty">
                    <${Icon} name="search" size=${28} strokeWidth=${1.5} style=${{ marginBottom: '12px', opacity: 0.5 }} />
                    <div class="b-empty-title">Sin coincidencias</div>
                    <div class="b-empty-sub">Ningún item pasa los filtros actuales.</div>
                    <button class="b-btn b-btn-primary" onClick=${() => { store.clearFilters(); store.setSearch(''); }}>
                        Limpiar filtros y búsqueda
                    </button>
                </div>
            `;
        }
        return html`
            <div class="b-empty">
                <${Icon} name="plus" size=${28} strokeWidth=${1.5} style=${{ marginBottom: '12px', opacity: 0.5 }} />
                <div class="b-empty-title">Board vacío</div>
                <div class="b-empty-sub">Aún no hay items. Crea el primero desde el header.</div>
            </div>
        `;
    }

    function onDragStart(item) {
        setDraggingId(item.id);
    }
    function onDragOver(e, overItem) {
        e.preventDefault();
        if (overItem.id === draggingId) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setDropTargetId(overItem.id);
        setDropPosition(e.clientY < midY ? 'top' : 'bottom');
    }
    function onDragEnd() {
        setDraggingId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }
    async function onDrop(e, targetItem) {
        e.preventDefault();
        if (!draggingId || draggingId === targetItem.id) return onDragEnd();
        const targetEntry = itemIndex.find((x) => x.id === targetItem.id);
        if (!targetEntry) return onDragEnd();
        const sameGroup = itemIndex.filter((x) => x.groupId === targetEntry.groupId);
        let targetIdx = sameGroup.findIndex((x) => x.id === targetItem.id);
        // If dropping on bottom half, insert AFTER target
        if (dropPosition === 'bottom') targetIdx += 1;
        // Si el dragging item está en el mismo grupo Y aparece antes del target,
        // su retirada del array hace que el index baje. Ajustar.
        const sourceIdx = sameGroup.findIndex((x) => x.id === draggingId);
        if (sourceIdx !== -1 && sourceIdx < targetIdx) targetIdx -= 1;
        await store.reorderItem(draggingId, targetEntry.groupId, targetIdx);
        onDragEnd();
    }
    async function onDropToGroup(e, groupId) {
        e.preventDefault();
        if (!draggingId) return onDragEnd();
        // Inserta al final del grupo
        const sameGroup = itemIndex.filter((x) => x.groupId === groupId && x.id !== draggingId);
        await store.reorderItem(draggingId, groupId, sameGroup.length);
        onDragEnd();
    }

    // Group items by groupId, respecting meta.groups order
    const groups = (meta.groups || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const itemsByGroupId = {};
    for (const { item, entry } of itemsInOrder) {
        const gid = item.groupId || 'g_default';
        if (!itemsByGroupId[gid]) itemsByGroupId[gid] = [];
        itemsByGroupId[gid].push({ item, entry });
    }
    // Find orphan groups (items with groupId not in meta.groups)
    const knownGroupIds = new Set(groups.map((g) => g.id));
    for (const gid of Object.keys(itemsByGroupId)) {
        if (!knownGroupIds.has(gid)) groups.push({ id: gid, name: gid, color: 'var(--text-5)', order: 999, collapsed: false });
    }
    // Per-board collapsed state — keep in component-local state for now
    const showGroups = groups.length > 1;

    return html`
        <div class="b-table-wrap">
            <table class="b-table">
                <thead>
                    <tr>
                        <th style=${{ width: '24px' }}></th>
                        <th onClick=${() => toggleSort('__name__')}
                            style=${{ cursor: 'pointer' }}>
                            Nombre${' '}${sortIndicator('__name__')}
                        </th>
                        ${columns.map((c) => html`
                            <th key=${c.id}
                                onClick=${() => toggleSort(c.id)}
                                style=${{ cursor: 'pointer' }}>
                                ${c.name}${' '}${sortIndicator(c.id)}
                            </th>
                        `)}
                    </tr>
                </thead>
                <tbody>
                    ${showGroups ? groups.map((g) => {
                        const gItems = itemsByGroupId[g.id] || [];
                        const collapsed = collapsedGroups.has(g.id);
                        return html`
                            <${GroupHeader}
                                key=${'gh-' + g.id}
                                group=${g}
                                count=${gItems.length}
                                colCount=${columns.length + 2}
                                collapsed=${collapsed}
                                onToggle=${() => toggleGroup(g.id)} />
                            ${!collapsed ? gItems.map(({ item }) => html`
                                <${TableRow}
                                    key=${item.id}
                                    item=${item}
                                    columns=${columns}
                                    team=${team}
                                    store=${store}
                                    dragDisabled=${sortActive}
                                    isDragging=${item.id === draggingId}
                                    isDropTarget=${item.id === dropTargetId}
                                    dropPosition=${item.id === dropTargetId ? dropPosition : null}
                                    onDragStart=${() => !sortActive && onDragStart(item)}
                                    onDragOver=${(e) => !sortActive && onDragOver(e, item)}
                                    onDragEnd=${onDragEnd}
                                    onDrop=${(e) => !sortActive && onDrop(e, item)}
                                    onClick=${() => store.openDrawer(item.id)} />
                            `) : null}
                            ${draggingId && !collapsed ? html`
                                <tr key=${'gdz-' + g.id} class="b-group-drop-zone"
                                    onDragOver=${(e) => { e.preventDefault(); }}
                                    onDrop=${(e) => onDropToGroup(e, g.id)}>
                                    <td colspan=${columns.length + 2}>
                                        <span>Soltar al final de ${g.name}</span>
                                    </td>
                                </tr>
                            ` : null}
                        `;
                    }) : itemsInOrder.map(({ item }) => html`
                        <${TableRow}
                            key=${item.id}
                            item=${item}
                            columns=${columns}
                            team=${team}
                            store=${store}
                            dragDisabled=${sortActive}
                            isDragging=${item.id === draggingId}
                            isDropTarget=${item.id === dropTargetId}
                            dropPosition=${item.id === dropTargetId ? dropPosition : null}
                            onDragStart=${() => !sortActive && onDragStart(item)}
                            onDragOver=${(e) => !sortActive && onDragOver(e, item)}
                            onDragEnd=${onDragEnd}
                            onDrop=${(e) => !sortActive && onDrop(e, item)}
                            onClick=${() => store.openDrawer(item.id)} />
                    `)}
                </tbody>
            </table>
        </div>
    `;
}

function TableRow({ item, columns, team, store, dragDisabled, isDragging, isDropTarget, dropPosition,
                   onDragStart, onDragOver, onDragEnd, onDrop, onClick }) {
    const [draggable, setDraggable] = useState(false);

    return html`
        <tr data-item-id=${item.id}
            data-dragging=${isDragging ? 'true' : 'false'}
            data-drop-target=${isDropTarget ? 'true' : 'false'}
            data-drop-position=${isDropTarget && dropPosition ? dropPosition : 'none'}
            draggable=${dragDisabled ? false : draggable}
            onDragStart=${onDragStart}
            onDragOver=${onDragOver}
            onDragEnd=${() => { setDraggable(false); onDragEnd(); }}
            onDrop=${onDrop}
            onClick=${(e) => {
                if (e.target.closest('.b-row-handle')) return;
                onClick();
            }}>
            <td onMouseDown=${() => !dragDisabled && setDraggable(true)}
                onMouseUp=${() => setDraggable(false)}>
                <span class="b-row-handle"
                      data-disabled=${dragDisabled ? 'true' : 'false'}
                      title=${dragDisabled ? 'Quita el sort para reordenar' : 'Arrastra para reordenar'}
                      aria-hidden="true">
                    <${Icon} name="grip-vertical" size=${14} strokeWidth=${2.2} />
                </span>
            </td>
            <td class="b-cell-name" data-label="Nombre">${item.name}</td>
            ${columns.map((col) => html`
                <${InlineCell}
                    key=${col.id}
                    item=${item}
                    column=${col}
                    team=${team}
                    store=${store} />
            `)}
        </tr>
    `;
}

function InlineCell({ item, column, team, store }) {
    const [editing, setEditing] = useState(false);
    const colType = getColumnType(column.type);
    const value = item.cells?.[column.id];
    const state = store.getState();

    function onClickCell(e) {
        // Status / tags / person / date / etc. — el click activa el editor;
        // longtext y dependency siguen viviendo en el drawer (mejor UX para esos).
        if (column.type === 'longtext' || column.type === 'dependency') return;
        e.stopPropagation();
        setEditing(true);
    }

    function onChange(v) {
        store.updateCell(item.id, column.id, v);
    }

    function commit() {
        setEditing(false);
    }

    if (editing) {
        return html`
            <td data-label=${column.name}
                onBlur=${(e) => {
                    // Cerrar editor si el blur sale del <td>
                    if (!e.currentTarget.contains(e.relatedTarget)) commit();
                }}
                onKeyDown=${(e) => { if (e.key === 'Escape') commit(); }}
                onClick=${(e) => e.stopPropagation()}>
                ${colType.renderEditor(value, { column, team, itemsById: state.itemsById, item }, onChange)}
            </td>
        `;
    }

    return html`
        <td data-label=${column.name}
            onClick=${onClickCell}
            style=${{ cursor: (column.type === 'longtext' || column.type === 'dependency') ? 'pointer' : 'cell' }}>
            ${colType.render(value, { column, team, itemsById: state.itemsById })}
        </td>
    `;
}

function GroupHeader({ group, count, colCount, collapsed, onToggle }) {
    return html`
        <tr class="b-group-header" onClick=${onToggle}>
            <td colspan=${colCount}>
                <div class="b-group-header-inner">
                    <span class="b-group-chevron" data-collapsed=${collapsed ? 'true' : 'false'}>
                        <${Icon} name="chevron-down" size=${14} strokeWidth=${2.4} />
                    </span>
                    <span class="b-group-color" style=${{ background: group.color || 'var(--accent)' }}></span>
                    <span class="b-group-name">${group.name}</span>
                    <span class="b-group-count">${count}</span>
                </div>
            </td>
        </tr>
    `;
}
