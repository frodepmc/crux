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

    // ─── (Tasks 4-9 añaden más tests aquí, antes del console.log) ──────────

    console.log(failures === 0 ? '\nAll tests passed ✓' : '\n' + failures + ' test(s) FAILED');
    process.exit(failures === 0 ? 0 : 1);
})();
