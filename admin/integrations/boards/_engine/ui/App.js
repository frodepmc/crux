// ui/App.js
// Shell de la app de board: monta header + vista + drawer + toasts.

import { html } from 'htm/react';
import { useState, useEffect } from 'react';
import { useStore } from '../hooks.js';
import { Header } from './Header.js';
import { ItemDrawer } from './ItemDrawer.js';
import { Toasts } from './Toast.js';
import { TableView } from '../views/TableView.js';
import { KanbanView } from '../views/KanbanView.js';
import { CalendarView } from '../views/CalendarView.js';
import { TimelineView } from '../views/TimelineView.js';

const VIEW_COMPONENTS = {
    table: TableView,
    kanban: KanbanView,
    calendar: CalendarView,
    timeline: TimelineView,
};

export function App({ store }) {
    const state = useStore(store);
    const [view, setView] = useState('table');

    useEffect(() => {
        store.hydrate();
    }, []);

    useEffect(() => {
        if (state.meta && state.meta.defaultView && state.meta.defaultView !== view) {
            setView(state.meta.defaultView);
        }
    }, [state.meta?.defaultView]);

    if (state.loading) {
        return html`
            <div class="b-empty">
                <div class="b-spinner"></div>
                <div class="b-empty-title" style=${{ marginTop: '12px' }}>Cargando board…</div>
            </div>
        `;
    }
    if (state.error) {
        return html`
            <div class="b-empty">
                <div class="b-empty-title" style=${{ color: 'var(--err)' }}>No se pudo cargar el board</div>
                <div class="b-empty-sub">${state.error}</div>
            </div>
        `;
    }

    const ViewComp = VIEW_COMPONENTS[view] || TableView;

    return html`
        <div class="b-app">
            <${Header} store=${store} currentView=${view} setView=${setView} />
            <main class="b-main">
                <${ViewComp} store=${store} />
            </main>
            <${ItemDrawer} store=${store} />
            <${Toasts} store=${store} />
        </div>
    `;
}
