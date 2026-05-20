// api/_lib/boards.js
// Wrappers sobre @vercel/kv para el motor de boards.
// Aisla el shape de keys. Si V2 migra a Postgres, solo cambia este archivo.
//
// Variables de entorno requeridas (ya configuradas para finanzas/comm):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

const { kv } = require('@vercel/kv');

// ─── Key prefixes (consistente con crux:dashboard:* existentes) ──────────
const PREFIX = 'crux:boards:';
const K_INDEX = PREFIX + 'index';                                  // string array de board summaries
const K_META = (id) => PREFIX + id + ':meta';                      // board config (columns/groups/views)
const K_ITEM_INDEX = (id) => PREFIX + id + ':item-index';          // array [{id, groupId, position}]
const K_ITEM = (id, itemId) => PREFIX + id + ':item:' + itemId;    // un item con cells, version, etc.
const K_COMMENTS = (id, itemId) => PREFIX + id + ':comments:' + itemId;
const K_DEPS = (id) => PREFIX + id + ':deps';
const K_USER_PREFS = (userId) => PREFIX + 'user:' + userId + ':prefs';

// ─── boards:index ─────────────────────────────────────────────────────────
async function getBoardsIndex() {
    const data = await kv.get(K_INDEX);
    if (!Array.isArray(data)) return [];
    return data;
}

async function setBoardsIndex(arr) {
    if (!Array.isArray(arr)) throw new Error('setBoardsIndex requires array');
    await kv.set(K_INDEX, arr);
    return arr;
}

// ─── meta ────────────────────────────────────────────────────────────────
async function getBoardMeta(boardId) {
    if (!boardId) throw new Error('boardId required');
    const data = await kv.get(K_META(boardId));
    if (data == null) return null;
    return data;
}

async function setBoardMeta(boardId, meta) {
    if (!boardId) throw new Error('boardId required');
    if (!meta || typeof meta !== 'object') throw new Error('meta must be object');
    await kv.set(K_META(boardId), meta);
    return meta;
}

// ─── item-index ──────────────────────────────────────────────────────────
async function getItemIndex(boardId) {
    if (!boardId) throw new Error('boardId required');
    const data = await kv.get(K_ITEM_INDEX(boardId));
    if (!Array.isArray(data)) return [];
    return data;
}

async function setItemIndex(boardId, arr) {
    if (!boardId) throw new Error('boardId required');
    if (!Array.isArray(arr)) throw new Error('itemIndex must be array');
    await kv.set(K_ITEM_INDEX(boardId), arr);
    return arr;
}

// ─── item CRUD ───────────────────────────────────────────────────────────
async function getItem(boardId, itemId) {
    if (!boardId || !itemId) throw new Error('boardId+itemId required');
    const data = await kv.get(K_ITEM(boardId, itemId));
    if (data == null) return null;
    return data;
}

async function setItem(boardId, itemId, item) {
    if (!boardId || !itemId) throw new Error('boardId+itemId required');
    if (!item || typeof item !== 'object') throw new Error('item must be object');
    await kv.set(K_ITEM(boardId, itemId), item);
    return item;
}

async function mgetItems(boardId, itemIds) {
    if (!boardId) throw new Error('boardId required');
    if (!Array.isArray(itemIds) || itemIds.length === 0) return [];
    const keys = itemIds.map((id) => K_ITEM(boardId, id));
    const arr = await kv.mget(...keys);
    return arr.map((v) => (v == null ? null : v));
}

async function deleteItem(boardId, itemId) {
    if (!boardId || !itemId) throw new Error('boardId+itemId required');
    await kv.del(K_ITEM(boardId, itemId), K_COMMENTS(boardId, itemId));
    return true;
}

// ─── user prefs ──────────────────────────────────────────────────────────
const DEFAULT_PREFS = Object.freeze({ filters: {}, lastBoard: null, theme: 'dark' });

async function getUserPrefs(userId) {
    if (!userId) throw new Error('userId required');
    const data = await kv.get(K_USER_PREFS(userId));
    if (data == null) return JSON.parse(JSON.stringify(DEFAULT_PREFS));
    return { ...DEFAULT_PREFS, ...data, filters: { ...(data.filters || {}) } };
}

async function patchUserPrefs(userId, patch) {
    if (!userId) throw new Error('userId required');
    if (!patch || typeof patch !== 'object') throw new Error('patch must be object');
    const current = await getUserPrefs(userId);
    const next = {
        ...current,
        ...patch,
        filters: { ...current.filters, ...(patch.filters || {}) },
    };
    await kv.set(K_USER_PREFS(userId), next);
    return next;
}

module.exports = {
    PREFIX,
    K_INDEX,
    K_META,
    K_ITEM_INDEX,
    K_ITEM,
    K_COMMENTS,
    K_DEPS,
    K_USER_PREFS,
    getBoardsIndex,
    setBoardsIndex,
    getBoardMeta,
    setBoardMeta,
    getItemIndex,
    setItemIndex,
    getItem,
    setItem,
    mgetItems,
    deleteItem,
    getUserPrefs,
    patchUserPrefs,
};
