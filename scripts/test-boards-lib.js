#!/usr/bin/env node
// Unit tests para api/_lib/boards.js.
// Mockea @vercel/kv con un Map en memoria, antes de cargar boards.js.
//
// Uso: node scripts/test-boards-lib.js
// Sale 0 si pasan, 1 si fallan.

const path = require('path');
const Module = require('module');

// ─── Mock @vercel/kv ANTES de cualquier require que lo importe ──────────
const memStore = new Map();
const kvMock = {
    get: async (key) => {
        if (!memStore.has(key)) return null;
        return JSON.parse(JSON.stringify(memStore.get(key)));
    },
    set: async (key, value) => {
        memStore.set(key, JSON.parse(JSON.stringify(value)));
        return 'OK';
    },
    del: async (...keys) => {
        let n = 0;
        for (const k of keys) if (memStore.delete(k)) n += 1;
        return n;
    },
    mget: async (...args) => {
        // @vercel/kv acepta tanto array como varargs: kv.mget([k1, k2]) o kv.mget(k1, k2)
        const keys = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return keys.map((k) => (memStore.has(k) ? JSON.parse(JSON.stringify(memStore.get(k))) : null));
    },
    keys: async (pattern) => {
        // Solo soportamos patrones tipo "prefix*". Throw si llega otra cosa para evitar
        // que tests pasen silenciosamente por matchings vacíos.
        if (typeof pattern !== 'string') throw new Error('kvMock.keys: pattern debe ser string');
        if (!pattern.endsWith('*')) throw new Error('kvMock.keys: solo se soportan patrones "prefix*", recibido: ' + pattern);
        const prefix = pattern.slice(0, -1);
        return [...memStore.keys()].filter((k) => k.startsWith(prefix));
    },
};

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
    if (request === '@vercel/kv') return '@vercel/kv-mock';
    return originalResolve.call(this, request, ...args);
};
require.cache['@vercel/kv-mock'] = { id: '@vercel/kv-mock', filename: '@vercel/kv-mock', loaded: true, exports: { kv: kvMock } };

// ─── Helper assert ────────────────────────────────────────────────────────
let failures = 0;
function check(name, cond, detail) {
    if (cond) {
        console.log('PASS  ' + name);
    } else {
        console.error('FAIL  ' + name + (detail ? ' -- ' + detail : ''));
        failures += 1;
    }
}

function reset() {
    memStore.clear();
}

// ─── Load module under test (después del mock) ────────────────────────────
const boards = require(path.join(__dirname, '..', 'api', '_lib', 'boards.js'));

// ─── Tests ────────────────────────────────────────────────────────────────
(async function run() {
    // Test 0: smoke — el módulo carga y exporta constantes
    check('module loads with key helpers', typeof boards.K_INDEX === 'string');
    check('K_META is a function', typeof boards.K_META === 'function');
    check('K_META(b_crm) returns correct shape', boards.K_META('b_crm') === 'crux:boards:b_crm:meta');
    check('K_ITEM(b, i) returns correct shape', boards.K_ITEM('b_crm', 'i_acme') === 'crux:boards:b_crm:item:i_acme');

    reset();

    // Test: getBoardsIndex devuelve [] cuando vacío
    {
        const ix = await boards.getBoardsIndex();
        check('getBoardsIndex empty → []', Array.isArray(ix) && ix.length === 0);
    }

    // Test: setBoardsIndex persiste, getBoardsIndex devuelve
    {
        const sample = [
            { id: 'b_crm', name: 'CRM Pipeline', type: 'crm', color: '#3869AB', icon: 'users', visibility: 'team' },
            { id: 'b_tasks', name: 'Tareas Equipo', type: 'tasks', color: '#5CB88A', icon: 'layers', visibility: 'private', members: ['pedro@cruxmallorca.es'] },
        ];
        await boards.setBoardsIndex(sample);
        const ix = await boards.getBoardsIndex();
        check('setBoardsIndex + get round-trip', JSON.stringify(ix) === JSON.stringify(sample));
    }

    reset();

    // Test: getBoardMeta devuelve null cuando no existe
    {
        const meta = await boards.getBoardMeta('b_crm');
        check('getBoardMeta missing → null', meta === null);
    }

    // Test: round-trip de meta
    {
        const sampleMeta = {
            createdAt: '2026-05-19T10:00:00Z',
            createdBy: 'pedro@cruxmallorca.es',
            columns: [
                { id: 'col_name', type: 'text', name: 'Lead', order: 1, config: {} },
                { id: 'col_status', type: 'status', name: 'Fase', order: 2,
                  config: { options: [
                      { id: 'phase_new', label: 'Nuevo', color: '#6b7280' },
                      { id: 'phase_meeting', label: 'Reunión', color: '#3869AB' },
                  ] } },
            ],
            groups: [{ id: 'g_default', name: 'Pipeline', color: '#3869AB', order: 1, collapsed: false }],
            views: { kanban: { columnId: 'col_status' } },
            defaultView: 'kanban',
        };
        await boards.setBoardMeta('b_crm', sampleMeta);
        const got = await boards.getBoardMeta('b_crm');
        check('getBoardMeta round-trip', JSON.stringify(got) === JSON.stringify(sampleMeta));
    }

    reset();

    // Test: getItemIndex vacío
    {
        const ix = await boards.getItemIndex('b_crm');
        check('getItemIndex missing → []', Array.isArray(ix) && ix.length === 0);
    }

    // Test: round-trip + orden preservado
    {
        const arr = [
            { id: 'i_acme', groupId: 'g_default', position: 0 },
            { id: 'i_farma', groupId: 'g_default', position: 1 },
            { id: 'i_disney', groupId: 'g_default', position: 2 },
        ];
        await boards.setItemIndex('b_crm', arr);
        const got = await boards.getItemIndex('b_crm');
        check('itemIndex preserves order', got[0].id === 'i_acme' && got[2].id === 'i_disney');
    }

    reset();

    // Test: getItem missing → null
    {
        const it = await boards.getItem('b_crm', 'i_missing');
        check('getItem missing → null', it === null);
    }

    // Test: setItem + getItem
    {
        const item = {
            id: 'i_acme', boardId: 'b_crm', groupId: 'g_default',
            name: 'Acme S.L.',
            cells: { col_status: 'phase_new', col_value: 2500 },
            version: 1,
            createdAt: '2026-05-19T10:00:00Z',
            updatedAt: '2026-05-19T10:00:00Z',
            updatedBy: 'pedro@cruxmallorca.es',
        };
        await boards.setItem('b_crm', 'i_acme', item);
        const got = await boards.getItem('b_crm', 'i_acme');
        check('setItem + getItem round-trip', got.name === 'Acme S.L.' && got.version === 1);
    }

    // Test: mgetItems devuelve en el orden pedido, con nulls para missing
    {
        await boards.setItem('b_crm', 'i_a', { id: 'i_a', name: 'A', cells: {}, version: 1 });
        await boards.setItem('b_crm', 'i_b', { id: 'i_b', name: 'B', cells: {}, version: 1 });
        const arr = await boards.mgetItems('b_crm', ['i_a', 'i_missing', 'i_b']);
        check('mgetItems length', arr.length === 3);
        check('mgetItems preserves order', arr[0]?.id === 'i_a' && arr[2]?.id === 'i_b');
        check('mgetItems null for missing', arr[1] === null);
    }

    // Test: deleteItem
    {
        await boards.setItem('b_crm', 'i_del', { id: 'i_del', name: 'X', cells: {}, version: 1 });
        await boards.deleteItem('b_crm', 'i_del');
        const got = await boards.getItem('b_crm', 'i_del');
        check('deleteItem removes', got === null);
    }

    // ─── (Tasks 4-9 añaden más tests aquí, antes del console.log) ──────────

    console.log(failures === 0 ? '\nAll tests passed ✓' : '\n' + failures + ' test(s) FAILED');
    process.exit(failures === 0 ? 0 : 1);
})();
