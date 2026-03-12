/* ═══════════════════════════════════════
   GLOBAL SETUP
   ═══════════════════════════════════════ */
const root = document.documentElement;
const cursor = document.getElementById('cursor');
const nav = document.querySelector('.nav');
const progressBar = document.querySelector('.scroll-progress');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverQuery = window.matchMedia('(hover: hover)');
const supportsInert = 'inert' in HTMLElement.prototype;
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}

function setInertState(element, shouldBeInert) {
    if (!element) return;
    element.toggleAttribute('inert', shouldBeInert);
    if (supportsInert) {
        element.inert = shouldBeInert;
    }
}

function getFocusableElements(container) {
    if (!container) return [];
    return [...container.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && !element.closest('[hidden]') && !element.closest('[inert]'));
}

function prefersReducedMotion() {
    return reducedMotionQuery.matches;
}

/* ═══════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════ */
let cursorX = 0;
let cursorY = 0;
let currentX = 0;
let currentY = 0;
let cursorRafId = null;

function animateCursor() {
    const dx = cursorX - currentX;
    const dy = cursorY - currentY;

    currentX += dx * 0.15;
    currentY += dy * 0.15;

    if (cursor) {
        cursor.style.left = `${currentX}px`;
        cursor.style.top = `${currentY}px`;
    }

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        cursorRafId = null;
        return;
    }

    cursorRafId = requestAnimationFrame(animateCursor);
}

function startCursorLoop() {
    if (cursorRafId === null) {
        cursorRafId = requestAnimationFrame(animateCursor);
    }
}

function stopCursorLoop() {
    if (cursorRafId !== null) {
        cancelAnimationFrame(cursorRafId);
        cursorRafId = null;
    }
}

function initCustomCursor() {
    if (!cursor || !hoverQuery.matches || prefersReducedMotion()) return;

    root.classList.add('cursor-ready');

    document.addEventListener('mousemove', (event) => {
        cursorX = event.clientX;
        cursorY = event.clientY;

        if (!cursor.classList.contains('is-visible')) {
            cursor.classList.add('is-visible');
        }

        startCursorLoop();
    });

    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-visible');
        cursor.classList.remove('is-hovering');
        stopCursorLoop();
    });

    document.querySelectorAll('a, button, .flow-card').forEach((element) => {
        element.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
        element.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
}

/* ═══════════════════════════════════════
   SCROLL UI
   ═══════════════════════════════════════ */
function updateProgress() {
    if (!progressBar) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressBar.style.width = `${progress}%`;
}

function updateNav() {
    if (!nav) return;

    if (window.scrollY > 80) {
        nav.classList.add('is-scrolled');
    } else {
        nav.classList.remove('is-scrolled');
    }
}

let scrollTicking = false;

function syncScrollUi() {
    updateProgress();
    updateNav();
    scrollTicking = false;
}

window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(syncScrollUi);
}, { passive: true });

window.addEventListener('pageshow', syncScrollUi);

/* ═══════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════ */
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
        revealElements.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const parent = entry.target.parentElement;
            const directReveals = parent
                ? [...parent.children].filter((element) => element.classList.contains('reveal') && !element.classList.contains('is-visible'))
                : [entry.target];
            const siblingIndex = directReveals.indexOf(entry.target);
            const delay = siblingIndex > 0 ? siblingIndex * 120 : 0;

            window.setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, delay);

            revealObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
    });

    revealElements.forEach((element) => revealObserver.observe(element));
}

/* ═══════════════════════════════════════
   MOBILE MENU
   ═══════════════════════════════════════ */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = mobileMenu ? [...mobileMenu.querySelectorAll('a')] : [];
const maskedPageElements = [
    document.getElementById('main-content'),
    document.querySelector('.footer'),
].filter(Boolean);

let lastFocusedElement = null;
let mobileMenuHideTimer = null;

function syncMaskedContent(isMasked) {
    maskedPageElements.forEach((element) => {
        setInertState(element, isMasked);
        if (isMasked) {
            element.setAttribute('aria-hidden', 'true');
        } else {
            element.removeAttribute('aria-hidden');
        }
    });
}

function syncMenuState(isOpen) {
    if (!mobileMenu || !menuBtn) return;

    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    menuBtn.textContent = isOpen ? 'Cerrar' : 'Menú';

    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    setInertState(mobileMenu, !isOpen);
    syncMaskedContent(isOpen);
}

function openMenu() {
    if (!mobileMenu || !menuBtn || !nav) return;

    lastFocusedElement = document.activeElement;
    window.clearTimeout(mobileMenuHideTimer);
    mobileMenu.hidden = false;
    mobileMenu.classList.remove('is-closing');

    requestAnimationFrame(() => {
        mobileMenu.classList.add('is-open');
    });

    nav.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    syncMenuState(true);

    const [firstLink] = getFocusableElements(mobileMenu);
    if (firstLink) {
        firstLink.focus();
    }
}

function closeMenu(options = {}) {
    const { returnFocus = true } = options;
    if (!mobileMenu || !menuBtn || !nav) return;

    mobileMenu.classList.remove('is-open');
    mobileMenu.classList.add('is-closing');
    nav.classList.remove('menu-open');
    document.body.style.overflow = '';
    syncMenuState(false);

    window.clearTimeout(mobileMenuHideTimer);
    mobileMenuHideTimer = window.setTimeout(() => {
        mobileMenu.hidden = true;
        mobileMenu.classList.remove('is-closing');
    }, 650);

    if (returnFocus && lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function trapMenuFocus(event) {
    if (!mobileMenu || !mobileMenu.classList.contains('is-open') || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(mobileMenu);
    if (!focusableElements.length) {
        event.preventDefault();
        return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function initMobileMenu() {
    if (!menuBtn || !mobileMenu || !nav) return;

    root.classList.add('nav-ready');
    mobileMenu.hidden = true;
    syncMenuState(false);

    menuBtn.addEventListener('click', () => {
        if (mobileMenu.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    mobileLinks.forEach((link) => {
        link.addEventListener('click', () => closeMenu({ returnFocus: false }));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
            closeMenu();
        }

        trapMenuFocus(event);
    });
}

/* ═══════════════════════════════════════
   SMOOTH SCROLL
   ═══════════════════════════════════════ */
function initSmoothScroll() {
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
        const rawHref = anchor.getAttribute('href');
        if (!rawHref) return;

        const url = new URL(rawHref, window.location.href);
        const hash = url.hash;
        if (!hash || hash === '#') return;
        if (url.origin !== window.location.origin) return;
        if (normalizePath(url.pathname) !== currentPath) return;

        anchor.addEventListener('click', (event) => {
            const target = document.querySelector(hash);
            if (!target) return;

            event.preventDefault();
            const offset = nav ? nav.offsetHeight + 20 : 20;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            });
        });
    });
}

/* ═══════════════════════════════════════
   ACCORDIONS
   ═══════════════════════════════════════ */
function updateRowSplit() {
    const grid = document.querySelector('.services__blocks');
    if (!grid) return;

    const firstBlock = grid.querySelector('.svc-block:nth-child(1)');
    const secondBlock = grid.querySelector('.svc-block:nth-child(2)');
    if (!firstBlock || !secondBlock) return;

    const gridRect = grid.getBoundingClientRect();
    const row1Bottom = Math.max(
        firstBlock.getBoundingClientRect().bottom,
        secondBlock.getBoundingClientRect().bottom
    );
    const splitPx = row1Bottom - gridRect.top;

    grid.style.setProperty('--row-split', `${splitPx}px`);
}

let accordionIndex = 0;

function syncAccordionState(accordion) {
    const trigger = accordion.querySelector(':scope > .svc-accordion__trigger');
    const panel = accordion.querySelector(':scope > .svc-accordion__panel');
    if (!trigger || !panel) return;

    const isOpen = accordion.classList.contains('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));
    setInertState(panel, !isOpen);
}

function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach((accordion) => {
        const trigger = accordion.querySelector(':scope > .svc-accordion__trigger');
        const panel = accordion.querySelector(':scope > .svc-accordion__panel');
        if (!trigger || !panel) return;

        accordionIndex += 1;
        const triggerId = trigger.id || `accordion-trigger-${accordionIndex}`;
        const panelId = panel.id || `accordion-panel-${accordionIndex}`;

        trigger.id = triggerId;
        trigger.setAttribute('aria-controls', panelId);

        panel.id = panelId;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', triggerId);

        syncAccordionState(accordion);

        trigger.addEventListener('click', () => {
            accordion.classList.toggle('is-open');
            syncAccordionState(accordion);
            window.setTimeout(updateRowSplit, 460);
        });
    });
}

/* ═══════════════════════════════════════
   CONTACT FORM CHANNEL TOGGLE
   ═══════════════════════════════════════ */
const contactPanel = document.getElementById('contactFormPanel');
const channelButtons = [...document.querySelectorAll('.contact__channel-btn')];
const contactForms = [...document.querySelectorAll('.contact__form')];
const contactStatus = document.getElementById('contactStatus');
const contactFallback = document.querySelector('.contact__fallback');

function announceContactStatus(message) {
    if (!contactStatus) return;
    contactStatus.textContent = '';
    requestAnimationFrame(() => {
        contactStatus.textContent = message;
    });
}

function showContactFallback() {
    if (contactFallback) {
        contactFallback.classList.add('is-visible');
    }
}

function getRequestedChannel() {
    const channel = new URLSearchParams(window.location.search).get('canal');
    return channel === 'email' || channel === 'whatsapp' ? channel : null;
}

function setActiveChannel(channel, options = {}) {
    if (!contactPanel) return;

    const { shouldFocus = false } = options;
    const isOpen = Boolean(channel);

    channelButtons.forEach((button) => {
        const active = button.dataset.channel === channel;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-expanded', String(active));
        button.setAttribute('aria-pressed', String(active));
    });

    contactForms.forEach((form) => {
        const active = form.id === `form-${channel}`;
        form.classList.toggle('is-active', active);
        form.setAttribute('aria-hidden', String(!active));
    });

    contactPanel.classList.toggle('is-open', isOpen);
    contactPanel.setAttribute('aria-hidden', String(!isOpen));
    setInertState(contactPanel, !isOpen);

    if (isOpen && shouldFocus) {
        const activeForm = document.getElementById(`form-${channel}`);
        const firstField = activeForm ? activeForm.querySelector(focusableSelector) : null;
        if (firstField instanceof HTMLElement) {
            firstField.focus();
        }
    }
}

function initContactForms() {
    if (!contactPanel || !channelButtons.length || !contactForms.length) return;

    root.classList.add('contact-ready');
    channelButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nextChannel = button.classList.contains('is-active') ? null : button.dataset.channel;
            setActiveChannel(nextChannel, { shouldFocus: Boolean(nextChannel) });
        });
    });

    setActiveChannel(getRequestedChannel(), { shouldFocus: false });
}

/* ═══════════════════════════════════════
   FORM SUBMISSIONS
   ═══════════════════════════════════════ */
function setButtonState(button, state, originalText) {
    if (!button) return;

    button.classList.remove('contact__submit--sending', 'contact__submit--success', 'contact__submit--error');

    switch (state) {
        case 'sending':
            button.disabled = true;
            button.classList.add('contact__submit--sending');
            button.textContent = 'Enviando...';
            break;
        case 'opening':
            button.disabled = true;
            button.classList.add('contact__submit--sending');
            button.textContent = 'Abriendo WhatsApp...';
            window.setTimeout(() => {
                button.disabled = false;
                button.classList.remove('contact__submit--sending');
                button.textContent = originalText;
            }, 2500);
            break;
        case 'success':
            button.disabled = true;
            button.classList.add('contact__submit--success');
            button.textContent = 'Enviado \u2714';
            window.setTimeout(() => {
                button.disabled = false;
                button.classList.remove('contact__submit--success');
                button.textContent = originalText;
            }, 3000);
            break;
        case 'error':
            button.disabled = false;
            button.classList.add('contact__submit--error');
            button.textContent = 'Error \u2014 Reintentar';
            window.setTimeout(() => {
                button.classList.remove('contact__submit--error');
                button.textContent = originalText;
            }, 4000);
            break;
        default:
            button.disabled = false;
            button.textContent = originalText;
    }
}

if (typeof window.emailjs !== 'undefined') {
    window.emailjs.init('Jx7AidbORhprabBNA');
}

const whatsappForm = document.getElementById('form-whatsapp');
if (whatsappForm) {
    whatsappForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const name = this.querySelector('[name="name"]').value.trim();
        const phone = this.querySelector('[name="phone"]').value.trim();
        const message = this.querySelector('[name="message"]').value.trim();
        const button = this.querySelector('.contact__submit');
        const originalText = 'Enviar por WhatsApp';

        if (!name || !phone) return;

        let text = '*Nuevo contacto desde la web CRUX*\n\n'
            + `*Nombre:* ${name}\n`
            + `*Teléfono:* ${phone}`;

        if (message) {
            text += `\n*Proyecto:* ${message}`;
        }

        const waUrl = `https://wa.me/34692447491?text=${encodeURIComponent(text)}`;
        const popup = window.open(waUrl, '_blank');

        if (popup) {
            popup.opener = null;
            setButtonState(button, 'opening', originalText);
            announceContactStatus('Se ha abierto WhatsApp en una pestaña nueva.');
            this.reset();
        } else {
            showContactFallback();
            setButtonState(button, 'error', originalText);
            announceContactStatus('No se pudo abrir WhatsApp automáticamente. Puedes usar los enlaces directos debajo.');
        }
    });
}

const emailForm = document.getElementById('form-email');
if (emailForm) {
    emailForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const button = this.querySelector('.contact__submit');
        const originalText = 'Enviar email';

        if (typeof window.emailjs === 'undefined') {
            showContactFallback();
            setButtonState(button, 'error', originalText);
            announceContactStatus('El envío por email no está disponible ahora mismo. Puedes continuar por WhatsApp o Instagram.');
            return;
        }

        setButtonState(button, 'sending', originalText);

        try {
            await window.emailjs.sendForm('service_5ir3mca', 'template_97d0r04', this);
            setButtonState(button, 'success', originalText);
            announceContactStatus('El formulario se ha enviado correctamente.');
            this.reset();
        } catch (error) {
            console.error('EmailJS error:', error);
            showContactFallback();
            setButtonState(button, 'error', originalText);
            announceContactStatus('No se pudo enviar el email. Puedes continuar por WhatsApp o Instagram.');
        }
    });
}

/* ═══════════════════════════════════════
   ACTIVE NAV LINK
   ═══════════════════════════════════════ */
function initActiveNavLink() {
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('.nav__links a, .mobile-menu__links a').forEach((link) => {
        const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
        if (linkPath === currentPath && !link.getAttribute('href').startsWith('#')) {
            link.classList.add('is-current');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/* ═══════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════ */
let resizeTimer;

function handleResize() {
    updateRowSplit();
    syncScrollUi();

    if (mobileMenu && mobileMenu.classList.contains('is-open') && window.innerWidth > 480) {
        closeMenu({ returnFocus: false });
    }
}

window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(handleResize, 150);
});

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
initCustomCursor();
initRevealAnimations();
initMobileMenu();
initSmoothScroll();
initAccordions();
initContactForms();
initActiveNavLink();
updateRowSplit();
syncScrollUi();
