// admin/integrations/boards/_engine/columns/registry.js
// Registry de tipos de columna. Cada columna se registra a sí misma via register().
// Las vistas piden render(value, ctx) o renderEditor(value, ctx, onChange).

const registry = new Map();

export function register(spec) {
    if (!spec || !spec.type) throw new Error('column spec needs .type');
    registry.set(spec.type, spec);
}

export function getColumnType(type) {
    return registry.get(type) || registry.get('text');  // fallback
}

export function listColumnTypes() {
    return [...registry.keys()];
}
