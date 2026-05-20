// admin/integrations/boards/_engine/filters.js
// Helpers puros para filtrar y ordenar items según filtros activos.
//
// Shape de un filtro: { columnId, op, value }
//   op === 'in'        → value es array; value.includes(cell) (status, person, tags items)
//   op === 'contains'  → value es string; substring case-insensitive (text/longtext/link/email/phone)
//   op === 'bool'      → value es true | false; cell debe coincidir (checkbox)
//   op === 'has-any'   → value es array; algún elemento de value está en cell (array) (tags, person, dependency)
//
// Búsqueda: string que se compara contra item.name (substring case-insensitive).

import { getColumnType } from './columns/registry.js';

function norm(s) { return String(s || '').toLowerCase(); }

function cellMatches(cellValue, filter) {
    const { op, value } = filter;
    if (op === 'in') {
        if (!Array.isArray(value) || value.length === 0) return true;
        return value.includes(cellValue);
    }
    if (op === 'contains') {
        if (!value) return true;
        return norm(cellValue).includes(norm(value));
    }
    if (op === 'bool') {
        if (value == null) return true;
        return Boolean(cellValue) === Boolean(value);
    }
    if (op === 'has-any') {
        if (!Array.isArray(value) || value.length === 0) return true;
        const arr = Array.isArray(cellValue) ? cellValue : (cellValue ? [cellValue] : []);
        return value.some((v) => arr.includes(v));
    }
    return true;
}

export function applyFilters(items, { filters = [], search = '' }) {
    const term = norm(search);
    return items.filter((item) => {
        if (term && !norm(item.name).includes(term)) return false;
        for (const f of filters) {
            const cell = item.cells?.[f.columnId];
            if (!cellMatches(cell, f)) return false;
        }
        return true;
    });
}

export function applySort(items, { sortBy = null, sortDir = 'asc' }, columnsById) {
    if (!sortBy) return items;
    const col = columnsById?.[sortBy];
    if (!col) return items;
    const type = getColumnType(col.type);
    const cmp = type?.compare;
    if (!cmp) return items;
    const arr = items.slice();
    arr.sort((a, b) => {
        const av = a.cells?.[sortBy];
        const bv = b.cells?.[sortBy];
        const result = cmp(av, bv, col.config);
        return sortDir === 'desc' ? -result : result;
    });
    return arr;
}

// Helper "operador default" por tipo de columna — usado por la UI para construir filtros nuevos.
export function defaultOpForType(type) {
    switch (type) {
        case 'status':     return 'in';
        case 'tags':
        case 'person':
        case 'dependency': return 'has-any';
        case 'checkbox':   return 'bool';
        default:           return 'contains';
    }
}
