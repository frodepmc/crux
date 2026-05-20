#!/usr/bin/env node
// Smoke test de endpoints de boards contra `vercel dev`.
//
// Requisito: ejecutar `vercel dev --listen 3000` en otro terminal antes.
// Requiere ADMIN_USERS local con un usuario con access:['boards'] o ['*'].
//
// Uso: BASE=http://localhost:3000 SESSION=<jwt> node scripts/test-boards-endpoints.js
//
// (El JWT lo obtienes con curl POST /api/auth/login con tu password.)

const BASE = process.env.BASE || 'http://localhost:3000';
const COOKIE = process.env.SESSION ? 'crux_admin_session=' + process.env.SESSION : '';

let failures = 0;
function check(name, cond, detail) {
    if (cond) console.log('PASS  ' + name);
    else { console.error('FAIL  ' + name + (detail ? ' -- ' + detail : '')); failures += 1; }
}

async function api(method, path, body) {
    const r = await fetch(BASE + path, {
        method,
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, data };
}

(async function run() {
    if (!COOKIE) {
        console.error('FAIL  SESSION env var required (cookie value)');
        process.exit(1);
    }

    // Test: crear board
    const created = await api('POST', '/api/boards', {
        name: 'Smoke Test Board',
        type: 'custom',
        visibility: 'team',
    });
    check('POST /api/boards 201', created.status === 201);
    check('POST returns id', created.data && created.data.id && created.data.id.startsWith('b_'));
    const bid = created.data.id;

    // Test: listar boards
    const listed = await api('GET', '/api/boards');
    check('GET /api/boards 200', listed.status === 200);
    check('listed includes new board', listed.data.boards.some((b) => b.id === bid));

    // Test: PATCH meta
    const metaBody = {
        columns: [{ id: 'col_name', type: 'text', name: 'Lead', order: 1, config: {} }],
        groups: [{ id: 'g_default', name: 'Pipeline', color: '#3869AB', order: 1, collapsed: false }],
        views: {},
        defaultView: 'table',
    };
    const metaResp = await api('PATCH', `/api/boards/${bid}/meta`, metaBody);
    check('PATCH meta 200', metaResp.status === 200);
    check('GET meta returns column', (await api('GET', `/api/boards/${bid}/meta`)).data.meta.columns.length === 1);

    // Test: crear item
    const itemResp = await api('POST', `/api/boards/${bid}/items`, {
        name: 'Test Lead',
        cells: { col_name: 'Test Lead' },
    });
    check('POST item 201', itemResp.status === 201);
    const iid = itemResp.data.item.id;

    // Test: GET items devuelve el item
    const itemsList = await api('GET', `/api/boards/${bid}/items`);
    check('GET items 200', itemsList.status === 200);
    check('items map has new item', itemsList.data.items[iid]);

    // Test: PATCH item con CAS correcto
    const patched = await api('PATCH', `/api/boards/${bid}/items/${iid}`, {
        cells: { col_name: 'Edited Lead' },
        version: 1,
    });
    check('PATCH item 200', patched.status === 200);
    check('PATCH item version incremented', patched.data.item.version === 2);

    // Test: PATCH item con CAS stale → 409
    const conflict = await api('PATCH', `/api/boards/${bid}/items/${iid}`, {
        cells: { col_name: 'X' },
        version: 1,  // stale
    });
    check('PATCH conflict 409', conflict.status === 409);
    check('409 includes serverVersion', conflict.data && conflict.data.serverVersion === 2);

    // Cleanup
    await api('DELETE', `/api/boards/${bid}`);
    const after = await api('GET', `/api/boards/${bid}/meta`);
    check('DELETE cascade clears meta', after.status === 404);

    console.log(failures === 0 ? '\nAll smoke tests passed ✓' : '\n' + failures + ' test(s) FAILED');
    process.exit(failures === 0 ? 0 : 1);
})();
