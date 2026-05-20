#!/usr/bin/env node
// scripts/bootstrap-board-crm.mjs
// Crea el board "CRM Pipeline" con columnas, fases y leads de seed via API local.
//
// Requiere: vercel dev corriendo + SESSION env var con el JWT.
//
// Uso:
//   BASE=http://localhost:3000 SESSION=<jwt> node scripts/bootstrap-board-crm.mjs

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

const PHASES = [
    { id: 'phase_new',       label: 'Nuevo',       color: '#6b7280' },
    { id: 'phase_contacted', label: 'Contactado',  color: '#3869AB' },
    { id: 'phase_meeting',   label: 'Reunión',     color: '#5B9BD5' },
    { id: 'phase_proposal',  label: 'Propuesta',   color: '#D97706' },
    { id: 'phase_won',       label: 'Ganado',      color: '#059669' },
    { id: 'phase_lost',      label: 'Perdido',     color: '#DC2626' },
];

const COLUMNS = [
    { id: 'col_company', type: 'text',     name: 'Empresa',    order: 1, config: {} },
    { id: 'col_status',  type: 'status',   name: 'Fase',       order: 2, config: { options: PHASES } },
    { id: 'col_owner',   type: 'person',   name: 'Dueño',      order: 3, config: {} },
    { id: 'col_value',   type: 'number',   name: 'Valor',      order: 4, config: { prefix: '€' } },
    { id: 'col_next',    type: 'date',     name: 'Siguiente',  order: 5, config: {} },
    { id: 'col_tags',    type: 'tags',     name: 'Tags',       order: 6, config: {} },
    { id: 'col_email',   type: 'email',    name: 'Email',      order: 7, config: {} },
    { id: 'col_phone',   type: 'phone',    name: 'Tel',        order: 8, config: {} },
    { id: 'col_link',    type: 'link',     name: 'Web',        order: 9, config: {} },
    { id: 'col_notes',   type: 'longtext', name: 'Notas',      order: 10, config: {} },
];

const GROUPS = [
    { id: 'g_default', name: 'Pipeline', color: '#3869AB', order: 1, collapsed: false },
];

const SEED_LEADS = [
    { name: 'Acme S.L.',         status: 'phase_meeting',   value: 2500, tags: ['web', 'urgente'], next: '2026-06-12', email: 'contacto@acme.com', phone: '+34 600 111 222', link: 'https://acme.com', notes: 'Quieren branding + web.' },
    { name: 'Farmàcia Rambla',   status: 'phase_proposal',  value: 4800, tags: ['farmacia'],       next: '2026-06-20', email: 'info@rambla.com',   phone: '+34 600 222 333', link: 'https://rambla.com', notes: 'Web + cuenta corporativa. Iteración por WhatsApp.' },
    { name: 'Disney Mallorca',   status: 'phase_won',       value: 9200, tags: ['evento'],         next: null,         email: 'eventos@disney.es', phone: '+34 600 333 444', link: '',                   notes: 'Firmado. Inicio el 1 de julio.' },
    { name: 'UIB Investigación', status: 'phase_contacted', value: 2000, tags: ['investigacion'], next: '2026-05-25', email: 'inv@uib.cat',       phone: '',                link: 'https://uib.cat',    notes: 'Pendiente confirmación de presupuesto.' },
];

async function run() {
    console.log('Creating board "CRM Pipeline"…');
    const created = await api('POST', '/api/boards', {
        name: 'CRM Pipeline',
        type: 'crm',
        color: '#3869AB',
        icon: 'users',
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
            calendar: { columnId: 'col_next' },
            timeline: { columnId: 'col_next' },
        },
        defaultView: 'kanban',
    });

    console.log('Seeding leads…');
    for (const lead of SEED_LEADS) {
        const cells = {
            col_company: lead.name,
            col_status:  lead.status,
            col_owner:   [],
            col_value:   lead.value,
            col_next:    lead.next,
            col_tags:    lead.tags,
            col_email:   lead.email,
            col_phone:   lead.phone,
            col_link:    lead.link,
            col_notes:   lead.notes,
        };
        await api('POST', `/api/boards/${bid}/items`, {
            name: lead.name,
            groupId: 'g_default',
            cells,
        });
        console.log('  → seeded:', lead.name);
    }

    console.log('\nDone. Open: ' + BASE + '/admin/integrations/boards/board.html?id=' + bid);
}

run().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
