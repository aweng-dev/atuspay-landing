/* AtusPay — landing page interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ──────────────────────────────────────────────────────────────────────
     Where the installable web app lives. Change this to wherever the PWA is
     deployed (e.g. https://app.atuspay.co or https://atuspay.co/app).
     ────────────────────────────────────────────────────────────────────── */
  const APP_URL = 'https://app.atuspay.co';
  const appLink = (path = '/') => APP_URL.replace(/\/$/, '') + path;

  /* Wire every [data-app-link] to the real app URL */
  $$('[data-app-link]').forEach((el) => {
    el.setAttribute('href', appLink(el.getAttribute('data-app-link') || '/'));
  });

  /* Sticky header shadow */
  const header = $('#header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile nav */
  const toggle = $('#navToggle');
  const nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('#nav a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }),
    );
  }

  /* Reveal-on-scroll */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in-view'));
  }

  /* ──────────────────────────────────────────────────────────────────────
     Install flow — platform detection + modal + beforeinstallprompt
     ────────────────────────────────────────────────────────────────────── */
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  const isAndroid = /Android/.test(ua);
  const defaultTab = isIOS ? 'ios' : isAndroid ? 'android' : 'android';

  const modal = $('#installModal');
  let lastFocus = null;
  let deferredPrompt = null;

  const selectTab = (tab) => {
    if (!modal) return;
    $$('.seg__btn', modal).forEach((b) =>
      b.setAttribute('aria-selected', String(b.dataset.tab === tab)),
    );
    $$('.modal__pane', modal).forEach((p) => {
      p.hidden = p.dataset.pane !== tab;
    });
  };

  const openModal = () => {
    if (!modal) return;
    lastFocus = document.activeElement;
    selectTab(defaultTab);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = $('.modal__close', modal);
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  $$('[data-open-install]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    }),
  );
  $$('[data-close-install]').forEach((b) => b.addEventListener('click', closeModal));
  if (modal) {
    $$('.seg__btn', modal).forEach((b) =>
      b.addEventListener('click', () => selectTab(b.dataset.tab)),
    );
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* Native install (Chromium): capture the event and use it when available */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.documentElement.classList.add('can-install');
  });

  $$('[data-install-action]').forEach((el) =>
    el.addEventListener('click', async (e) => {
      if (deferredPrompt) {
        e.preventDefault();
        deferredPrompt.prompt();
        try {
          await deferredPrompt.userChoice;
        } catch (_) {
          /* dismissed */
        }
        deferredPrompt = null;
      }
      /* else: fall through to the href (opens the app, which prompts install) */
    }),
  );

  window.addEventListener('appinstalled', closeModal);

  /* Footer year */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
