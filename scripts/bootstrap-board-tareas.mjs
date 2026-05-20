#!/usr/bin/env node
// scripts/bootstrap-board-tareas.mjs
// Crea el board "Tareas Equipo" con columnas, grupos (sprint actual + backlog) y items seed.
//
// Requiere: vercel dev + SESSION env var con JWT.
// Uso:
//   BASE=http://localhost:3000 SESSION=<jwt> node scripts/bootstrap-board-tareas.mjs

const BASE = process.env.BASE || 'http://localhost:3000';
const COOKIE = process.env.SESSION ? 'crux_admin_session=' + process.env.SESSION : '';

if (!COOKIE) {
    console.error('SESSION env var required (cookie value of crux_admin_session)');
    process.exit(1);
}

async function api(method, path, body) {
    const r = await fetch(BASE + path, {
        method,
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = null; try { data = JSON.parse(text); } catch { data = text; }
    if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${JSON.stringify(data)}`);
    return data;
}

const STATUSES = [
    { id: 's_todo',    label: 'Todo',     color: '#6b7280' },
    { id: 's_doing',   label: 'Doing',    color: '#3869AB' },
    { id: 's_review',  label: 'Review',   color: '#D97706' },
    { id: 's_blocked', label: 'Blocked',  color: '#DC2626' },
    { id: 's_done',    label: 'Done',     color: '#059669' },
];

const COLUMNS = [
    { id: 'col_task',    type: 'text',       name: 'Tarea',       order: 1, config: {} },
    { id: 'col_status',  type: 'status',     name: 'Status',      order: 2, config: { options: STATUSES } },
    { id: 'col_assign',  type: 'person',     name: 'Asignado',    order: 3, config: {} },
    { id: 'col_range',   type: 'daterange',  name: 'Rango',       order: 4, config: {} },
    { id: 'col_blocked', type: 'checkbox',   name: 'Bloqueado',   order: 5, config: {} },
    { id: 'col_tags',    type: 'tags',       name: 'Tags',        order: 6, config: {} },
    { id: 'col_estim',   type: 'number',     name: 'Horas',       order: 7, config: { suffix: ' h' } },
    { id: 'col_link',    type: 'link',       name: 'Enlace',      order: 8, config: {} },
    { id: 'col_deps',    type: 'dependency', name: 'Depende de',  order: 9, config: {} },
    { id: 'col_notes',   type: 'longtext',   name: 'Notas',       order: 10, config: {} },
];

const GROUPS = [
    { id: 'g_sprint',  name: 'Sprint actual', color: '#3869AB', order: 1, collapsed: false },
    { id: 'g_backlog', name: 'Backlog',       color: '#6b7280', order: 2, collapsed: false },
];

const SEED = [
    {
        group: 'g_sprint', name: 'Diseño cabecera v2',
        cells: {
            col_status: 's_doing', col_assign: ['marc@cruxmallorca.es'],
            col_range: { start: '2026-05-18', end: '2026-05-25' },
            col_blocked: false, col_tags: ['design', 'sprint-23'], col_estim: 4,
            col_link: '', col_deps: [], col_notes: 'Variantes: hero compact + hero full-bleed.',
        },
    },
    {
        group: 'g_sprint', name: 'API leads webhook',
        cells: {
            col_status: 's_review', col_assign: ['javi@cruxmallorca.es'],
            col_range: { start: '2026-05-14', end: '2026-05-21' },
            col_blocked: false, col_tags: ['backend', 'sprint-23'], col_estim: 6,
            col_link: 'https://github.com/frodepmc/crux/pull/12', col_deps: [], col_notes: 'PR enviado, esperando review.',
        },
    },
    {
        group: 'g_sprint', name: 'Migración pricing Acme',
        cells: {
            col_status: 's_blocked', col_assign: ['pedro@cruxmallorca.es'],
            col_range: { start: '2026-05-19', end: '2026-05-22' },
            col_blocked: true, col_tags: ['cliente'], col_estim: 3,
            col_link: '', col_deps: [], col_notes: 'Esperando confirmación de Acme sobre tier.',
        },
    },
    {
        group: 'g_sprint', name: 'Onboarding Carlos Canet',
        cells: {
            col_status: 's_done', col_assign: ['alvaro@cruxmallorca.es'],
            col_range: { start: '2026-05-12', end: '2026-05-19' },
            col_blocked: false, col_tags: ['personas'], col_estim: 8,
            col_link: '', col_deps: [], col_notes: 'Plan capacidad + buddy asignado.',
        },
    },
    {
        group: 'g_backlog', name: 'Dashboard finanzas V2',
        cells: {
            col_status: 's_todo', col_assign: [],
            col_range: null, col_blocked: false, col_tags: ['finanzas'], col_estim: 16,
            col_link: '', col_deps: [], col_notes: 'Cuando termine el sprint actual.',
        },
    },
    {
        group: 'g_backlog', name: 'Audit accesibilidad web',
        cells: {
            col_status: 's_todo', col_assign: [],
            col_range: null, col_blocked: false, col_tags: ['a11y', 'web'], col_estim: 6,
            col_link: '', col_deps: [], col_notes: 'WCAG 2.2 AA.',
        },
    },
];

async function run() {
    console.log('Creating board "Tareas Equipo"…');
    const created = await api('POST', '/api/boards', {
        name: 'Tareas Equipo',
        type: 'tasks',
        color: '#5CB88A',
        icon: 'layers',
        visibility: 'team',
    });
    const bid = created.id;
    console.log('  → board id:', bid);

    console.log('Setting meta (columns + groups)…');
    await api('PATCH', `/api/boards/${bid}/meta`, {
        columns: COLUMNS,
        groups: GROUPS,
        views: {
            kanban: { columnId: 'col_status' },
            calendar: { columnId: 'col_range' },
            timeline: { columnId: 'col_range' },
        },
        defaultView: 'table',
    });

    console.log('Seeding items…');
    for (const t of SEED) {
        await api('POST', `/api/boards/${bid}/items`, {
            name: t.name,
            groupId: t.group,
            cells: t.cells,
        });
        console.log('  → seeded:', t.name);
    }

    console.log('\nDone. Open: ' + BASE + '/admin/integrations/boards/board.html?id=' + bid);
}

run().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
