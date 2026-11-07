/* ==========================================================
   DIGITAL DEFENSE LAB: script.js
   ----------------------------------------------------------
   CONTENTS
   00. Supabase setup
   01. Helpers
   02. Footer year
   03. Header state & scroll progress
   04. Mobile menu
   05. Smooth scrolling & active nav link
   06. Scroll-reveal animations
   07. Card spotlight (pointer-following glow)
   08. Placeholder links & toast
   09. Contact form (validation + Supabase)
   10. Skill progress bars
   ========================================================== */


/* ---------- 00. SUPABASE SETUP ---------- */
// The publishable key is safe to expose. Real protection comes from
// Row Level Security (RLS) policies on the Supabase table.
const SUPABASE_URL = "https://joeyvflyikobjeeurqpr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hu1CxmGgDNIGzw0ozoNkig_d_8TUnKO";

// If the CDN script fails to load, the rest of the site must still work.
const supabaseClient = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;


(function () {
  'use strict';

  /* ---------- 01. HELPERS ---------- */
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => motionQuery.matches;


  /* ---------- 02. FOOTER YEAR ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());


  /* ---------- 03. HEADER STATE & SCROLL PROGRESS ---------- */
  const header = $('.site-header');
  const progressBar = $('.scroll-progress span');
  let scrollTicking = false;

  function updateOnScroll() {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 12);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      progressBar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    }
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateOnScroll();


  /* ---------- 04. MOBILE MENU ---------- */
  const navToggle = $('#navToggle');
  const nav = $('#primaryNav');
  const desktopQuery = window.matchMedia('(min-width: 900px)');

  function setMenu(open) {
    if (!navToggle || !nav) return;
    nav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a link
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    // Close when tapping outside the menu
    document.addEventListener('click', function (event) {
      const isOpen = nav.classList.contains('is-open');
      if (isOpen && !nav.contains(event.target) && !navToggle.contains(event.target)) {
        setMenu(false);
      }
    });

    // Close with the Escape key and return focus to the button
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });

    // Reset the menu when the layout switches to desktop
    const onBreakpointChange = function (event) { if (event.matches) setMenu(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onBreakpointChange);
    else if (desktopQuery.addListener) desktopQuery.addListener(onBreakpointChange);
  }


  /* ---------- 05. SMOOTH SCROLLING & ACTIVE NAV LINK ---------- */
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-placeholder')) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start'
    });

    // Update the address bar hash (wrapped: some previews restrict the History API)
    try { history.replaceState(null, '', hash); } catch (error) { /* ignore */ }

    // Move keyboard focus to the section for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // Highlight the nav link of the section currently in view
  const navLinks = $$('.nav-link');
  const watched = navLinks
    .map(function (link) { return $(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    watched.forEach(function (section) { spy.observe(section); });
  }


  /* ---------- 06. SCROLL-REVEAL ANIMATIONS ---------- */
  // Elements marked data-reveal fade in once as they enter the viewport.
  // Parents marked data-stagger="N" give their children a small delay
  // that repeats every N items (for tidy row-by-row reveals).
  const revealItems = $$('[data-reveal]');

  if (revealItems.length && !prefersReducedMotion() && 'IntersectionObserver' in window) {
    $$('[data-stagger]').forEach(function (group) {
      const cycle = parseInt(group.getAttribute('data-stagger'), 10) || 4;
      $$(':scope > [data-reveal]', group).forEach(function (item, index) {
        item.style.setProperty('--reveal-delay', (index % cycle) * 80 + 'ms');
      });
    });

    revealItems.forEach(function (item) { item.classList.add('reveal'); });

    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        observer.unobserve(el);

        // After the entrance finishes, remove the reveal classes so the
        // element's own hover transitions (cards) work normally again.
        const delay = parseInt(getComputedStyle(el).getPropertyValue('--reveal-delay'), 10) || 0;
        window.setTimeout(function () {
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--reveal-delay');
        }, 900 + delay);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }
  // If reduced motion is on (or IntersectionObserver is missing), nothing is
  // hidden: content is simply visible from the start.


  /* ---------- 07. CARD SPOTLIGHT ---------- */
  if (window.matchMedia('(hover: hover)').matches && !prefersReducedMotion()) {
    let spotlightFrame = null;

    document.addEventListener('pointermove', function (event) {
      const card = event.target.closest ? event.target.closest('.card') : null;
      if (!card || spotlightFrame) return;

      const x = event.clientX;
      const y = event.clientY;
      spotlightFrame = window.requestAnimationFrame(function () {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (x - rect.left) + 'px');
        card.style.setProperty('--my', (y - rect.top) + 'px');
        spotlightFrame = null;
      });
    }, { passive: true });
  }


  /* ---------- 08. PLACEHOLDER LINKS & TOAST ---------- */
  const toast = $('#toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;          // textContent: never inserts HTML
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  // Links marked data-placeholder do nothing but remind you to edit them.
  document.addEventListener('click', function (event) {
    const link = event.target.closest('[data-placeholder]');
    if (!link) return;
    event.preventDefault();
    showToast('Placeholder link: edit the href in index.html');
  });


  /* ---------- 09. CONTACT FORM (VALIDATION + SUPABASE) ---------- */
  /*
    The browser validates input first. Valid messages are then saved
    to the "messages" table in Supabase. The table must have Row Level
    Security enabled with an INSERT-only policy for the "anon" role,
    and CHECK constraints that repeat these length limits, because
    browser validation alone can always be bypassed.
  */
  const form = $('#contactForm');

  if (form) {
    const statusEl = $('#formStatus');
    const counterEl = $('#msgCount');
    const counterWrap = counterEl ? counterEl.parentElement : null;
    const submitBtn = $('#submitBtn');

    const LIMITS = { nameMin: 2, nameMax: 80, emailMax: 254, messageMin: 10, messageMax: 1000 };

    // Basic input hygiene: strip control characters and tidy whitespace
    const cleanSingleLine = function (value) {
      return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    };
    const cleanMultiLine = function (value) {
      return value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/\r\n?/g, '\n')
        .trim();
    };

    // Each validator returns an error message, or '' when the value is valid
    const validators = {
      name: function (raw) {
        const value = cleanSingleLine(raw);
        if (!value) return 'Please enter your name.';
        if (value.length < LIMITS.nameMin) return 'Your name must be at least 2 characters.';
        if (value.length > LIMITS.nameMax) return 'Your name must be 80 characters or fewer.';
        if (!/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(value)) {
          return 'Use letters, spaces, apostrophes, periods or hyphens only.';
        }
        return '';
      },
      email: function (raw) {
        const value = cleanSingleLine(raw);
        if (!value) return 'Please enter your email address.';
        if (value.length > LIMITS.emailMax) return 'That email address is too long.';
        if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(value)) {
          return 'Enter a valid email address, e.g. name@example.com.';
        }
        return '';
      },
      message: function (raw) {
        const value = cleanMultiLine(raw);
        if (!value) return 'Please write a message.';
        if (value.length < LIMITS.messageMin) return 'Your message must be at least 10 characters.';
        if (value.length > LIMITS.messageMax) return 'Your message must be 1000 characters or fewer.';
        return '';
      }
    };

    const fields = ['name', 'email', 'message'].map(function (key) {
      return {
        key: key,
        input: $('#cf-' + key, form),
        error: $('#cf-' + key + '-error', form),
        touched: false
      };
    });

    function setFieldState(field, message) {
      const wrap = field.input.closest('.field');
      field.error.textContent = message;
      if (message) {
        wrap.classList.add('has-error');
        wrap.classList.remove('is-valid');
        field.input.setAttribute('aria-invalid', 'true');
      } else {
        wrap.classList.remove('has-error');
        wrap.classList.add('is-valid');
        field.input.removeAttribute('aria-invalid');
      }
    }

    function validateField(field) {
      const message = validators[field.key](field.input.value);
      setFieldState(field, message);
      return message;
    }

    function resetFieldStates() {
      fields.forEach(function (field) {
        field.touched = false;
        field.error.textContent = '';
        field.input.removeAttribute('aria-invalid');
        field.input.closest('.field').classList.remove('has-error', 'is-valid');
      });
    }

    function setStatus(type, message) {
      statusEl.className = 'form-status' + (type ? ' is-' + type : '');
      statusEl.textContent = message;     // textContent: never inserts HTML
    }

    function updateCounter() {
      const length = fields[2].input.value.length;
      counterEl.textContent = String(length);
      if (counterWrap) counterWrap.classList.toggle('is-near-limit', length >= LIMITS.messageMax - 50);
    }

    // Live feedback: validate after the field has been visited
    fields.forEach(function (field) {
      field.input.addEventListener('blur', function () {
        field.touched = true;
        validateField(field);
      });
      field.input.addEventListener('input', function () {
        if (field.key === 'message') updateCounter();
        if (field.touched) validateField(field);
      });
    });

    // Saves the message to Supabase. Do NOT chain .select() here:
    // the table has no SELECT policy, so reading back would fail.
    function deliver(payload) {
      if (!supabaseClient) {
        return Promise.reject(new Error('Supabase client is not loaded'));
      }
      return supabaseClient
        .from('messages')
        .insert([payload])
        .then(function (res) {
          if (res.error) throw res.error;
          return { delivered: true };
        });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('', '');

      let firstInvalid = null;
      fields.forEach(function (field) {
        field.touched = true;
        const message = validateField(field);
        if (message && !firstInvalid) firstInvalid = field.input;
      });

      if (firstInvalid) {
        setStatus('error', 'Please fix the highlighted fields and try again.');
        firstInvalid.focus();
        return;
      }

      const payload = {
        name: cleanSingleLine(fields[0].input.value),
        email: cleanSingleLine(fields[1].input.value),
        message: cleanMultiLine(fields[2].input.value)
      };

      submitBtn.disabled = true;

      deliver(payload)
        .then(function () {
          setStatus('success', 'Message sent. Thank you for reaching out.');
          form.reset();
          resetFieldStates();
          updateCounter();
        })
        .catch(function (error) {
          console.error('Message send failed:', error);
          setStatus('error', 'Something went wrong while sending. Please try again later.');
        })
        .then(function () {
          submitBtn.disabled = false;
        });
    });

    updateCounter();
  }


  /* ---------- 10. SKILL PROGRESS BARS ---------- */
  // Reads data-level from each bar, syncs the percentage text and
  // aria value, then animates the fill when the card scrolls into view.
  $$('.skill-card').forEach(function (card) {
    const bar = $('.prof-bar', card);
    const fill = bar && $('span[data-level]', bar);
    if (!fill) return;

    const level = Math.max(0, Math.min(100, parseInt(fill.dataset.level, 10) || 0));
    const val = $('.prof-val', card);
    if (val) val.textContent = level + '%';
    bar.setAttribute('aria-valuenow', String(level));
  });

  const bars = $$('.prof-bar span[data-level]');

  if ('IntersectionObserver' in window) {
    const barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.width = entry.target.dataset.level + '%';
        barObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    bars.forEach(function (bar) { barObserver.observe(bar); });
  } else {
    bars.forEach(function (bar) { bar.style.width = bar.dataset.level + '%'; });
  }

})();

