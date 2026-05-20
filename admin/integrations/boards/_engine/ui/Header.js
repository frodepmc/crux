// ui/Header.js
// Header con título, subtitle (metadatos) y view switcher.
// En M1 solo está la vista 'table'; M2 añade kanban, etc.

import { html } from 'htm/react';
import { useStore } from '../hooks.js';

const VIEWS = [
    { id: 'table',    label: 'Tabla',    enabled: true },
    { id: 'kanban',   label: 'Kanban',   enabled: false },
    { id: 'calendar', label: 'Calendar', enabled: false },
    { id: 'timeline', label: 'Timeline', enabled: false },
];

export function Header({ store, currentView, setView }) {
    const state = useStore(store);
    const { summary, itemIndex, pendingWrites } = state;
    if (!summary) return null;

    return html`
        <header class="b-header">
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <div class="b-header-sub">BOARD · ${summary.type?.toUpperCase() || 'CUSTOM'}</div>
                <div class="b-header-title">${summary.name}</div>
                <div class="b-header-sub" style=${{ color: 'var(--text-4)', textTransform: 'none', letterSpacing: 0 }}>
                    ${itemIndex.length} items
                    ${pendingWrites > 0 ? html` · ${pendingWrites} guardando…` : null}
                </div>
            </div>
            <div class="b-view-switcher" role="tablist">
                ${VIEWS.map((v) => html`
                    <button key=${v.id}
                            class="b-view-btn"
                            aria-current=${currentView === v.id ? 'true' : 'false'}
                            disabled=${!v.enabled}
                            title=${v.enabled ? '' : 'Disponible en próximos milestones'}
                            onClick=${() => v.enabled && setView(v.id)}>
                        ${v.label}
                    </button>
                `)}
            </div>
        </header>
    `;
}
