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
    loading: true,
    error: null,
    drawer: { open: false, itemId: null },
    toasts: [],              // [{ id, tone, text }]
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
            setState({
                summary,
                meta: meta.meta,
                itemIndex: items.itemIndex,
                itemsById: items.items,
                prefs: prefs.prefs,
                team: team.team || [],
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

    // ── Drawer ────────────────────────────────────────────────────────
    function openDrawer(itemId) { setState({ drawer: { open: true, itemId } }); }
    function closeDrawer()      { setState({ drawer: { open: false, itemId: null } }); }

    return {
        getState, subscribe,
        hydrate, updateCell, reorderItem, createItem, deleteItemById,
        openDrawer, closeDrawer,
        pushToast,
    };
}
