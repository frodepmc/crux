// ui/Toast.js
import { html } from 'htm/react';
import { useStore } from '../hooks.js';

export function Toasts({ store }) {
    const state = useStore(store);
    const toasts = state.toasts || [];
    if (toasts.length === 0) return null;
    return html`
        <div class="b-toasts" role="status" aria-live="polite">
            ${toasts.map((t) => html`<div key=${t.id} class="b-toast" data-tone=${t.tone}>${t.text}</div>`)}
        </div>
    `;
}
