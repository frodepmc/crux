/* ═══════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════ */
const cursor = document.getElementById('cursor');
let cursorX = 0, cursorY = 0;
let currentX = 0, currentY = 0;
let cursorRafId = null;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverQuery = window.matchMedia('(hover: hover)');
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function animateCursor() {
    const dx = cursorX - currentX;
    const dy = cursorY - currentY;
    currentX += dx * 0.15;
    currentY += dy * 0.15;
    if (cursor) {
        cursor.style.left = currentX + 'px';
        cursor.style.top = currentY + 'px';
    }
    /* Stop loop once the cursor has caught up (< 0.5px delta) */
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

/* Only activate custom cursor on devices with hover (pointer) */
if (hoverQuery.matches && cursor) {
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        if (!cursor.classList.contains('is-visible')) {
            cursor.classList.add('is-visible');
        }
        startCursorLoop();
    });

    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-visible');
        stopCursorLoop();
    });

    /* Hover states for interactive elements */
    const hoverTargets = document.querySelectorAll('a, button, .flow-card');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
}

function getFocusableElements(container) {
    return [...container.querySelectorAll(focusableSelector)].filter((el) => !el.hidden && !el.closest('[hidden]') && !el.closest('[inert]'));
}

/* ═══════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════ */
const progressBar = document.querySelector('.scroll-progress');

function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
}

/* ═══════════════════════════════════════
   NAV SCROLL STATE
   ═══════════════════════════════════════ */
const nav = document.querySelector('.nav');

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
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            /* Stagger only among direct-child .reveal siblings, excluding
               already-visible ones, to avoid inflated delays on nested reveals */
            const parent = entry.target.parentElement;
            const directReveals = [...parent.children].filter(
                (el) => el.classList.contains('reveal') && !el.classList.contains('is-visible')
            );
            const siblingIndex = directReveals.indexOf(entry.target);
            const delay = siblingIndex > 0 ? siblingIndex * 120 : 0;

            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, delay);

            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════
   MOBILE MENU
   ═══════════════════════════════════════ */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = mobileMenu.querySelectorAll('a');
let lastFocusedElement = null;

mobileMenu.inert = true;

function trapMenuFocus(event) {
    if (!mobileMenu.classList.contains('is-open') || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(mobileMenu);
    if (focusableElements.length === 0) {
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

function openMenu() {
    lastFocusedElement = document.activeElement;
    mobileMenu.inert = false;
    mobileMenu.classList.add('is-open');
    nav.classList.add('menu-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Cerrar menú');
    menuBtn.textContent = 'Cerrar';
    document.body.style.overflow = 'hidden';

    const [firstLink] = getFocusableElements(mobileMenu);
    if (firstLink) {
        firstLink.focus();
    }
}

function closeMenu(options = {}) {
    const { returnFocus = true } = options;
    mobileMenu.classList.remove('is-open');
    nav.classList.remove('menu-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menú');
    menuBtn.textContent = 'Menú';
    document.body.style.overflow = '';
    mobileMenu.inert = true;

    if (returnFocus && lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function toggleMenu() {
    if (mobileMenu.classList.contains('is-open')) {
        closeMenu();
    } else {
        openMenu();
    }
}

menuBtn.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => link.addEventListener('click', () => closeMenu({ returnFocus: false })));

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
    }

    trapMenuFocus(e);
});

/* ═══════════════════════════════════════
   SMOOTH SCROLL
   ═══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = nav.offsetHeight + 20;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
            });
        }
    });
});

/* ═══════════════════════════════════════
   ACCORDIONS
   ═══════════════════════════════════════ */
/* Row-split: position horizontal diagonal at the actual row boundary */
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
    grid.style.setProperty('--row-split', splitPx + 'px');
}

let accordionIndex = 0;

function syncAccordionState(acc) {
    const trigger = acc.querySelector(':scope > .svc-accordion__trigger');
    const panel = acc.querySelector(':scope > .svc-accordion__panel');
    if (!trigger || !panel) return;

    const isOpen = acc.classList.contains('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));
    panel.inert = !isOpen;
}

document.querySelectorAll('[data-accordion]').forEach(acc => {
    const trigger = acc.querySelector(':scope > .svc-accordion__trigger');
    const panel = acc.querySelector(':scope > .svc-accordion__panel');
    if (!trigger || !panel) return;

    accordionIndex += 1;
    const triggerId = trigger.id || `accordion-trigger-${accordionIndex}`;
    const panelId = panel.id || `accordion-panel-${accordionIndex}`;

    trigger.id = triggerId;
    trigger.setAttribute('aria-controls', panelId);

    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', triggerId);

    syncAccordionState(acc);

    trigger.addEventListener('click', () => {
        acc.classList.toggle('is-open');
        syncAccordionState(acc);
        setTimeout(updateRowSplit, 460);
    });
});

function handleResize() {
    updateRowSplit();
    syncScrollUi();

    if (window.innerWidth > 480 && mobileMenu.classList.contains('is-open')) {
        closeMenu({ returnFocus: false });
    }
}

// Initial + resize (debounced)
updateRowSplit();
syncScrollUi();

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 150);
});

/* ═══════════════════════════════════════
   CONTACT FORM CHANNEL TOGGLE
   ═══════════════════════════════════════ */
const contactPanel = document.getElementById('contactFormPanel');
const channelButtons = document.querySelectorAll('.contact__channel-btn');
const contactForms = document.querySelectorAll('.contact__form');

if (contactPanel) {
    function setActiveChannel(channel, options = {}) {
        const { shouldFocus = false } = options;
        const isOpen = Boolean(channel);

        channelButtons.forEach((button) => {
            const active = button.dataset.channel === channel;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-expanded', String(active));
        });

        contactForms.forEach((form) => {
            form.hidden = form.id !== `form-${channel}`;
        });

        contactPanel.classList.toggle('is-open', isOpen);
        contactPanel.setAttribute('aria-hidden', String(!isOpen));
        contactPanel.inert = !isOpen;

        if (isOpen && shouldFocus) {
            const activeForm = document.getElementById(`form-${channel}`);
            const firstField = activeForm ? activeForm.querySelector(focusableSelector) : null;
            if (firstField instanceof HTMLElement) {
                firstField.focus();
            }
        }
    }

    channelButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextChannel = btn.classList.contains('is-active') ? null : btn.dataset.channel;
            setActiveChannel(nextChannel, { shouldFocus: Boolean(nextChannel) });
        });
    });

    setActiveChannel(null);
}

/* ═══════════════════════════════════════
   FORM SUBMISSIONS
   ═══════════════════════════════════════ */

/* ─── EmailJS Init ─── */
if (typeof emailjs !== 'undefined') {
    emailjs.init('Jx7AidbORhprabBNA');
}

/* ─── Button state helper ─── */
function setButtonState(btn, state, originalText) {
    btn.classList.remove('contact__submit--sending', 'contact__submit--success', 'contact__submit--error');

    switch (state) {
        case 'sending':
            btn.disabled = true;
            btn.classList.add('contact__submit--sending');
            btn.textContent = 'Enviando...';
            break;
        case 'success':
            btn.disabled = true;
            btn.classList.add('contact__submit--success');
            btn.textContent = 'Enviado \u2714';
            setTimeout(() => {
                btn.disabled = false;
                btn.classList.remove('contact__submit--success');
                btn.textContent = originalText;
            }, 3000);
            break;
        case 'error':
            btn.disabled = false;
            btn.classList.add('contact__submit--error');
            btn.textContent = 'Error \u2014 Reintentar';
            setTimeout(() => {
                btn.classList.remove('contact__submit--error');
                btn.textContent = originalText;
            }, 4000);
            break;
        default:
            btn.disabled = false;
            btn.textContent = originalText;
    }
}

/* ─── WhatsApp form ─── */
const whatsappForm = document.getElementById('form-whatsapp');
if (whatsappForm) {
    whatsappForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = this.querySelector('[name="name"]').value.trim();
        const phone = this.querySelector('[name="phone"]').value.trim();
        const message = this.querySelector('[name="message"]').value.trim();

        if (!name || !phone) return;

        let text = '*Nuevo contacto desde la web CRUX*\n\n'
            + '*Nombre:* ' + name + '\n'
            + '*Teléfono:* ' + phone;

        if (message) {
            text += '\n*Proyecto:* ' + message;
        }

        /* Use a hidden link + click instead of window.open to avoid popup blockers */
        const waUrl = 'https://wa.me/34692447491?text=' + encodeURIComponent(text);
        const waLink = document.createElement('a');
        waLink.href = waUrl;
        waLink.target = '_blank';
        waLink.rel = 'noopener';
        waLink.click();

        /* Visual feedback */
        const btn = this.querySelector('.contact__submit');
        setButtonState(btn, 'success', 'Enviar por WhatsApp');
        this.reset();
    });
}

/* ─── Email form (EmailJS) ─── */
/* NOTE: EmailJS public key, service ID, and template ID below are client-side
   credentials. Rate limiting must be configured in the EmailJS dashboard. */
const emailForm = document.getElementById('form-email');
if (emailForm) {
    emailForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = this.querySelector('.contact__submit');
        const originalText = 'Enviar email';

        if (typeof emailjs === 'undefined') {
            setButtonState(btn, 'error', originalText);
            return;
        }

        setButtonState(btn, 'sending', originalText);

        try {
            await emailjs.sendForm('service_5ir3mca', 'template_97d0r04', this);
            setButtonState(btn, 'success', originalText);
            this.reset();
        } catch (err) {
            console.error('EmailJS error:', err);
            setButtonState(btn, 'error', originalText);
        }
    });
}

/* ═══════════════════════════════════════
   ACTIVE NAV LINK
   ═══════════════════════════════════════ */
const currentPath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
document.querySelectorAll('.nav__links a, .mobile-menu__links a').forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (linkPath === currentPath && !link.getAttribute('href').startsWith('#')) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'page');
    }
});
