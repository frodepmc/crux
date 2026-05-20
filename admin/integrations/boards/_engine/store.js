// admin/integrations/boards/_engine/store.js
// BoardStore: estado normalizado, escritura optimista, suscripciones.
// Las vistas son funciones puras que reciben snapshot del store.

import { api, ApiError } from './api.js';

const initialState = {
    boardId: null,
    summary: null,           // { id, name, color, icon, visibility, members? }
    meta: null,              // { columns, groups, views, defaultView }
    itemIndex: [],           // [{id, groupId, position}]
    itemsById: {},           // { itemId: {id, name, cells, version, ...} }
    prefs: { filters: {}, lastBoard: null, theme: 'dark' },
    team: [],                // [{ username, name, color }]
    profile: null,
    loading: true,
    error: null,
    drawer: { open: false, itemId: null },
    toasts: [],              // [{ id, tone, text }]
    commentsByItemId: {},    // { itemId: [{id, authorId, text, createdAt}] }
    pendingWrites: 0,
};

export function createStore(boardId) {
    let state = { ...initialState, boardId };
    const subs = new Set();

    function getState() { return state; }
    function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
    function notify() { subs.forEach((fn) => fn()); }
    function setState(patch) { state = { ...state, ...patch }; notify(); }

    function pushToast(tone, text, ttl = 4000) {
        const id = Math.random().toString(36).slice(2, 8);
        setState({ toasts: [...state.toasts, { id, tone, text }] });
        if (ttl) setTimeout(() => setState({ toasts: state.toasts.filter((t) => t.id !== id) }), ttl);
    }

    // ── Filters / search / sort (per-board, persisted to user-prefs) ──
    function getBoardPrefs() {
        return state.prefs.filters?.[boardId] || { filters: [], search: '', sortBy: null, sortDir: 'asc' };
    }

    function setTheme(theme) {
        const next = (theme === 'light' || theme === 'dark') ? theme : 'dark';
        setState({ prefs: { ...state.prefs, theme: next } });
        // Apply to DOM
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', next);
        }
        // Persist (debounced via schedulePersist trick — but we want lastBoard too)
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(async () => {
            try {
                await api.patchUserPrefs({ theme: next, lastBoard: boardId });
            } catch (err) {
                console.warn('[boards] persist theme failed:', err.message);
            }
        }, 400);
    }

    let persistTimer = null;
    function schedulePersist() {
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(async () => {
            try {
                const patch = {
                    filters: { ...state.prefs.filters, [boardId]: getBoardPrefs() },
                    lastBoard: boardId,
                };
                await api.patchUserPrefs(patch);
            } catch (err) {
                console.warn('[boards] persist prefs failed:', err.message);
            }
        }, 400);
    }

    function setBoardPrefs(patch) {
        const current = getBoardPrefs();
        const next = { ...current, ...patch };
        setState({
            prefs: {
                ...state.prefs,
                filters: { ...state.prefs.filters, [boardId]: next },
            },
        });
        schedulePersist();
    }

    function setSearch(text) { setBoardPrefs({ search: text || '' }); }
    function setSort(columnId, dir) { setBoardPrefs({ sortBy: columnId, sortDir: dir || 'asc' }); }
    function clearSort() { setBoardPrefs({ sortBy: null, sortDir: 'asc' }); }

    function addFilter(filter) {
        const current = getBoardPrefs();
        // Reemplazar si ya existe filtro para ese columnId
        const others = (current.filters || []).filter((f) => f.columnId !== filter.columnId);
        setBoardPrefs({ filters: [...others, filter] });
    }
    function removeFilter(columnId) {
        const current = getBoardPrefs();
        setBoardPrefs({ filters: (current.filters || []).filter((f) => f.columnId !== columnId) });
    }
    function clearFilters() {
        setBoardPrefs({ filters: [] });
    }

    // ── Hydrate ────────────────────────────────────────────────────────
    async function hydrate() {
        setState({ loading: true, error: null });
        try {
            const [list, meta, items, prefs, team] = await Promise.all([
                api.listBoards(),
                api.getMeta(boardId),
                api.getItems(boardId),
                api.getUserPrefs(),
                fetch('/api/auth/team', { credentials: 'same-origin' }).then((r) => r.json()),
            ]);
            const summary = (list.boards || []).find((b) => b.id === boardId);
            if (!summary) throw new Error('Board not visible to user');
            // M6: apply persisted theme on load
            if (typeof document !== 'undefined' && prefs.prefs?.theme) {
                document.documentElement.setAttribute('data-theme', prefs.prefs.theme);
            }
            setState({
                summary,
                meta: meta.meta,
                itemIndex: items.itemIndex,
                itemsById: items.items,
                prefs: prefs.prefs,
                team: team.team || [],
                profile: (typeof window !== 'undefined' && window.__cruxProfile) || null,
                loading: false,
            });
        } catch (err) {
            setState({ loading: false, error: err.message || 'Failed to load' });
            pushToast('err', 'Error cargando el board: ' + (err.message || 'desconocido'));
        }
    }

    // ── Optimistic cell/name update ──────────────────────────────────────
    async function updateCell(itemId, columnId, value) {
        const current = state.itemsById[itemId];
        if (!current) return;
        const isName = columnId === '__name__';
        const optimistic = isName
            ? { ...current, name: String(value || '').slice(0, 200), updatedAt: new Date().toISOString() }
            : { ...current, cells: { ...current.cells, [columnId]: value }, updatedAt: new Date().toISOString() };
        setState({
            itemsById: { ...state.itemsById, [itemId]: optimistic },
            pendingWrites: state.pendingWrites + 1,
        });
        try {
            const body = isName ? { name: value, version: current.version } : { cells: { [columnId]: value }, version: current.version };
            const resp = await api.patchItem(boardId, itemId, body);
            setState({
                itemsById: { ...state.itemsById, [itemId]: resp.item },
                pendingWrites: state.pendingWrites - 1,
            });
        } catch (err) {
            setState({ pendingWrites: state.pendingWrites - 1 });
            if (err instanceof ApiError && err.status === 409) {
                const server = err.body.serverItem;
                setState({ itemsById: { ...state.itemsById, [itemId]: server } });
                pushToast('warn', 'Conflicto: ' + (server.updatedBy || 'alguien') + ' editó esto antes. Recargado.');
            } else {
                pushToast('err', 'No se pudo guardar: ' + (err.message || 'red'));
            }
        }
    }

    // ── Reorder ───────────────────────────────────────────────────────
    async function reorderItem(itemId, groupId, position) {
        const oldIndex = state.itemIndex;
        const entry = oldIndex.find((x) => x.id === itemId);
        if (!entry) return;
        // Optimistic: mover en local
        const without = oldIndex.filter((x) => x.id !== itemId);
        const newEntry = { ...entry, groupId };
        const sameGroup = without.filter((x) => x.groupId === groupId);
        const targetPos = Math.max(0, Math.min(position, sameGroup.length));
        const next = [];
        let seen = 0, inserted = false;
        for (const e of without) {
            if (!inserted && e.groupId === groupId && seen === targetPos) {
                next.push(newEntry); inserted = true;
            }
            if (e.groupId === groupId) seen += 1;
            next.push(e);
        }
        if (!inserted) next.push(newEntry);
        setState({ itemIndex: next });
        try {
            const resp = await api.reorderItem(boardId, { itemId, groupId, position: targetPos });
            setState({ itemIndex: resp.itemIndex });
        } catch (err) {
            setState({ itemIndex: oldIndex });
            pushToast('err', 'No se pudo reordenar: ' + (err.message || 'red'));
        }
    }

    // ── Item CRUD ─────────────────────────────────────────────────────
    async function createItem(payload) {
        try {
            const resp = await api.createItem(boardId, payload);
            const item = resp.item;
            setState({
                itemsById: { ...state.itemsById, [item.id]: item },
                itemIndex: [...state.itemIndex, { id: item.id, groupId: item.groupId, position: state.itemIndex.length }],
            });
            return item;
        } catch (err) {
            pushToast('err', 'No se pudo crear: ' + (err.message || 'red'));
            return null;
        }
    }

    async function deleteItemById(itemId) {
        const optimistic = { ...state.itemsById };
        delete optimistic[itemId];
        const newIndex = state.itemIndex.filter((x) => x.id !== itemId);
        setState({ itemsById: optimistic, itemIndex: newIndex, drawer: { open: false, itemId: null } });
        try {
            await api.deleteItem(boardId, itemId);
        } catch (err) {
            pushToast('err', 'No se pudo borrar: ' + (err.message || 'red'));
            await hydrate();  // re-sync
        }
    }

    // ── Comments ──────────────────────────────────────────────────────
    async function loadComments(itemId) {
        if (state.commentsByItemId[itemId] !== undefined) return state.commentsByItemId[itemId];
        try {
            const resp = await api.listComments(boardId, itemId);
            setState({ commentsByItemId: { ...state.commentsByItemId, [itemId]: resp.comments || [] } });
            return resp.comments || [];
        } catch (err) {
            pushToast('err', 'No se pudieron cargar comentarios: ' + (err.message || 'red'));
            return [];
        }
    }

    async function addComment(itemId, text) {
        if (!text || !text.trim()) return null;
        try {
            const resp = await api.addComment(boardId, itemId, text);
            const current = state.commentsByItemId[itemId] || [];
            setState({ commentsByItemId: { ...state.commentsByItemId, [itemId]: [...current, resp.comment] } });
            return resp.comment;
        } catch (err) {
            pushToast('err', 'No se pudo añadir comentario: ' + (err.message || 'red'));
            return null;
        }
    }

    async function removeComment(itemId, commentId) {
        const current = state.commentsByItemId[itemId] || [];
        const optimistic = current.filter((c) => c.id !== commentId);
        setState({ commentsByItemId: { ...state.commentsByItemId, [itemId]: optimistic } });
        try {
            await api.deleteComment(boardId, itemId, commentId);
        } catch (err) {
            // Rollback
            setState({ commentsByItemId: { ...state.commentsByItemId, [itemId]: current } });
            pushToast('err', 'No se pudo borrar comentario: ' + (err.message || 'red'));
        }
    }

    // ── Drawer ────────────────────────────────────────────────────────
    function openDrawer(itemId) { setState({ drawer: { open: true, itemId } }); }
    function closeDrawer()      { setState({ drawer: { open: false, itemId: null } }); }

    return {
        getState, subscribe,
        hydrate, updateCell, reorderItem, createItem, deleteItemById,
        loadComments, addComment, removeComment,
        openDrawer, closeDrawer,
        pushToast,
        getBoardPrefs, setSearch, setSort, clearSort, addFilter, removeFilter, clearFilters,
        setTheme,
    };
}
