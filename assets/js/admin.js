/* ═══════════════════════════════════════════════════════════════
   CRUX · Panel interno — admin.js
   Shared client-side helpers:
   - Session guard (redirige a /admin si no hay sesion)
   - Login form handler (/admin/index.html)
   - Hub bootstrap (fetch registry, render cards, session info)
   - Clock + session pulse
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const LOGIN_URL = '/admin';
    const HUB_URL = '/admin/hub';

    /* ------- API helpers ------- */
    async function apiLogin(username, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        let json = {};
        try { json = await res.json(); } catch (_) { /* ignore */ }
        return { ok: res.ok, status: res.status, ...json };
    }

    async function apiLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
            });
        } catch (_) { /* ignore */ }
    }

    async function apiVerify() {
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (_) {
            return null;
        }
    }

    async function apiMe() {
        try {
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (_) {
            return null;
        }
    }

    /* ------- Guard ------- */
    // Dev-only bypass: solo sirve en localhost. En produccion no hace nada.
    function devPreviewSession() {
        const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
        const wants = new URLSearchParams(window.location.search).has('__preview');
        if (!isLocal || !wants) return null;
        return {
            username: 'preview@localhost',
            name: 'Preview Local',
            role: 'admin',
            color: '#3869AB',
            access: ['*'],
            isAdmin: true,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            _preview: true,
        };
    }

    // Protege cualquier pagina del admin (excepto login). Llama nada mas cargar.
    async function guard({ redirectTo = LOGIN_URL } = {}) {
        const fake = devPreviewSession();
        if (fake) return fake;
        const profile = await apiMe();
        if (!profile || !profile.username) {
            window.location.replace(redirectTo);
            return null;
        }
        return profile;
    }

    // Inverso: si ya hay sesion y estas en login, rebota al hub
    async function bounceIfAuthed({ target = HUB_URL } = {}) {
        const session = await apiMe();
        if (session && session.username) {
            window.location.replace(target);
            return session;
        }
        return null;
    }

    /* ------- Clock ------- */
    function startClock(el) {
        if (!el) return;
        function tick() {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            el.textContent = `${hh}:${mm}:${ss}`;
        }
        tick();
        setInterval(tick, 1000);
    }

    function generateSessionId() {
        const bytes = new Uint8Array(6);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    /* ------- Login page init ------- */
    async function initLoginPage() {
        // Si ya hay sesion, saltar directo al hub
        await bounceIfAuthed();

        const form = document.getElementById('adm-login-form');
        if (!form) return;

        const userInput = document.getElementById('adm-user');
        const passInput = document.getElementById('adm-pass');
        const submit = form.querySelector('.adm-submit');
        const submitLabel = submit ? submit.querySelector('.adm-submit__label') : null;
        const status = document.getElementById('adm-status');
        const userField = userInput ? userInput.closest('.adm-field') : null;
        const passField = passInput ? passInput.closest('.adm-field') : null;
        const toggleBtn = document.querySelector('[data-pass-toggle]');

        // SID decorativo
        const sidEl = document.getElementById('adm-sid');
        if (sidEl) sidEl.textContent = `SID · ${generateSessionId()}`;

        // Clock y meta
        startClock(document.getElementById('adm-clock'));

        // Password toggle
        if (toggleBtn && passInput) {
            toggleBtn.addEventListener('click', () => {
                const isPass = passInput.type === 'password';
                passInput.type = isPass ? 'text' : 'password';
                toggleBtn.textContent = isPass ? 'Ocultar' : 'Mostrar';
                passInput.focus();
            });
        }

        // Reset error state on typing
        [userInput, passInput].forEach((inp) => {
            if (!inp) return;
            inp.addEventListener('input', () => {
                if (userField) userField.classList.remove('is-error');
                if (passField) passField.classList.remove('is-error');
                if (submit) submit.classList.remove('is-error');
                if (status) {
                    status.classList.remove('is-error');
                    status.textContent = '';
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = (userInput?.value || '').trim();
            const password = passInput?.value || '';
            if (!username || !password) return;

            if (submit) {
                submit.classList.remove('is-error');
                submit.classList.add('is-loading');
                submit.disabled = true;
                if (submitLabel) submitLabel.textContent = 'Verificando';
            }
            if (status) {
                status.classList.remove('is-error', 'is-success');
                status.textContent = 'Comprobando credenciales…';
            }

            const result = await apiLogin(username, password);

            if (result.ok && result.user) {
                if (submit) {
                    submit.classList.remove('is-loading');
                    submit.classList.add('is-success');
                    if (submitLabel) submitLabel.textContent = 'Acceso concedido';
                }
                if (status) {
                    status.classList.add('is-success');
                    status.textContent = `Bienvenido, ${result.user.username}`;
                }
                // Pequeño delay para que se vea el estado
                setTimeout(() => { window.location.replace(HUB_URL); }, 650);
                return;
            }

            if (submit) {
                submit.classList.remove('is-loading');
                submit.classList.add('is-error');
                if (submitLabel) submitLabel.textContent = 'Reintentar';
                submit.disabled = false;
            }
            if (userField) userField.classList.add('is-error');
            if (passField) passField.classList.add('is-error');
            if (status) {
                status.classList.add('is-error');
                if (result.status === 429) {
                    status.textContent = 'Demasiados intentos. Espera unos minutos.';
                } else if (result.status === 500) {
                    status.textContent = 'Error del servidor. Revisa configuracion.';
                } else {
                    status.textContent = 'Credenciales incorrectas.';
                }
            }
            if (passInput) {
                passInput.value = '';
                passInput.focus();
            }
        });

        // Focus inicial
        setTimeout(() => {
            if (userInput && !userInput.value) userInput.focus();
            else if (passInput) passInput.focus();
        }, 400);
    }

    /* ------- Hub init ------- */
    async function initHubPage() {
        const profile = await guard();
        if (!profile) return;

        // Pintar username en topbar
        const userEl = document.getElementById('adm-user-tag');
        if (userEl && profile.username) userEl.textContent = profile.username;

        // Pintar role
        const roleEl = document.getElementById('adm-role-tag');
        if (roleEl && profile.role) roleEl.textContent = profile.role;

        // Clock
        startClock(document.getElementById('adm-clock'));

        // Sidemeta: session expiry
        const expEl = document.getElementById('adm-session-exp');
        if (expEl && profile.expiresAt) {
            const d = new Date(profile.expiresAt);
            expEl.textContent = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        }

        // Logout
        const logoutBtn = document.getElementById('adm-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                logoutBtn.disabled = true;
                logoutBtn.textContent = 'Saliendo…';
                await apiLogout();
                window.location.replace(LOGIN_URL);
            });
        }

        // Registry + render
        try {
            const res = await fetch('/admin/integrations.json', { cache: 'no-store' });
            if (!res.ok) throw new Error('registry not found');
            const integrations = await res.json();
            renderIntegrations(integrations, profile);
        } catch (err) {
            console.error('[hub] registry error:', err);
            const grid = document.getElementById('adm-integrations');
            if (grid) {
                grid.innerHTML = `<div class="adm-int is-soon"><div class="adm-int__head"><span class="adm-int__num">ERR</span><span class="adm-int__badge">No cargado</span></div><h3 class="adm-int__title">Registro no disponible</h3><p class="adm-int__desc">No se pudo cargar <code>/admin/integrations.json</code>. Revisa consola.</p></div>`;
            }
        }
    }

    /* ------- Integration card render ------- */
    const GLYPHS = {
        chart: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 5-7"/></svg>',
        users: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M3 21c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="7" r="3"/><path d="M15 13c3 0 6 2 6 5"/></svg>',
        mail: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 6l9 7 9-7"/></svg>',
        document: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
        settings: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
        layers: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 16l10 5 10-5M2 12l10 5 10-5"/></svg>',
        bolt: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>',
    };

    function renderIntegrations(list, profile) {
        const grid = document.getElementById('adm-integrations');
        const chapter = document.getElementById('adm-int-chapter');
        if (!grid) return;
        if (!Array.isArray(list) || list.length === 0) {
            grid.innerHTML = '<p class="adm-stage__sub">No hay integraciones registradas todavia.</p>';
            if (chapter) chapter.textContent = 'Sin integraciones';
            return;
        }

        const access = Array.isArray(profile?.access) ? profile.access : [];
        const hasAll = access.includes('*');

        const visible = list.filter((item) => hasAll || access.includes(item.id));
        const liveOnly = visible.filter((item) => item.status === 'live');

        if (liveOnly.length === 0) {
            grid.innerHTML = '<p class="adm-stage__sub">Tu cuenta no tiene integraciones activas. Habla con un admin.</p>';
            if (chapter) chapter.textContent = 'Sin integraciones activas';
            return;
        }

        if (chapter) {
            chapter.textContent = 'Activas · ' + String(liveOnly.length).padStart(2, '0');
        }

        const html = liveOnly.map((item, i) => {
            const num = String(i + 1).padStart(2, '0');
            const glyph = GLYPHS[item.icon] || GLYPHS.layers;
            const metaBits = (item.meta || []).map((m) => `<span>${escapeHtml(m)}</span>`).join('');

            return `
                <a href="${escapeAttr(item.path)}" class="adm-int">
                    <div class="adm-int__head">
                        <span class="adm-int__num">${num}</span>
                        <span class="adm-int__badge adm-int__badge--live">Live</span>
                    </div>
                    <div class="adm-int__glyph" aria-hidden="true">${glyph}</div>
                    <h3 class="adm-int__title">${escapeHtml(item.name)}</h3>
                    <p class="adm-int__desc">${escapeHtml(item.description || '')}</p>
                    <div class="adm-int__meta">${metaBits}</div>
                    <div class="adm-int__cta">Entrar <span aria-hidden="true">\u2192</span></div>
                </a>
            `;
        }).join('');

        grid.innerHTML = html;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
    }

    function escapeAttr(str) {
        return escapeHtml(str);
    }

    /* ------- Public surface ------- */
    window.CruxAdmin = {
        guard,
        bounceIfAuthed,
        login: apiLogin,
        logout: apiLogout,
        verify: apiVerify,
        initLoginPage,
        initHubPage,
    };

    /* ------- Auto-init by page role ------- */
    document.addEventListener('DOMContentLoaded', () => {
        const role = document.body.dataset.adminPage;
        if (role === 'login') initLoginPage();
        else if (role === 'hub') initHubPage();
        else if (role === 'integration') {
            // Protege cualquier integracion. No hace mas logica especifica;
            // cada integracion maneja su propia UI.
            guard();
        }
    });
})();
