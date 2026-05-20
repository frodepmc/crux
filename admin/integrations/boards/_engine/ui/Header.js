// ui/Header.js
// Header con título, item count, view switcher, search bar y filter chips.

import { html } from 'htm/react';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../hooks.js';
import { defaultOpForType } from '../filters.js';
import { getColumnType } from '../columns/registry.js';
import { Icon } from './Icon.js';

const VIEWS = [
    { id: 'table',    label: 'Tabla',    enabled: true },
    { id: 'kanban',   label: 'Kanban',   enabled: true },
    { id: 'calendar', label: 'Calendar', enabled: true },
    { id: 'timeline', label: 'Timeline', enabled: true },
];

export function Header({ store, currentView, setView }) {
    const state = useStore(store);
    const { summary, itemIndex, pendingWrites, meta } = state;
    if (!summary) return null;

    const prefs = store.getBoardPrefs();
    const activeFilters = prefs.filters || [];
    const theme = state.prefs?.theme || 'dark';

    return html`
        <header class="b-header" style=${{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                <div style=${{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <div class="b-header-sub">BOARD · ${summary.type?.toUpperCase() || 'CUSTOM'}</div>
                    <div class="b-header-title">${summary.name}</div>
                    <div class="b-header-sub" style=${{ color: 'var(--text-4)', textTransform: 'none', letterSpacing: 0 }}>
                        ${itemIndex.length} items
                        ${pendingWrites > 0 ? html` · ${pendingWrites} guardando…` : null}
                    </div>
                </div>
                <div class="b-view-switcher" role="tablist">
                    ${VIEWS.map((v) => html`
                        <button key=${v.id}
                                class="b-view-btn"
                                aria-current=${currentView === v.id ? 'true' : 'false'}
                                disabled=${!v.enabled}
                                title=${v.enabled ? '' : 'Disponible en próximos milestones'}
                                onClick=${() => v.enabled && setView(v.id)}>
                            ${v.label}
                        </button>
                    `)}
                </div>
                <button class="b-theme-toggle"
                        onClick=${() => store.setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title=${theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        aria-label="Cambiar tema">
                    <${Icon} name=${theme === 'dark' ? 'sun' : 'moon'} size=${16} />
                </button>
            </div>

            <div class="b-header-search-row">
                <input class="b-search-input"
                       type="search"
                       placeholder="Buscar items en este board…"
                       value=${prefs.search || ''}
                       onChange=${(e) => store.setSearch(e.target.value)}
                       aria-label="Buscar" />

                ${(() => {
                    const t = state.summary?.type;
                    const label = t === 'crm' ? 'Nuevo lead' : t === 'tasks' ? 'Nueva tarea' : 'Nuevo item';
                    const seedName = t === 'crm' ? 'Lead sin título' : t === 'tasks' ? 'Tarea sin título' : 'Item sin título';
                    return html`
                        <button class="b-new-item-btn"
                                onClick=${async () => {
                                    const item = await store.createItem({
                                        name: seedName,
                                        groupId: state.meta?.groups?.[0]?.id || 'g_default',
                                    });
                                    if (item) store.openDrawer(item.id);
                                }}
                                aria-label=${label}>
                            <${Icon} name="plus" size=${14} strokeWidth=${2.2} />
                            ${label}
                        </button>
                    `;
                })()}

                <div class="b-filter-chips">
                    ${activeFilters.map((f) => html`
                        <${FilterChip} key=${f.columnId} filter=${f} meta=${meta} store=${store} />
                    `)}
                    <${AddFilterButton} meta=${meta} store=${store} activeFilters=${activeFilters} />
                    ${(activeFilters.length > 0 || prefs.search) ? html`
                        <button class="b-clear-all"
                                onClick=${() => { store.clearFilters(); store.setSearch(''); }}
                                aria-label="Limpiar todo">Limpiar</button>
                    ` : null}
                </div>
            </div>
        </header>
    `;
}

function FilterChip({ filter, meta, store }) {
    const col = (meta?.columns || []).find((c) => c.id === filter.columnId);
    const colName = col?.name || filter.columnId;
    const valueDisplay = describeFilterValue(filter, col);
    return html`
        <span class="b-filter-chip">
            <span class="b-filter-chip-label">${colName}:</span>
            <span>${valueDisplay}</span>
            <button class="b-filter-chip-x"
                    onClick=${() => store.removeFilter(filter.columnId)}
                    aria-label=${`Quitar filtro: ${colName}`}
                    title=${`Quitar filtro: ${colName}`}>
                <${Icon} name="x" size=${12} strokeWidth=${2.4} />
            </button>
        </span>
    `;
}

function describeFilterValue(filter, col) {
    const { op, value } = filter;
    if (op === 'in' || op === 'has-any') {
        const arr = Array.isArray(value) ? value : [];
        if (col?.type === 'status') {
            const opts = col.config?.options || [];
            return arr.map((v) => opts.find((o) => o.id === v)?.label || v).join(', ');
        }
        if (col?.type === 'person') {
            return arr.map((u) => u.split('@')[0]).join(', ');
        }
        return arr.join(', ');
    }
    if (op === 'contains') return `"${value}"`;
    if (op === 'bool') return value ? 'sí' : 'no';
    return String(value);
}

function AddFilterButton({ meta, store, activeFilters }) {
    const [open, setOpen] = useState(false);
    const [selectedColId, setSelectedColId] = useState(null);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        function onClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setSelectedColId(null);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    const filterableColumns = (meta?.columns || [])
        .filter((c) => !activeFilters.find((f) => f.columnId === c.id))
        .filter((c) => ['status', 'tags', 'person', 'dependency', 'checkbox', 'text', 'longtext', 'link', 'email', 'phone'].includes(c.type));

    function applyFilter(filter) {
        store.addFilter(filter);
        setOpen(false);
        setSelectedColId(null);
    }

    const selectedCol = filterableColumns.find((c) => c.id === selectedColId);

    return html`
        <span style=${{ position: 'relative' }} ref=${wrapRef}>
            <button class="b-filter-add" onClick=${() => setOpen(!open)} aria-label="Añadir filtro" title="Añadir filtro">
                <${Icon} name="filter" size=${12} strokeWidth=${2} />
                Filtro
            </button>
            ${open ? html`
                <div class="b-filter-popover" role="dialog" aria-label="Añadir filtro">
                    ${!selectedCol ? html`
                        <h4>Elige columna</h4>
                        ${filterableColumns.length === 0
                            ? html`<div style=${{ color: 'var(--text-5)', fontSize: 'var(--fs-sm)', fontStyle: 'italic', padding: 'var(--sp-2)' }}>No quedan columnas filtrables por añadir.</div>`
                            : filterableColumns.map((col) => html`
                                <div key=${col.id}
                                     class="b-filter-popover-row"
                                     onClick=${() => setSelectedColId(col.id)}>${col.name} <span style=${{ color: 'var(--text-5)', fontSize: '0.65rem' }}>${col.type}</span></div>
                            `)}
                    ` : html`
                        <${FilterValuePicker}
                            col=${selectedCol}
                            store=${store}
                            onCommit=${applyFilter}
                            onBack=${() => setSelectedColId(null)} />
                    `}
                </div>
            ` : null}
        </span>
    `;
}

function FilterValuePicker({ col, store, onCommit, onBack }) {
    const op = defaultOpForType(col.type);
    const state = store.getState();
    const team = state.team || [];

    const [text, setText] = useState('');
    const [selected, setSelected] = useState([]);

    function commit() {
        if (op === 'contains') {
            if (!text.trim()) return;
            onCommit({ columnId: col.id, op, value: text.trim() });
        } else if (op === 'bool') {
            onCommit({ columnId: col.id, op, value: true });
        } else {
            if (selected.length === 0) return;
            onCommit({ columnId: col.id, op, value: selected });
        }
    }

    function toggle(v) {
        setSelected(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    }

    return html`
        <h4 style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick=${onBack} style=${{ color: 'var(--text-4)', display: 'inline-flex', alignItems: 'center' }}>
                <${Icon} name="chevron-left" size=${14} />
            </button>
            ${col.name}
        </h4>

        ${op === 'contains' ? html`
            <input class="b-input" type="text" value=${text}
                   onChange=${(e) => setText(e.target.value)}
                   onKeyDown=${(e) => { if (e.key === 'Enter') commit(); }}
                   placeholder="Texto que debe contener…" autoFocus />
        ` : null}

        ${op === 'bool' ? html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div class="b-filter-popover-row" onClick=${() => onCommit({ columnId: col.id, op, value: true })}>Marcado (sí)</div>
                <div class="b-filter-popover-row" onClick=${() => onCommit({ columnId: col.id, op, value: false })}>Sin marcar (no)</div>
            </div>
        ` : null}

        ${(op === 'in' || op === 'has-any') ? html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
                ${col.type === 'status' ? (col.config?.options || []).map((opt) => html`
                    <label key=${opt.id} class="b-filter-popover-row" style=${{ background: selected.includes(opt.id) ? 'var(--accent-soft)' : 'transparent' }}>
                        <input type="checkbox"
                               checked=${selected.includes(opt.id)}
                               onChange=${() => toggle(opt.id)} />
                        <span style=${{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color }}></span>
                        ${opt.label}
                    </label>
                `) : null}

                ${col.type === 'person' ? team.map((m) => html`
                    <label key=${m.username} class="b-filter-popover-row" style=${{ background: selected.includes(m.username) ? 'var(--accent-soft)' : 'transparent' }}>
                        <input type="checkbox"
                               checked=${selected.includes(m.username)}
                               onChange=${() => toggle(m.username)} />
                        <span style=${{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: m.color, color: '#fff', fontSize: '9px', fontWeight: 700 }}>${m.name[0]}</span>
                        ${m.name}
                    </label>
                `) : null}

                ${(col.type === 'tags' || col.type === 'dependency') ? html`
                    <${TagsOrDepsPicker} col=${col} state=${state} selected=${selected} toggle=${toggle} />
                ` : null}
            </div>
        ` : null}

        <div style=${{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '8px' }}>
            <button onClick=${commit} style=${{
                background: 'var(--accent)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 'var(--r-1)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer',
            }}>Aplicar filtro</button>
        </div>
    `;
}

function TagsOrDepsPicker({ col, state, selected, toggle }) {
    // Para tags: recoger todos los tags presentes en items.
    // Para dependency: listar todos los items.
    const items = Object.values(state.itemsById || {});
    let values = [];
    if (col.type === 'tags') {
        const set = new Set();
        for (const it of items) {
            const arr = it.cells?.[col.id];
            if (Array.isArray(arr)) for (const t of arr) set.add(t);
        }
        values = [...set].sort();
    } else {
        values = items.map((it) => ({ id: it.id, label: it.name }));
    }

    if (values.length === 0) {
        return html`<div style=${{ color: 'var(--text-5)', fontSize: 'var(--fs-sm)', fontStyle: 'italic', padding: 'var(--sp-2)' }}>No hay valores que filtrar todavía.</div>`;
    }

    if (col.type === 'tags') {
        return html`
            ${values.map((t) => html`
                <label key=${t} class="b-filter-popover-row" style=${{ background: selected.includes(t) ? 'var(--accent-soft)' : 'transparent' }}>
                    <input type="checkbox" checked=${selected.includes(t)} onChange=${() => toggle(t)} />
                    ${t}
                </label>
            `)}
        `;
    }
    return html`
        ${values.map((v) => html`
            <label key=${v.id} class="b-filter-popover-row" style=${{ background: selected.includes(v.id) ? 'var(--accent-soft)' : 'transparent' }}>
                <input type="checkbox" checked=${selected.includes(v.id)} onChange=${() => toggle(v.id)} />
                ${v.label}
            </label>
        `)}
    `;
}
