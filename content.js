// content.js — Cursor, navbar, typewriter, counters, scroll reveal, tilt

document.addEventListener('DOMContentLoaded', function () {

    // ── CUSTOM CURSOR ──────────────────────────────────────
    const cursor     = document.getElementById('cursor');
    const cursorGlow = document.getElementById('cursorGlow');
    let cx = 0, cy = 0, gx = 0, gy = 0;

    document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });

    (function moveCursor() {
        cursor.style.left = cx + 'px';
        cursor.style.top  = cy + 'px';
        gx += (cx - gx) * 0.14;
        gy += (cy - gy) * 0.14;
        cursorGlow.style.left = gx + 'px';
        cursorGlow.style.top  = gy + 'px';
        requestAnimationFrame(moveCursor);
    })();

    document.querySelectorAll('a, button, .skill-tag, .project-card, .contact-item, .btn-primary, .btn-ghost').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('hover');    cursorGlow.classList.add('hover');    });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorGlow.classList.remove('hover'); });
    });

    // ── NAVBAR SCROLL ──────────────────────────────────────
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    // ── TYPEWRITER ─────────────────────────────────────────
    const phrases = [
        'Backend Engineer',
        'Ruby on Rails Dev',
        'Microservices Architect',
        'API Performance Builder',
        'Distributed Systems Nerd',
    ];
    let pIdx = 0, cIdx = 0, deleting = false;
    const tw = document.getElementById('typewriter-text');

    function type() {
        const cur = phrases[pIdx];
        if (!deleting) {
            tw.textContent = cur.slice(0, ++cIdx);
            if (cIdx === cur.length) { deleting = true; setTimeout(type, 2200); return; }
            setTimeout(type, 65);
        } else {
            tw.textContent = cur.slice(0, --cIdx);
            if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; setTimeout(type, 400); return; }
            setTimeout(type, 30);
        }
    }
    setTimeout(type, 1500);

    // ── COUNTERS ───────────────────────────────────────────
    function animateCount(el) {
        const target = parseInt(el.dataset.to, 10);
        const start  = performance.now();
        const dur    = 1800;
        function step(now) {
            const p   = Math.min((now - start) / dur, 1);
            const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
            el.textContent = val;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    setTimeout(() => {
        document.querySelectorAll('.count').forEach(animateCount);
    }, 1500);

    // ── SCROLL REVEAL ──────────────────────────────────────
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // ── SMOOTH ANCHOR SCROLL ───────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const t = document.querySelector(a.getAttribute('href'));
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // ── ACTIVE NAV HIGHLIGHT ───────────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                navLinks.forEach(a => {
                    a.style.color = a.getAttribute('href') === '#' + e.target.id
                        ? 'var(--green)' : '';
                });
            }
        });
    }, { threshold: 0.4 }).observe(
        // observe all sections
        ...(() => { sections.forEach(s => {}); return []; })()
    );

    // simpler active section tracking via scroll
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 120) current = s.id;
        });
        navLinks.forEach(a => {
            a.style.color = a.getAttribute('href') === '#' + current ? 'var(--green)' : '';
        });
    }, { passive: true });

    // ── 3-D CARD TILT ──────────────────────────────────────
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            card.style.transform = `translateY(-3px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    // ── SKILL TAG STAGGER ──────────────────────────────────
    document.querySelectorAll('.skill-group').forEach(group => {
        new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                e.target.querySelectorAll('.skill-tag').forEach((tag, i) => {
                    tag.style.opacity   = '0';
                    tag.style.transform = 'translateY(8px)';
                    tag.style.transition = `opacity 0.4s ease ${i * 0.055}s, transform 0.4s ease ${i * 0.055}s`;
                    requestAnimationFrame(() => {
                        tag.style.opacity   = '1';
                        tag.style.transform = 'translateY(0)';
                    });
                });
            });
        }, { threshold: 0.2 }).observe(group);
    });

    // ── TERMINAL BOOT SEQUENCE (hero cmd) ──────────────────
    const cmd = document.querySelector('.t-cmd');
    if (cmd) {
        const text = 'ruby engineer.rb';
        cmd.textContent = '';
        let idx = 0;
        setTimeout(function typeCmd() {
            cmd.textContent += text[idx++];
            if (idx < text.length) setTimeout(typeCmd, 65);
        }, 500);
    }

});
