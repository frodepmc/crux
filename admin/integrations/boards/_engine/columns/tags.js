// columns/tags.js
// Tags: array de strings. config.options sugiere chips con color.
import { html } from 'htm/react';
import { useState } from 'react';
import { register } from './registry.js';
import { Icon } from '../ui/Icon.js';

function tagColor(tag, config) {
    const palette = config?.palette || ['#3869AB', '#5CB88A', '#D4A84A', '#D96B6B', '#9B5DE5'];
    let h = 0;
    for (let i = 0; i < tag.length; i += 1) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
}

register({
    type: 'tags',
    render: (value, ctx) => {
        const arr = Array.isArray(value) ? value : [];
        return html`
            <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                ${arr.map((t) => html`
                    <span key=${t} style=${{
                        background: tagColor(t, ctx?.column?.config),
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}>${t}</span>
                `)}
            </div>
        `;
    },
    renderEditor: (value, ctx, onChange) => {
        const arr = Array.isArray(value) ? value : [];
        const [draft, setDraft] = useState('');
        function add() {
            const t = draft.trim();
            if (!t || arr.includes(t)) return;
            onChange([...arr, t]);
            setDraft('');
        }
        function remove(t) { onChange(arr.filter((x) => x !== t)); }
        return html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style=${{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    ${arr.map((t) => html`
                        <span key=${t} style=${{
                            background: tagColor(t, ctx?.column?.config),
                            color: '#fff',
                            padding: '2px 8px 2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}>
                            ${t}
                            <button onClick=${() => remove(t)} style=${{
                                color: 'inherit', padding: '0 2px', lineHeight: 1, display: 'inline-flex',
                            }} aria-label="Quitar">
                                <${Icon} name="x" size=${10} strokeWidth=${2.6} />
                            </button>
                        </span>
                    `)}
                </div>
                <input class="b-input" type="text" value=${draft}
                       onChange=${(e) => setDraft(e.target.value)}
                       onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                       placeholder="Añadir tag y pulsar Enter"
                       aria-label="Nuevo tag" />
            </div>
        `;
    },
    compare: (a, b) => (Array.isArray(a) ? a.length : 0) - (Array.isArray(b) ? b.length : 0),
    defaultConfig: {},
});
