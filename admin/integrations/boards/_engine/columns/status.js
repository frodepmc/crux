// columns/status.js
// Render: chip de color.
// Editor: trigger button + popover con lista de opciones (chip + label).

import { html } from 'htm/react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';
import { Popover } from '../ui/Popover.js';

function findOption(value, config) {
    const opts = config?.options || [];
    return opts.find((o) => o.id === value) || null;
}

register({
    type: 'status',
    render: (value, ctx) => {
        const opt = findOption(value, ctx?.column?.config);
        if (!opt) return html`<span></span>`;
        return html`
            <span class="b-chip b-chip-status"
                  style=${{ background: opt.color || 'var(--accent)' }}>
                ${opt.label}
            </span>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const opts = ctx?.column?.config?.options || [];
        const opt = findOption(value, ctx?.column?.config);
        return html`
            <${Popover}
                width=${240}
                trigger=${(openIt, isOpen) => html`
                    <button type="button"
                            class="b-cell-trigger"
                            data-open=${isOpen ? 'true' : 'false'}
                            onClick=${openIt}
                            aria-label=${ctx.column.name}>
                        ${opt ? html`
                            <span class="b-chip b-chip-status" style=${{ background: opt.color }}>${opt.label}</span>
                        ` : html`<span class="b-cell-trigger-placeholder">— sin estado —</span>`}
                        <span class="b-cell-trigger-caret">
                            <${Icon} name="chevron-down" size=${14} />
                        </span>
                    </button>
                `}>
                ${(close) => html`
                    <div class="b-popover-list">
                        <div class="b-popover-item"
                             data-selected=${value == null ? 'true' : 'false'}
                             onClick=${() => { onChange(null); close(); }}>
                            <span class="b-cell-trigger-placeholder">— sin estado —</span>
                            <span class="b-popover-item-check">
                                <${Icon} name="check" size=${14} strokeWidth=${2.6} />
                            </span>
                        </div>
                        ${opts.map((o) => html`
                            <div key=${o.id}
                                 class="b-popover-item"
                                 data-selected=${o.id === value ? 'true' : 'false'}
                                 onClick=${() => { onChange(o.id); close(); }}>
                                <span class="b-chip-dot" style=${{ background: o.color }}></span>
                                <span>${o.label}</span>
                                <span class="b-popover-item-check">
                                    <${Icon} name="check" size=${14} strokeWidth=${2.6} />
                                </span>
                            </div>
                        `)}
                    </div>
                `}
            <//>
        `;
    },
    compare: (a, b, config) => {
        const opts = config?.options || [];
        const ai = opts.findIndex((o) => o.id === a);
        const bi = opts.findIndex((o) => o.id === b);
        return ai - bi;
    },
    kanbanGroupKey: (value) => value || null,
    defaultConfig: { options: [] },
});
