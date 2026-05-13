#!/usr/bin/env node
// Verifica que requireIntegrationAccess relee ADMIN_USERS fresco en cada request,
// en lugar de fiarse del access congelado en el JWT (firmado en el login).
//
// Uso:
//   node scripts/test-auth-fresh-access.js
//
// Sale con codigo 0 si todo pasa, 1 si algun caso falla.

process.env.JWT_SECRET = 'x'.repeat(40);

const path = require('path');
const authPath = path.join(__dirname, '..', 'api', '_lib', 'auth.js');
const { signSession, requireIntegrationAccess } = require(authPath);

function mockReqRes(token) {
    let statusCode = null;
    let body = null;
    const res = {
        status(c) { statusCode = c; return this; },
        json(b) { body = b; return this; },
        get statusCode() { return statusCode; },
        get body() { return body; },
    };
    Object.defineProperty(res, 'result', { get: () => ({ statusCode, body }) });
    const req = { headers: { cookie: 'crux_admin_session=' + token } };
    return { req, res };
}

function setUsers(users) {
    process.env.ADMIN_USERS = JSON.stringify(users);
}

let failures = 0;
function check(name, cond, detail) {
    if (cond) {
        console.log('PASS  ' + name);
    } else {
        console.error('FAIL  ' + name + (detail ? ' -- ' + detail : ''));
        failures += 1;
    }
}

// ─── Setup: alice login con access stale = solo financial ─────────────────
setUsers([{ u: 'alice', p: '$2a$12$dummy', role: 'admin', name: 'Alice', color: '#000', access: ['financial'] }]);
const staleToken = signSession({ username: 'alice', role: 'admin', access: ['financial'] });

// ─── Caso 1: tras anadir 'communication' en ADMIN_USERS, alice debe entrar ─
setUsers([{ u: 'alice', p: '$2a$12$dummy', role: 'admin', name: 'Alice', color: '#000', access: ['financial', 'communication'] }]);
{
    const { req, res } = mockReqRes(staleToken);
    const session = requireIntegrationAccess(req, res, 'communication');
    check(
        'JWT viejo + ADMIN_USERS nuevo con communication -> permite acceso',
        session !== null && Array.isArray(session.access) && session.access.includes('communication'),
        'res.result=' + JSON.stringify(res.result) + ' session=' + JSON.stringify(session)
    );
}

// ─── Caso 2: si ADMIN_USERS no incluye communication, debe denegar 403 ────
setUsers([{ u: 'alice', p: '$2a$12$dummy', role: 'admin', name: 'Alice', color: '#000', access: ['financial'] }]);
{
    const { req, res } = mockReqRes(staleToken);
    const session = requireIntegrationAccess(req, res, 'communication');
    check(
        'ADMIN_USERS sin communication -> 403',
        session === null && res.result.statusCode === 403,
        'res.result=' + JSON.stringify(res.result)
    );
}

// ─── Caso 3: alice borrada de ADMIN_USERS -> 401 ──────────────────────────
setUsers([]);
{
    const { req, res } = mockReqRes(staleToken);
    const session = requireIntegrationAccess(req, res, 'communication');
    check(
        'Usuario borrado de ADMIN_USERS -> 401',
        session === null && res.result.statusCode === 401,
        'res.result=' + JSON.stringify(res.result)
    );
}

// ─── Caso 4: sin cookie -> 401 ────────────────────────────────────────────
setUsers([{ u: 'alice', p: '$2a$12$dummy', role: 'admin', name: 'Alice', color: '#000', access: ['*'] }]);
{
    const req = { headers: {} };
    let statusCode = null, body = null;
    const res = { status(c){statusCode=c;return this;}, json(b){body=b;return this;} };
    const session = requireIntegrationAccess(req, res, 'communication');
    check(
        'Sin cookie -> 401',
        session === null && statusCode === 401,
        'statusCode=' + statusCode + ' body=' + JSON.stringify(body)
    );
}

// ─── Caso 5: access = ['*'] (wildcard) sigue funcionando ──────────────────
setUsers([{ u: 'alice', p: '$2a$12$dummy', role: 'admin', name: 'Alice', color: '#000', access: ['*'] }]);
{
    const { req, res } = mockReqRes(staleToken);
    const session = requireIntegrationAccess(req, res, 'communication');
    check(
        'access wildcard ["*"] -> permite acceso',
        session !== null && session.access.includes('*'),
        'res.result=' + JSON.stringify(res.result)
    );
}

if (failures > 0) {
    console.error('\n' + failures + ' caso(s) fallaron');
    process.exit(1);
}
console.log('\nTodos los casos OK');
