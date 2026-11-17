// Supabase configuration
const SUPABASE_URL = "https://joeyvflyikobjeeurqpr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hu1CxmGgDNIGzw0ozoNkig_d_8TUnKO";

const supabaseClient = window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;


(function () {
    'use strict';

    // Small helper functions
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = () => motionQuery.matches;


    // Update the copyright year automatically
    const yearEl = $('#year');

    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }


    // Header and scroll progress
    const header = $('.site-header');
    const progressBar = $('.scroll-progress span');

    let scrollTicking = false;

    function updateOnScroll() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        if (header) {
            header.classList.toggle('is-scrolled', scrollY > 12);
        }

        if (progressBar) {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

            progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
        }

        scrollTicking = false;
    }

    function requestScrollUpdate() {
        if (scrollTicking) return;

        scrollTicking = true;
        requestAnimationFrame(updateOnScroll);
    }

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);

    updateOnScroll();


    // Mobile navigation
    const navToggle = $('#navToggle');
    const nav = $('#primaryNav');
    const desktopQuery = window.matchMedia('(min-width: 900px)');

    function setMenu(open) {
        if (!navToggle || !nav) return;

        nav.classList.toggle('is-open', open);

        if (header) {
            header.classList.toggle('menu-open', open);
        }

        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (navToggle && nav) {

        navToggle.addEventListener('click', function () {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            setMenu(!isOpen);
        });

        // Close the menu after clicking a navigation link
        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                setMenu(false);
            }
        });

        // Close the menu when clicking outside it
        document.addEventListener('click', function (event) {
            const isOpen = nav.classList.contains('is-open');

            if (
                isOpen &&
                !nav.contains(event.target) &&
                !navToggle.contains(event.target)
            ) {
                setMenu(false);
            }
        });

        // Escape key closes the menu
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                setMenu(false);
                navToggle.focus();
            }
        });

        // Reset navigation when switching to desktop layout
        const onBreakpointChange = function (event) {
            if (event.matches) {
                setMenu(false);
            }
        };

        if (desktopQuery.addEventListener) {
            desktopQuery.addEventListener('change', onBreakpointChange);
        } else {
            desktopQuery.addListener(onBreakpointChange);
        }
    }


    // Smooth scrolling and active navigation links
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

        try {
            history.replaceState(null, '', hash);
        } catch (error) {
            // Some preview environments restrict history updates
        }

        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    });


    // Highlight the navigation link for the visible section
    const navLinks = $$('.nav-link');

    const watchedSections = navLinks
        .map(link => $(link.getAttribute('href')))
        .filter(Boolean);

    if ('IntersectionObserver' in window && watchedSections.length) {

        const navObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                navLinks.forEach(function (link) {
                    const isActive = link.getAttribute('href') === '#' + entry.target.id;

                    link.classList.toggle('is-active', isActive);

                    if (isActive) {
                        link.setAttribute('aria-current', 'true');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            });

        }, {
            rootMargin: '-45% 0px -50% 0px'
        });

        watchedSections.forEach(section => navObserver.observe(section));
    }


    // Reveal elements when they enter the screen
    const revealItems = $$('[data-reveal]');

    if (
        revealItems.length &&
        !prefersReducedMotion() &&
        'IntersectionObserver' in window
    ) {

        // Add a small delay between items in the same group
        $$('[data-stagger]').forEach(function (group) {
            const cycle = parseInt(group.getAttribute('data-stagger'), 10) || 4;

            $$(':scope > [data-reveal]', group).forEach(function (item, index) {
                item.style.setProperty(
                    '--reveal-delay',
                    (index % cycle) * 80 + 'ms'
                );
            });
        });

        revealItems.forEach(item => item.classList.add('reveal'));

        const revealObserver = new IntersectionObserver(function (entries, observer) {

            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const element = entry.target;

                element.classList.add('is-visible');
                observer.unobserve(element);

                const delay = parseInt(
                    getComputedStyle(element).getPropertyValue('--reveal-delay'),
                    10
                ) || 0;

                setTimeout(function () {
                    element.classList.remove('reveal', 'is-visible');
                    element.style.removeProperty('--reveal-delay');
                }, 900 + delay);
            });

        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -6% 0px'
        });

        revealItems.forEach(item => revealObserver.observe(item));
    }


    // Pointer-following glow effect on cards
    if (
        window.matchMedia('(hover: hover)').matches &&
        !prefersReducedMotion()
    ) {

        let spotlightFrame = null;

        document.addEventListener('pointermove', function (event) {
            const card = event.target.closest
                ? event.target.closest('.card')
                : null;

            if (!card || spotlightFrame) return;

            const x = event.clientX;
            const y = event.clientY;

            spotlightFrame = requestAnimationFrame(function () {
                const rect = card.getBoundingClientRect();

                card.style.setProperty('--mx', (x - rect.left) + 'px');
                card.style.setProperty('--my', (y - rect.top) + 'px');

                spotlightFrame = null;
            });

        }, { passive: true });
    }


    // Toast messages for unfinished links
    const toast = $('#toast');

    let toastTimer = null;

    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('is-visible');

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove('is-visible');
        }, 2800);
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('[data-placeholder]');

        if (!link) return;

        event.preventDefault();

        showToast('This link is not ready yet. Please update its URL.');
    });


    // Contact form validation and message submission
    const form = $('#contactForm');

    if (form) {

        const statusEl = $('#formStatus');
        const counterEl = $('#msgCount');
        const counterWrap = counterEl ? counterEl.parentElement : null;
        const submitBtn = $('#submitBtn');

        const LIMITS = {
            nameMin: 2,
            nameMax: 80,
            emailMax: 254,
            messageMin: 10,
            messageMax: 1000
        };

        // Clean up user input before validation
        function cleanSingleLine(value) {
            return value
                .replace(/[\u0000-\u001F\u007F]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function cleanMultiLine(value) {
            return value
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
                .replace(/\r\n?/g, '\n')
                .trim();
        }


        // Check each form field
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
                    return 'Please enter a valid email address.';
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


        // Show validation messages below the inputs
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
            const error = validators[field.key](field.input.value);

            setFieldState(field, error);

            return error;
        }


        function resetFieldStates() {
            fields.forEach(function (field) {
                field.touched = false;

                field.error.textContent = '';
                field.input.removeAttribute('aria-invalid');

                field.input.closest('.field').classList.remove(
                    'has-error',
                    'is-valid'
                );
            });
        }


        // Update the form status
        function setStatus(type, message) {
            statusEl.className = 'form-status' + (type ? ' is-' + type : '');
            statusEl.textContent = message;
        }


        // Update the message character count
        function updateCounter() {
            const length = fields[2].input.value.length;

            counterEl.textContent = length;

            if (counterWrap) {
                counterWrap.classList.toggle(
                    'is-near-limit',
                    length >= LIMITS.messageMax - 50
                );
            }
        }


        // Validate fields when the user leaves them
        fields.forEach(function (field) {

            field.input.addEventListener('blur', function () {
                field.touched = true;
                validateField(field);
            });

            field.input.addEventListener('input', function () {
                if (field.key === 'message') {
                    updateCounter();
                }

                if (field.touched) {
                    validateField(field);
                }
            });

        });


        // Save the message in Supabase
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


        // Handle form submission
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            setStatus('', '');

            let firstInvalid = null;

            fields.forEach(function (field) {
                field.touched = true;

                const error = validateField(field);

                if (error && !firstInvalid) {
                    firstInvalid = field.input;
                }
            });

            if (firstInvalid) {
                setStatus('error', 'Please check the highlighted fields and try again.');

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
                    setStatus('success', 'Your message has been sent. Thank you!');

                    form.reset();

                    resetFieldStates();
                    updateCounter();
                })

                .catch(function (error) {
                    console.error('Message submission failed:', error);

                    setStatus(
                        'error',
                        'Unable to send your message right now. Please try again later.'
                    );
                })

                .then(function () {
                    submitBtn.disabled = false;
                });

        });

        updateCounter();
    }


    // Skill progress bars
    $$('.skill-card').forEach(function (card) {
        const bar = $('.prof-bar', card);
        const fill = bar && $('span[data-level]', bar);

        if (!fill) return;

        const level = Math.max(
            0,
            Math.min(100, parseInt(fill.dataset.level, 10) || 0)
        );

        const value = $('.prof-val', card);

        if (value) {
            value.textContent = level + '%';
        }

        bar.setAttribute('aria-valuenow', level);
    });


    // Animate progress bars when they become visible
    const bars = $$('.prof-bar span[data-level]');

    if ('IntersectionObserver' in window) {

        const barObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const bar = entry.target;

                bar.style.width = bar.dataset.level + '%';

                barObserver.unobserve(bar);
            });

        }, {
            threshold: 0.4
        });

        bars.forEach(bar => barObserver.observe(bar));

    } else {

        bars.forEach(function (bar) {
            bar.style.width = bar.dataset.level + '%';
        });

    }

})();