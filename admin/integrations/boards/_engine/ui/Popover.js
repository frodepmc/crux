// ui/Popover.js
// Popover reutilizable: trigger button + body posicionado debajo, click-outside + Esc cierran.
// Uso:
//   <${Popover}
//      trigger=${(open) => html`<button onClick=${open}>...</button>`}
//      align="left"  // 'left' | 'right' (alineación con el trigger)
//      width=${260}
//   >
//      ${(close) => html`<div>contenido…</div>`}
//   <//>

import { html } from 'htm/react';
import { useState, useRef, useEffect } from 'react';

export function Popover({ trigger, children, align = 'left', width = 260, onOpen, onClose }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const bodyRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    function openIt() {
        setOpen(true);
        if (onOpen) onOpen();
    }
    function closeIt() {
        setOpen(false);
        if (onClose) onClose();
    }

    useEffect(() => {
        if (!open) return;

        function recompute() {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            let top = rect.bottom + 6;
            let left = align === 'right' ? rect.right - width : rect.left;
            // Si se sale por abajo, abrir hacia arriba
            const bodyHeight = bodyRef.current?.offsetHeight || 280;
            if (top + bodyHeight > vh - 10 && rect.top - bodyHeight - 6 > 10) {
                top = rect.top - bodyHeight - 6;
            }
            // Si se sale por la derecha, ajustar
            if (left + width > vw - 10) left = vw - width - 10;
            if (left < 10) left = 10;
            setPosition({ top, left });
        }

        recompute();
        function onClickOutside(e) {
            if (wrapRef.current && wrapRef.current.contains(e.target)) return;
            if (bodyRef.current && bodyRef.current.contains(e.target)) return;
            closeIt();
        }
        function onKey(e) {
            if (e.key === 'Escape') closeIt();
        }
        function onScroll() {
            recompute();
        }
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', recompute);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', recompute);
        };
    }, [open, align, width]);

    return html`
        <span ref=${wrapRef} style=${{ display: 'inline-block', width: '100%' }}>
            ${trigger(openIt, open, closeIt)}
            ${open ? html`
                <div ref=${bodyRef}
                     class="b-popover"
                     style=${{
                         position: 'fixed',
                         top: position.top + 'px',
                         left: position.left + 'px',
                         width: width + 'px',
                     }}
                     onClick=${(e) => e.stopPropagation()}>
                    ${children(closeIt)}
                </div>
            ` : null}
        </span>
    `;
}
