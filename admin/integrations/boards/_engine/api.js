// admin/integrations/boards/_engine/api.js
// Wrappers fetch contra /api/boards/*. Manejan JSON + errores semánticos.
// El store consume estos; las vistas/componentes nunca llaman a fetch directamente.

export class ApiError extends Error {
    constructor(status, body, message) {
        super(message || (body && body.error) || 'API error');
        this.status = status;
        this.body = body;
    }
}

async function call(method, path, body) {
    const res = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new ApiError(res.status, data, `${method} ${path} → ${res.status}`);
    return data;
}

export const api = {
    listBoards:        ()                  => call('GET',    '/api/boards'),
    createBoard:       (payload)           => call('POST',   '/api/boards', payload),
    updateBoard:       (id, patch)         => call('PATCH',  `/api/boards/${id}`, patch),
    deleteBoard:       (id)                => call('DELETE', `/api/boards/${id}`),

    getMeta:           (id)                => call('GET',    `/api/boards/${id}/meta`),
    patchMeta:         (id, meta)          => call('PATCH',  `/api/boards/${id}/meta`, meta),

    getItems:          (id)                => call('GET',    `/api/boards/${id}/items`),
    createItem:        (id, payload)       => call('POST',   `/api/boards/${id}/items`, payload),
    patchItem:         (id, iid, payload)  => call('PATCH',  `/api/boards/${id}/items/${iid}`, payload),
    deleteItem:        (id, iid)           => call('DELETE', `/api/boards/${id}/items/${iid}`),
    reorderItem:       (id, payload)       => call('POST',   `/api/boards/${id}/items/reorder`, payload),
    listComments:   (id, iid)              => call('GET',    `/api/boards/${id}/comments/${iid}`),
    addComment:     (id, iid, text)        => call('POST',   `/api/boards/${id}/comments/${iid}`, { text }),
    deleteComment:  (id, iid, cid)         => call('DELETE', `/api/boards/${id}/comments/${iid}?commentId=${encodeURIComponent(cid)}`),

    getUserPrefs:      ()                  => call('GET',    '/api/user/board-prefs'),
    patchUserPrefs:    (patch)             => call('PATCH',  '/api/user/board-prefs', patch),
};
