/* ═══════════════════════════════════════
   CRUX CONFIGURADOR — Catálogo modular 2026
   Pure vanilla JS, no deps. Loaded only on /servicios.html
   ═══════════════════════════════════════ */
(function () {
    'use strict';

    // ── Catalog ───────────────────────────────────────
    const CATALOG = Object.freeze({
        bases: [
            { id: 'B1', code: 'B1', name: 'Landing Page', pill: 'Landing', priceFrom: 700, priceLabel: 'Desde 700 €',
              tagline: '1 página de alto impacto',
              includes: ['1 página responsive', 'Formulario de captación', 'SEO on-page básico', 'Hosting + DNS'] },
            { id: 'B2', code: 'B2', name: 'Web Estándar', pill: 'Estándar', priceFrom: 2400, priceLabel: 'Desde 2.400 €',
              tagline: '5–7 páginas profesionales',
              includes: ['Hasta 5–7 páginas', 'CMS básico', 'Formularios de contacto', 'SEO on-page', 'Menú y footer'] },
            { id: 'B3', code: 'B3', name: 'Web Completa', pill: 'Completa', priceFrom: 4500, priceLabel: 'Desde 4.500 €',
              tagline: '10–12 páginas con CMS',
              includes: ['Hasta 10–12 páginas', 'CMS completo', 'Estructura multi-sección', 'SEO en todas las páginas', 'Analytics integrado'] },
        ],
        modules: [
            { id: 'M1', code: 'M1', name: 'Contenido / Blog', pill: 'Blog',
              priceFrom: 1500, priceLabel: 'Desde 1.500 €', requiresDiscovery: false,
              requiresBase: ['B2','B3'], requiresModule: null,
              tagline: 'Sistema de publicación y captación orgánica',
              when: 'Vas a publicar artículos, guías o recursos.' },
            { id: 'M2', code: 'M2', name: 'Gobierno Editorial', pill: 'Editorial',
              priceFrom: 1800, priceLabel: 'Desde 1.800 €', requiresDiscovery: false,
              requiresBase: ['B2','B3'], requiresModule: ['M1'],
              tagline: 'Panel admin con control editorial',
              when: 'Tienes varios editores y necesitas workflow de aprobación.' },
            { id: 'M3', code: 'M3', name: 'Dashboard / Panel', pill: 'Dashboard',
              priceFrom: 0, priceLabel: 'Requiere discovery', requiresDiscovery: true,
              discoveryRange: [1500, 3000], baseRange: [4000, 7000],
              requiresBase: ['B2','B3'], requiresModule: null,
              tagline: 'Panel interno con KPIs y datos operativos',
              when: 'Necesitas visualizar datos internos o de negocio.' },
            { id: 'M4', code: 'M4', name: 'Autenticación / Portal', pill: 'Portal',
              priceFrom: 0, priceLabel: 'Requiere discovery', requiresDiscovery: true,
              discoveryRange: [1500, 3500], baseRange: [4500, 8000],
              requiresBase: ['B2','B3'], requiresModule: null,
              tagline: 'Área privada para usuarios finales',
              when: 'Tus usuarios deben identificarse y tener perfil.' },
            { id: 'M5', code: 'M5', name: 'Comercio', pill: 'Comercio',
              priceFrom: 2500, priceLabel: 'Desde 2.500 €', requiresDiscovery: false,
              requiresBase: ['B2','B3'], requiresModule: null,
              tagline: 'Tienda online con catálogo y checkout',
              when: 'Vendes productos o servicios con pago online.' },
            { id: 'M6', code: 'M6', name: 'Producto Digital / MVP', pill: 'MVP',
              priceFrom: 0, priceLabel: 'Requiere discovery', requiresDiscovery: true,
              discoveryRange: [2500, 4000], baseRange: [12000, 20000],
              requiresBase: ['B2','B3'], requiresModule: null, tier: 'advanced',
              tagline: 'MVP de web app o SaaS',
              when: 'Es un producto digital propio, no una web informativa.' },
        ],
        transversales: [
            { id: 'T-branding',  name: 'Branding / identidad visual',  priceFrom: 800, unit: 'oneoff',  priceLabel: 'Desde 800 €' },
            { id: 'T-copy',      name: 'Copywriting',                  priceFrom: 180, unit: 'oneoff',  priceLabel: 'Desde 180 €/pág' },
            { id: 'T-seoaudit',  name: 'Auditoría SEO inicial',        priceFrom: 350, unit: 'oneoff',  priceLabel: 'Desde 350 €' },
            { id: 'T-seomensual',name: 'SEO mensual',                  priceFrom: 350, unit: 'monthly', priceLabel: 'Desde 350 €/mes' },
            { id: 'T-multilang', name: 'Multiidioma',                  priceFrom: 600, unit: 'oneoff',  priceLabel: 'Desde 600 €/idioma' },
            { id: 'T-rgpd',      name: 'Legal RGPD básico',            priceFrom: 200, unit: 'oneoff',  priceLabel: 'Desde 200 €' },
            { id: 'T-ia',        name: 'IA básica (chatbot LLM)',      priceFrom: 800, unit: 'oneoff',  priceLabel: 'Desde 800 €' },
            { id: 'T-mant',      name: 'Mantenimiento mensual',        priceFrom: 120, unit: 'monthly', priceLabel: 'Desde 120 €/mes' },
            { id: 'T-auto',      name: 'Automatizaciones no-code',     priceFrom: 350, unit: 'oneoff',  priceLabel: 'Desde 350 €' },
            { id: 'T-host',      name: 'Hosting cloud',                priceFrom: 15,  unit: 'monthly', priceLabel: 'Desde 15 €/mes' },
        ],
        presets: [
            { id: 'P1', name: 'Web corporativa con blog',     tagline: 'PYME con captación orgánica',          baseId: 'B3', moduleIds: ['M1'],            transversalIds: ['T-copy','T-seoaudit'] },
            { id: 'P2', name: 'E-commerce estándar',          tagline: 'Tienda online con pagos y envíos',     baseId: 'B2', moduleIds: ['M5'],            transversalIds: ['T-seoaudit','T-mant'] },
            { id: 'P3', name: 'Portal B2B con área privada',  tagline: 'Web + zona distribuidores con login',  baseId: 'B3', moduleIds: ['M4'],            transversalIds: ['T-rgpd'] },
            { id: 'P4', name: 'Dashboard operativo',          tagline: 'Panel de KPIs para dirección',         baseId: 'B2', moduleIds: ['M3'],            transversalIds: ['T-auto'] },
            { id: 'P5', name: 'SaaS MVP',                     tagline: 'Producto digital con auth y panel',    baseId: 'B3', moduleIds: ['M6','M4','M3'],  transversalIds: [] },
        ],
    });

    const WHATSAPP_PHONE = '34692447491';
    const LEGACY_HASHES = ['#packs-overview', '#motor-de-reservas', '#central-de-operaciones', '#facturacion-digital', '#control-comercial'];

    // ── State ─────────────────────────────────────────
    const state = {
        baseId: null,
        moduleIds: new Set(),
        transversalIds: new Set(),
    };

    // ── Accessors ─────────────────────────────────────
    const getBase = (id) => CATALOG.bases.find(b => b.id === id);
    const getModule = (id) => CATALOG.modules.find(m => m.id === id);
    const getTransversal = (id) => CATALOG.transversales.find(t => t.id === id);
    const getPreset = (id) => CATALOG.presets.find(p => p.id === id);

    // ── Validation ────────────────────────────────────
    function isModuleAllowedForBase(moduleId, baseId) {
        const m = getModule(moduleId);
        if (!m || !m.requiresBase) return true;
        return baseId !== null && m.requiresBase.includes(baseId);
    }
    function isModuleDependencyMet(moduleId, selectedModuleIds) {
        const m = getModule(moduleId);
        if (!m || !m.requiresModule) return true;
        return m.requiresModule.every(dep => selectedModuleIds.has(dep));
    }

    // ── Pricing ───────────────────────────────────────
    const eurFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
    const formatEUR = (amount) => eurFormatter.format(amount);

    function computeOneoffMin() {
        let sum = state.baseId ? getBase(state.baseId).priceFrom : 0;
        // Conservative discount: cheapest at full price, others at -10%
        const mods = [...state.moduleIds]
            .map(getModule)
            .filter(m => !m.requiresDiscovery)
            .sort((a, b) => a.priceFrom - b.priceFrom);
        mods.forEach((m, i) => {
            sum += i === 0 ? m.priceFrom : Math.round(m.priceFrom * 0.9);
        });
        for (const tid of state.transversalIds) {
            const t = getTransversal(tid);
            if (t.unit === 'oneoff') sum += t.priceFrom;
        }
        return sum;
    }
    function computeMonthlyMin() {
        let sum = 0;
        for (const tid of state.transversalIds) {
            const t = getTransversal(tid);
            if (t.unit === 'monthly') sum += t.priceFrom;
        }
        return sum;
    }
    function getDiscoveryFlags() {
        const dmods = [...state.moduleIds].map(getModule).filter(m => m.requiresDiscovery);
        return { hasDiscovery: dmods.length > 0, modules: dmods };
    }
    function countSelected() {
        return (state.baseId ? 1 : 0) + state.moduleIds.size + state.transversalIds.size;
    }

    // ── Mutations ─────────────────────────────────────
    function selectBase(baseId) {
        // Deselect if clicking the already-selected base
        if (state.baseId === baseId) {
            const name = getBase(baseId).name;
            state.baseId = null;
            const hadItems = state.moduleIds.size > 0 || state.transversalIds.size > 0;
            state.moduleIds.clear();
            state.transversalIds.clear();
            if (hadItems) {
                showToast('Base quitada. Configuración reiniciada.');
            }
            // Clear active preset highlight
            document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('is-active-preset'));
            renderAll();
            announce(`Base ${name} deseleccionada.`);
            return;
        }
        state.baseId = baseId;
        // Drop modules incompatible with new base
        const dropped = [];
        for (const mid of [...state.moduleIds]) {
            if (!isModuleAllowedForBase(mid, baseId)) {
                state.moduleIds.delete(mid);
                dropped.push(mid);
            }
        }
        if (dropped.length > 0) {
            showToast('Hemos quitado los módulos que requieren Web Estándar o Web Completa.');
        }
        renderAll();
        announce(`Base ${getBase(baseId).name} seleccionada.`);
    }

    function toggleModule(moduleId) {
        const m = getModule(moduleId);
        if (state.moduleIds.has(moduleId)) {
            // Removing — also drop dependent modules
            state.moduleIds.delete(moduleId);
            const cascadeDropped = [];
            for (const mid of [...state.moduleIds]) {
                if (!isModuleDependencyMet(mid, state.moduleIds)) {
                    state.moduleIds.delete(mid);
                    cascadeDropped.push(getModule(mid));
                }
            }
            renderAll();
            if (cascadeDropped.length > 0) {
                const names = cascadeDropped.map(mod => mod.name);
                showToast(`Quitado: ${names.join(', ')} (requiere ${m.name}).`);
                cascadeDropped.forEach((mod, i) => {
                    setTimeout(() => flashCardBlocked(`module-${mod.id}`), i * 150);
                });
            }
            announce(`${m.name} quitado.`);
            return true;
        }
        // Adding — validate
        if (!isModuleAllowedForBase(moduleId, state.baseId)) {
            flashCardBlocked(`module-${moduleId}`);
            showToast(state.baseId ? `${m.name} requiere Web Estándar o Web Completa.` : `Elige una base primero.`);
            return false;
        }
        if (!isModuleDependencyMet(moduleId, state.moduleIds)) {
            const dep = m.requiresModule.map(d => getModule(d).name).join(', ');
            flashCardBlocked(`module-${moduleId}`);
            showToast(`${m.name} necesita: ${dep}.`);
            return false;
        }
        state.moduleIds.add(moduleId);
        renderAll();
        announce(`${m.name} añadido.`);
        return true;
    }

    function toggleTransversal(tid) {
        const t = getTransversal(tid);
        if (state.transversalIds.has(tid)) {
            state.transversalIds.delete(tid);
            announce(`${t.name} quitado.`);
        } else {
            state.transversalIds.add(tid);
            announce(`${t.name} añadido.`);
        }
        renderAll();
    }

    function loadPreset(presetId) {
        const p = getPreset(presetId);
        if (!p) return;
        state.baseId = p.baseId;
        state.moduleIds = new Set(p.moduleIds);
        state.transversalIds = new Set(p.transversalIds);
        renderAll();

        // Mark active preset card
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('is-active-preset', card.dataset.presetId === presetId);
        });

        // Scroll to bases group
        const basesGroup = document.getElementById('bases');
        if (basesGroup) {
            const navH = 70;
            const top = basesGroup.getBoundingClientRect().top + window.scrollY - navH - 20;
            window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }

        // Stagger-animate selected cards
        if (!prefersReducedMotion()) {
            const allSelected = document.querySelectorAll('.configurator__item.is-selected');
            allSelected.forEach((card, i) => {
                setTimeout(() => {
                    card.classList.add('is-just-loaded');
                    card.addEventListener('animationend', () => {
                        card.classList.remove('is-just-loaded');
                    }, { once: true });
                }, i * 120);
            });
        }

        announce(`Configuración cargada: ${p.name}.`);
    }

    function resetConfig() {
        state.baseId = null;
        state.moduleIds.clear();
        state.transversalIds.clear();
        renderAll();
        announce('Configuración limpiada.');
    }

    // ── Helpers ───────────────────────────────────────
    function flashCardBlocked(cardId) {
        const el = document.getElementById(cardId);
        if (!el) return;
        el.classList.remove('is-blocked-flash');
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add('is-blocked-flash');
        setTimeout(() => el.classList.remove('is-blocked-flash'), 1200);
    }
    function announce(text) {
        const el = document.getElementById('configuratorAnnouncer');
        if (!el) return;
        el.textContent = '';
        requestAnimationFrame(() => { el.textContent = text; });
    }
    function showToast(text, ms = 5000) {
        const root = document.getElementById('configuratorToasts');
        if (!root) return;
        const chip = document.createElement('div');
        chip.className = 'configurator__toast';
        chip.setAttribute('role', 'status');
        chip.textContent = text;
        root.appendChild(chip);
        // Force reflow then add visible class for transition
        // eslint-disable-next-line no-unused-expressions
        chip.offsetHeight;
        chip.classList.add('is-visible');
        setTimeout(() => {
            chip.classList.remove('is-visible');
            setTimeout(() => chip.remove(), 400);
        }, ms);
    }
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    function scrollToConfigurator() {
        const target = document.getElementById('configurador');
        if (!target) return;
        const navHeight = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 10;
        window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    // ── Render ────────────────────────────────────────
    function renderPresets() {
        const root = document.querySelector('[data-render="presets"]');
        if (!root) return;
        root.innerHTML = CATALOG.presets.map(p => {
            const pills = [getBase(p.baseId), ...p.moduleIds.map(getModule)]
                .map(item => `<span class="preset-card__pill">${item.pill}</span>`).join('');
            return `
                <button type="button" class="preset-card" data-preset-id="${p.id}">
                    <span class="preset-card__name">${p.name}</span>
                    <span class="preset-card__tagline">${p.tagline}</span>
                    <div class="preset-card__items">${pills}</div>
                    <span class="preset-card__cta">Cargar configuración</span>
                </button>
            `;
        }).join('');
    }

    function renderBases() {
        const root = document.querySelector('[data-render="bases"]');
        if (!root) return;
        root.innerHTML = CATALOG.bases.map(b => {
            const selected = state.baseId === b.id;
            return `
                <button type="button"
                        class="configurator__item configurator__item--base ${selected ? 'is-selected' : ''}"
                        id="base-${b.id}"
                        data-base-id="${b.id}"
                        role="radio"
                        aria-checked="${selected}">
                    <span class="configurator__item-name">${b.name}</span>
                    <span class="configurator__item-tagline">${b.tagline}</span>
                    <ul class="configurator__item-includes">
                        ${b.includes.map(line => `<li>${line}</li>`).join('')}
                    </ul>
                    <span class="configurator__item-price">${b.priceLabel}</span>
                </button>
            `;
        }).join('');
    }

    function renderModules() {
        const root = document.querySelector('[data-render="modules"]');
        if (!root) return;
        root.innerHTML = CATALOG.modules.map(m => {
            const selected = state.moduleIds.has(m.id);
            const allowed = isModuleAllowedForBase(m.id, state.baseId) && isModuleDependencyMet(m.id, state.moduleIds);
            const blocked = !allowed && !selected;
            const advanced = m.tier === 'advanced';
            const discovery = m.requiresDiscovery;
            let warnText = '';
            if (blocked && !state.baseId) warnText = 'Elige una base primero.';
            else if (blocked && state.baseId === 'B1') warnText = 'Requiere Web Estándar o Web Completa.';
            else if (blocked && m.requiresModule) warnText = `Necesita: ${m.requiresModule.map(d => getModule(d).name).join(', ')}.`;
            return `
                <button type="button"
                        class="configurator__item configurator__item--module ${selected ? 'is-selected' : ''} ${blocked ? 'is-blocked' : ''} ${advanced ? 'is-advanced' : ''} ${discovery ? 'has-discovery-badge' : ''}"
                        id="module-${m.id}"
                        data-module-id="${m.id}"
                        aria-pressed="${selected}"
                        ${blocked ? 'aria-disabled="true"' : ''}>
                    <span class="configurator__item-name">${m.name}</span>
                    <span class="configurator__item-tagline">${m.tagline}</span>
                    <span class="configurator__item-when">${m.when}</span>
                    <span class="configurator__item-price ${discovery ? 'is-discovery' : ''}"${discovery ? ' aria-describedby="discovery-explain"' : ''}>${m.priceLabel}</span>
                    ${warnText ? `<span class="configurator__item-warning">${warnText}</span>` : ''}
                </button>
            `;
        }).join('');
    }

    function renderTransversales() {
        const root = document.querySelector('[data-render="transversales"]');
        if (!root) return;
        root.innerHTML = CATALOG.transversales.map(t => {
            const selected = state.transversalIds.has(t.id);
            return `
                <button type="button"
                        class="configurator__item configurator__item--tx ${selected ? 'is-selected' : ''}"
                        id="tx-${t.id}"
                        data-tx-id="${t.id}"
                        aria-pressed="${selected}">
                    <span class="configurator__item-name">${t.name}</span>
                    <span class="configurator__item-price">${t.priceLabel}</span>
                </button>
            `;
        }).join('');
    }

    function renderSummary() {
        const root = document.querySelector('[data-render="summary"]');
        if (!root) return;
        const rows = [];
        if (state.baseId) {
            const b = getBase(state.baseId);
            rows.push({ label: `Base · ${b.name}`, amount: formatEUR(b.priceFrom) });
        }
        const mods = [...state.moduleIds].map(getModule).filter(m => !m.requiresDiscovery).sort((a, b) => a.priceFrom - b.priceFrom);
        mods.forEach((m, i) => {
            const isDiscounted = i > 0;
            const amt = isDiscounted ? Math.round(m.priceFrom * 0.9) : m.priceFrom;
            rows.push({
                label: m.name + (isDiscounted ? ' <em>(−10%)</em>' : ''),
                amount: formatEUR(amt),
            });
        });
        for (const tid of state.transversalIds) {
            const t = getTransversal(tid);
            if (t.unit === 'oneoff') rows.push({ label: t.name, amount: formatEUR(t.priceFrom) });
        }
        for (const tid of state.transversalIds) {
            const t = getTransversal(tid);
            if (t.unit === 'monthly') rows.push({ label: `${t.name} <em>(mensual)</em>`, amount: formatEUR(t.priceFrom) + '/mes' });
        }
        if (rows.length === 0) {
            root.innerHTML = `<p class="configurator__sidebar-empty">Aún no has elegido nada. Empieza por una base.</p>`;
        } else {
            root.innerHTML = '<ul class="configurator__sidebar-rows">' + rows.map(r =>
                `<li><span class="row-label">${r.label}</span><span class="row-amount">${r.amount}</span></li>`
            ).join('') + '</ul>';
        }
    }

    function renderDiscovery() {
        const root = document.querySelector('[data-render="discovery"]');
        if (!root) return;
        const { hasDiscovery, modules } = getDiscoveryFlags();
        if (!hasDiscovery) {
            root.hidden = true;
            root.innerHTML = '';
            return;
        }
        root.hidden = false;
        root.innerHTML = `
            <p class="configurator__sidebar-discovery-title">⚠ Pendiente de discovery</p>
            <ul class="configurator__sidebar-discovery-list">
                ${modules.map(m => `
                    <li>
                        <strong>${m.name}</strong><br>
                        Discovery ${formatEUR(m.discoveryRange[0])}–${formatEUR(m.discoveryRange[1])} · Base ${formatEUR(m.baseRange[0])}–${formatEUR(m.baseRange[1])}
                    </li>
                `).join('')}
            </ul>
            <p class="configurator__sidebar-discovery-note">Confirmamos coste tras una sesión inicial.</p>
        `;
    }

    function renderTotals() {
        const root = document.querySelector('[data-render="totals"]');
        if (!root) return;
        const oneoff = computeOneoffMin();
        const monthly = computeMonthlyMin();
        const { hasDiscovery } = getDiscoveryFlags();
        let html = '';
        if (oneoff > 0 || monthly > 0) {
            html += `<div class="configurator__sidebar-total">
                        <span>Estimación mínima</span>
                        <strong>${formatEUR(oneoff)}${hasDiscovery ? ' <em>+ discovery</em>' : ''}</strong>
                     </div>`;
            if (monthly > 0) {
                html += `<div class="configurator__sidebar-monthly">
                            <span>Recurrente</span>
                            <strong>${formatEUR(monthly)}/mes</strong>
                         </div>`;
            }
        }
        root.innerHTML = html;
    }

    function renderHandle() {
        const meta = document.querySelector('[data-handle-meta]');
        if (!meta) return;
        const n = countSelected();
        const oneoff = computeOneoffMin();
        meta.textContent = `${n} ${n === 1 ? 'elemento' : 'elementos'} · ${formatEUR(oneoff)}`;
    }

    function renderSendButton() {
        const btn = document.getElementById('configuratorSendBtn');
        if (!btn) return;
        if (!state.baseId) {
            btn.disabled = true;
            btn.textContent = 'Empieza eligiendo una base';
        } else {
            btn.disabled = false;
            btn.textContent = 'Enviar configuración por WhatsApp';
        }
    }

    function renderProgressBadges() {
        const groups = [
            { id: 'bases',         hasSelection: state.baseId !== null },
            { id: 'modulos',       hasSelection: state.moduleIds.size > 0 },
            { id: 'transversales', hasSelection: state.transversalIds.size > 0 },
        ];
        groups.forEach(({ id, hasSelection }) => {
            const header = document.querySelector(`#${id} .configurator__group-header`);
            if (!header) return;
            let badge = header.querySelector('.configurator__group-status');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'configurator__group-status';
                badge.setAttribute('aria-hidden', 'true');
                header.appendChild(badge);
            }
            if (hasSelection) {
                badge.className = 'configurator__group-status configurator__group-status--done';
                badge.textContent = '\u2713';
            } else {
                badge.className = 'configurator__group-status configurator__group-status--empty';
                badge.textContent = '';
            }
        });
    }

    // ── Progressive disclosure ──────────────────────────
    function updateLockState() {
        const baseSelected = state.baseId !== null;
        const groups = [
            { el: document.getElementById('modulos'), unlockWhen: baseSelected },
            { el: document.getElementById('transversales'), unlockWhen: baseSelected },
        ];
        groups.forEach(({ el, unlockWhen }) => {
            if (!el || !el.hasAttribute('data-step')) return;
            const wasLocked = !el.classList.contains('is-unlocked');
            if (unlockWhen) {
                el.classList.add('is-unlocked');
                if (wasLocked && !prefersReducedMotion()) {
                    el.classList.add('is-just-unlocked');
                    // Clean up animation class after all cards finish (6 × 80ms + 500ms base)
                    setTimeout(() => el.classList.remove('is-just-unlocked'), 900);
                }
            } else {
                el.classList.remove('is-unlocked', 'is-just-unlocked');
            }
        });
    }

    function renderSidebarProgress() {
        const container = document.querySelector('.configurator__sidebar-body');
        if (!container) return;
        let progress = container.querySelector('.configurator__sidebar-progress');
        if (!progress) {
            progress = document.createElement('div');
            progress.className = 'configurator__sidebar-progress';
            progress.innerHTML = `
                <span class="sidebar-step" data-sidebar-step="1">01</span>
                <span class="sidebar-step" data-sidebar-step="2">02</span>
                <span class="sidebar-step" data-sidebar-step="3">03</span>
            `;
            container.insertBefore(progress, container.firstChild);
        }
        const steps = [
            { n: '1', done: state.baseId !== null },
            { n: '2', done: state.moduleIds.size > 0 },
            { n: '3', done: state.transversalIds.size > 0 },
        ];
        // Determine current step (first incomplete)
        const currentIdx = steps.findIndex(s => !s.done);
        steps.forEach(({ n, done }, i) => {
            const el = progress.querySelector(`[data-sidebar-step="${n}"]`);
            if (!el) return;
            el.classList.toggle('is-done', done);
            el.classList.toggle('is-current', !done && i === currentIdx);
            el.textContent = done ? '\u2713' : `0${n}`;
        });
    }

    function renderAll() {
        renderBases();
        renderModules();
        renderTransversales();
        renderSummary();
        renderDiscovery();
        renderTotals();
        renderHandle();
        renderSendButton();
        renderProgressBadges();
        updateLockState();
        renderSidebarProgress();
    }

    // ── WhatsApp output ───────────────────────────────
    function buildWhatsAppMessage() {
        const lines = [];
        lines.push('*Nueva configuración desde la web CRUX*');
        lines.push('');
        if (state.baseId) {
            const b = getBase(state.baseId);
            lines.push(`*Base:* ${b.name} (${b.code}) — ${b.priceLabel}`);
        } else {
            lines.push('*Base:* sin elegir');
        }
        const mods = [...state.moduleIds].map(getModule);
        const oneoffMods = mods.filter(m => !m.requiresDiscovery).sort((a, b) => a.priceFrom - b.priceFrom);
        const discoveryMods = mods.filter(m => m.requiresDiscovery);
        if (oneoffMods.length > 0 || discoveryMods.length > 0) {
            lines.push('');
            lines.push('*Módulos:*');
            oneoffMods.forEach((m, i) => {
                const tag = i > 0 ? ' (−10%)' : '';
                lines.push(`• ${m.name} (${m.code}) — ${m.priceLabel}${tag}`);
            });
            discoveryMods.forEach(m => {
                lines.push(`• ${m.name} (${m.code}) — pendiente de discovery`);
            });
        }
        const oneoffTx = [...state.transversalIds].map(getTransversal).filter(t => t.unit === 'oneoff');
        const monthlyTx = [...state.transversalIds].map(getTransversal).filter(t => t.unit === 'monthly');
        if (oneoffTx.length > 0 || monthlyTx.length > 0) {
            lines.push('');
            lines.push('*Transversales:*');
            oneoffTx.forEach(t => lines.push(`• ${t.name} — ${t.priceLabel}`));
            monthlyTx.forEach(t => lines.push(`• ${t.name} — ${t.priceLabel}`));
        }
        const oneoff = computeOneoffMin();
        const monthly = computeMonthlyMin();
        const { hasDiscovery, modules: dmods } = getDiscoveryFlags();
        lines.push('');
        lines.push(`*Estimación mínima:* ${formatEUR(oneoff)}${hasDiscovery ? ' + discovery' : ''}`);
        if (monthly > 0) {
            lines.push(`*Recurrente:* ${formatEUR(monthly)}/mes`);
        }
        if (hasDiscovery) {
            lines.push('');
            lines.push(`(Discovery requerido: ${dmods.map(m => m.code).join(', ')})`);
        }
        lines.push('');
        lines.push('Sin IVA. ¿Hablamos?');
        return lines.join('\n');
    }

    function sendToWhatsApp() {
        const btn = document.getElementById('configuratorSendBtn');
        if (!btn) return;
        const text = buildWhatsAppMessage();
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
        const popup = window.open(url, '_blank');
        if (popup) {
            popup.opener = null;
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Abriendo WhatsApp...';
            btn.setAttribute('aria-busy', 'true');
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = original;
                btn.setAttribute('aria-busy', 'false');
            }, 3000);
        } else {
            showToast('No se pudo abrir WhatsApp. Revisa el bloqueador de pop-ups.');
        }
    }

    // ── Wiring ────────────────────────────────────────
    function wireConfigurator() {
        // Event delegation on the configurator main grid
        const main = document.querySelector('.configurator__main');
        if (main) {
            main.addEventListener('click', (e) => {
                const baseBtn = e.target.closest('[data-base-id]');
                if (baseBtn) { selectBase(baseBtn.dataset.baseId); return; }
                const modBtn = e.target.closest('[data-module-id]');
                if (modBtn) { toggleModule(modBtn.dataset.moduleId); return; }
                const txBtn = e.target.closest('[data-tx-id]');
                if (txBtn) { toggleTransversal(txBtn.dataset.txId); return; }
                const presetBtn = e.target.closest('[data-preset-id]');
                if (presetBtn) { loadPreset(presetBtn.dataset.presetId); return; }
            });
        }
        // Sidebar handle (mobile drawer)
        const handle = document.getElementById('configuratorHandle');
        const sidebar = document.getElementById('configuratorSidebar');
        // On mobile, move sidebar to <body> to escape .services-backdrop stacking context
        if (sidebar && window.innerWidth <= 900) {
            document.body.appendChild(sidebar);
        }
        if (handle && sidebar) {
            handle.addEventListener('click', () => {
                const open = sidebar.classList.toggle('is-open');
                handle.setAttribute('aria-expanded', String(open));
                if (open) {
                    const firstFocusable = sidebar.querySelector('.configurator__sidebar-cta, .configurator__sidebar-secondary');
                    if (firstFocusable) firstFocusable.focus({ preventScroll: true });
                }
            });
        }
        // Send button
        const sendBtn = document.getElementById('configuratorSendBtn');
        if (sendBtn) sendBtn.addEventListener('click', sendToWhatsApp);
        // Reset button — double-click confirmation pattern
        const resetBtn = document.getElementById('configuratorResetBtn');
        if (resetBtn) {
            let resetTimer = null;
            resetBtn.addEventListener('click', () => {
                if (countSelected() === 0) return;
                if (resetBtn.classList.contains('is-confirming')) {
                    clearTimeout(resetTimer);
                    resetBtn.classList.remove('is-confirming');
                    resetBtn.textContent = 'Limpiar';
                    resetConfig();
                    showToast('Configuración limpiada.');
                    return;
                }
                resetBtn.classList.add('is-confirming');
                resetBtn.textContent = 'Confirmar limpieza';
                resetTimer = setTimeout(() => {
                    resetBtn.classList.remove('is-confirming');
                    resetBtn.textContent = 'Limpiar';
                }, 3000);
            });
        }
        // Sidebar sticky↔drawer resize transition (debounced)
        let lastWasDrawer = window.innerWidth <= 900;
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
            const isDrawer = window.innerWidth <= 900;
            if (isDrawer !== lastWasDrawer && sidebar) {
                // Move sidebar DOM: body (mobile) or back to configurator layout (desktop)
                if (isDrawer) {
                    document.body.appendChild(sidebar);
                } else {
                    const layout = document.querySelector('.configurator__layout');
                    if (layout) layout.appendChild(sidebar);
                }
                sidebar.classList.add('is-transitioning');
                sidebar.classList.remove('is-open');
                if (handle) handle.setAttribute('aria-expanded', 'false');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        sidebar.classList.remove('is-transitioning');
                        sidebar.classList.add('is-transitioning-in');
                        setTimeout(() => sidebar.classList.remove('is-transitioning-in'), 350);
                    });
                });
                lastWasDrawer = isDrawer;
            }
            }, 150);
        });
        // Escape closes mobile drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar && sidebar.classList.contains('is-open')) {
                sidebar.classList.remove('is-open');
                if (handle) handle.setAttribute('aria-expanded', 'false');
            }
        });
        // Add-from-alacarte links: data-add-tx attribute on .alacarte__cta
        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-add-tx]');
            if (addBtn) {
                e.preventDefault();
                if (!state.baseId) {
                    showToast('Elige una base primero para poder añadir servicios.');
                    scrollToConfigurator();
                    return;
                }
                const tid = addBtn.dataset.addTx;
                if (!state.transversalIds.has(tid)) {
                    state.transversalIds.add(tid);
                    renderAll();
                    showToast(`${getTransversal(tid).name} añadido al configurador.`);
                }
                scrollToConfigurator();
            }
        });
    }

    // ── Drawer hint (mobile, one-shot) ─────────────────
    function initDrawerHint() {
        if (prefersReducedMotion()) return;
        if (window.innerWidth > 900) return;
        if (sessionStorage.getItem('crux-drawer-hinted')) return;

        const section = document.getElementById('configurador');
        const sidebar = document.getElementById('configuratorSidebar');
        if (!section || !sidebar) return;

        const observer = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            setTimeout(() => {
                if (sidebar.classList.contains('is-open')) return;
                sidebar.classList.add('has-hint');
                sessionStorage.setItem('crux-drawer-hinted', '1');
                sidebar.addEventListener('animationend', () => {
                    sidebar.classList.remove('has-hint');
                }, { once: true });
            }, 2000);
        }, { threshold: 0.1 });

        observer.observe(section);
    }

    // ── Branch cards + inline expand ───────────────────
    function initBranchCards() {
        const cards = document.querySelectorAll('.alacarte__branch-card');
        const expand = document.getElementById('branch-expand');
        const panels = document.querySelectorAll('.alacarte__branch-panel');
        if (!cards.length || !expand) return;

        cards.forEach(card => {
            card.addEventListener('click', () => {
                const branch = card.dataset.branch;
                const wasActive = card.classList.contains('is-active');

                // Deactivate all cards
                cards.forEach(c => {
                    c.classList.remove('is-active');
                    c.setAttribute('aria-expanded', 'false');
                });

                // Hide all panels
                panels.forEach(p => p.classList.remove('is-visible'));

                if (wasActive) {
                    // Close expand
                    expand.classList.remove('is-open');
                    return;
                }

                // Show target panel + measure height
                const panel = document.querySelector(`[data-panel="${branch}"]`);
                panel.classList.add('is-visible');
                expand.style.setProperty('--expand-h', panel.scrollHeight + 20 + 'px');

                // Activate card + open expand
                card.classList.add('is-active');
                card.setAttribute('aria-expanded', 'true');
                expand.classList.add('is-open');

                // Scroll to panel on mobile
                if (window.innerWidth <= 700) {
                    setTimeout(() => {
                        expand.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 200);
                }
            });
        });
    }

    // ── Legacy hash redirect ──────────────────────────
    function handleLegacyHashes() {
        if (LEGACY_HASHES.includes(window.location.hash)) {
            history.replaceState(null, '', '#configurador');
            const target = document.getElementById('configurador');
            if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }

    // ── Init ──────────────────────────────────────────
    function initConfigurator() {
        if (!document.getElementById('configurador')) return;
        renderPresets();
        renderAll();
        wireConfigurator();
        handleLegacyHashes();
        initDrawerHint();
        initBranchCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConfigurator);
    } else {
        initConfigurator();
    }
})();
