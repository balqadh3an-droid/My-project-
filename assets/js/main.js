import * as THREE from 'three';

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  /* ---------- Smooth scroll (Lenis) synced with GSAP/ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  if (window.Lenis && window.gsap && window.ScrollTrigger && !prefersReduced) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Nav ---------- */
  const nav = document.getElementById('nav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navLinks.style.display = open ? 'none' : 'flex';
    if (!open) {
      navLinks.style.cssText = 'display:flex;position:fixed;top:var(--nav-h);left:0;right:0;flex-direction:column;background:rgba(5,7,10,.96);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:24px;gap:20px;border-bottom:1px solid var(--color-border);';
      navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.removeAttribute('style');
      }, { once: true }));
    } else {
      navLinks.removeAttribute('style');
    }
  });

  /* ---------- Live clock (Asia/Riyadh) ---------- */
  const clocks = [document.getElementById('localClock'), document.getElementById('localClock2')].filter(Boolean);
  function tickClock() {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date());
    clocks.forEach(el => { el.textContent = time; });
  }
  tickClock();
  setInterval(tickClock, 1000);

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Count-up stats ---------- */
  const statEls = document.querySelectorAll('.stat-num');
  function formatCount(value, decimals) {
    // Thousands separators read naturally on integer counts (1,400) but would
    // be noise on a decimal one (4.42), so only apply them when decimals=0.
    return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
  }
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced || !window.gsap) {
      el.textContent = formatCount(target, decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = formatCount(obj.v, decimals) + suffix; }
    });
  }

  /* ================= CINEMATIC BACKDROP ENGINE =================
     Five full-viewport photographs are stacked in a fixed layer behind
     everything. Exactly one is visible at a time; as each act's section
     passes the middle of the screen the stack cross-fades to that act's
     frame, and the live frame slowly pushes in (Ken Burns) for the whole
     time it holds. Opacity is driven by discrete enter/leave callbacks
     rather than a scrub so the fades never fight each other mid-flight. */
  function initBackdrop() {
    const slides = {};
    document.querySelectorAll('.backdrop-slide').forEach((el) => {
      slides[el.dataset.slide] = el;
    });
    if (!Object.keys(slides).length) return;

    // Which section owns which frame. Ranges are contiguous, so every
    // scroll position has exactly one owner.
    const acts = [
      { slide: 'hero',       from: '#hero',       to: '#hero' },
      { slide: 'about',      from: '#about',      to: '#credentials' },
      { slide: 'experience', from: '#experience', to: '#experience' },
      { slide: 'projects',   from: '#projects',   to: '#projects' },
      { slide: 'skills',     from: '#skills',     to: '#contact' }
    ];

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      // No motion: just show the opening frame as a static backdrop.
      if (slides.hero) slides.hero.style.opacity = '1';
      return;
    }

    let current = null;
    function show(name) {
      if (current === name) return;
      current = name;
      Object.entries(slides).forEach(([key, el]) => {
        const active = key === name;
        gsap.to(el, {
          opacity: active ? 1 : 0,
          duration: 1.2,
          ease: 'power2.inOut',
          overwrite: 'auto'
        });
        // The incoming frame settles out of a slight push-in, so each act
        // lands with a camera-like snap instead of a flat dissolve. This
        // rides the slide wrapper; the Ken Burns below rides the <img>,
        // so the two never write to the same transform.
        if (active) {
          gsap.fromTo(el,
            { scale: 1.05 },
            { scale: 1, duration: 1.6, ease: 'power3.out', overwrite: 'auto' }
          );
        }
      });
    }

    acts.forEach(({ slide, from, to }) => {
      const fromEl = document.querySelector(from);
      const toEl = document.querySelector(to);
      if (!fromEl || !toEl) return;

      ScrollTrigger.create({
        trigger: fromEl,
        start: 'top 60%',
        endTrigger: toEl,
        end: 'bottom 40%',
        onEnter: () => show(slide),
        onEnterBack: () => show(slide)
      });

      // Ken Burns: the frame keeps pushing in and drifting across its own
      // act, so the image is never sitting perfectly still while you read.
      const img = slides[slide]?.querySelector('img');
      if (img) {
        gsap.fromTo(img,
          { scale: 1.04, yPercent: -1.5 },
          {
            scale: 1.24, yPercent: 1.5, ease: 'none',
            scrollTrigger: {
              trigger: fromEl, start: 'top bottom',
              endTrigger: toEl, end: 'bottom top', scrub: 1
            }
          }
        );
      }
    });

    show('hero');
  }
  initBackdrop();

  /* ---------- GSAP scroll reveals ---------- */
  if (window.gsap && window.ScrollTrigger) {
    if (prefersReduced) {
      document.querySelectorAll('.reveal, .reveal-up, .tilt-card').forEach(el => el.style.opacity = 1);
      statEls.forEach(animateCount);
    } else {
      // Hero entrance
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero-eyebrow', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 })
        .from('.hero-title .line', { yPercent: 110, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .fromTo('.hero-role', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo('.hero-quote', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo('.hero-actions', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .fromTo('.hero-stats', { opacity: 0, y: 12 }, {
          opacity: 1, y: 0, duration: 0.6,
          onStart: () => statEls.forEach(animateCount)
        }, '-=0.2');

      // Hero copy lifts and dissolves as you leave the opening frame
      gsap.to('.hero-content', {
        opacity: 0, y: -60, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'center center', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to('.hero-stats', {
        opacity: 0, y: -30, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'center center', end: 'bottom top', scrub: 0.6 }
      });

      /* --- Section headings: the kicker tightens in, then the headline
             wipes up out of its own baseline like a title card. --- */
      gsap.utils.toArray('.section-head').forEach((head) => {
        const kicker = head.querySelector('.kicker');
        const h2 = head.querySelector('h2');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: head, start: 'top 86%', toggleActions: 'play none none reverse' }
        });
        if (kicker) {
          tl.fromTo(kicker,
            { opacity: 0, y: 18, letterSpacing: '0.5em' },
            { opacity: 1, y: 0, letterSpacing: '0.16em', duration: 0.8, ease: 'power3.out' }
          );
        }
        if (h2) {
          tl.fromTo(h2,
            { opacity: 0, yPercent: 22, clipPath: 'inset(0% 0% 100% 0%)' },
            { opacity: 1, yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power4.out' },
            '-=0.5'
          );
        }
      });

      /* --- Generic blocks: rise with a focus-pull, so copy resolves out of
             the photograph rather than just appearing on top of it. --- */
      document.querySelectorAll('.reveal-up:not(.section-head)').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 48, filter: 'blur(10px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
      });

      /* --- Timeline: each role sweeps in from the left, its veil and
             bullets resolving a beat behind the heading. --- */
      gsap.utils.toArray('.timeline-item').forEach((el) => {
        const body = el.querySelector('.timeline-body');
        const bullets = el.querySelectorAll('li');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' }
        });
        tl.fromTo(el,
          { opacity: 0, x: -48, filter: 'blur(8px)' },
          { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }
        );
        if (bullets.length) {
          tl.fromTo(bullets,
            { opacity: 0, x: -14 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
            '-=0.6'
          );
        }
        if (body) {
          tl.fromTo(body,
            { scale: 0.985 },
            { scale: 1, duration: 1.0, ease: 'power3.out' },
            0
          );
        }
      });

      // Credential cards stagger -- 3D tumble-in from depth
      gsap.fromTo('.tilt-card',
        { opacity: 0, y: 60, z: -180, rotationX: -28, rotationY: 12, transformPerspective: 900 },
        {
          opacity: 1, y: 0, z: 0, rotationX: 0, rotationY: 0,
          duration: 1.0, stagger: 0.09, ease: 'power4.out',
          scrollTrigger: { trigger: '#credentialGrid', start: 'top 85%', toggleActions: 'play none none reverse' }
        }
      );

      // Skill pills pop in per group as each group arrives
      gsap.utils.toArray('.skill-group').forEach((group) => {
        gsap.fromTo(group.querySelectorAll('.pill-list li'),
          { opacity: 0, y: 16, scale: 0.9 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.028, ease: 'back.out(1.7)',
            scrollTrigger: { trigger: group, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // Tech pills on the project card
      gsap.fromTo('.tech-pills li',
        { opacity: 0, y: 16, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.tech-pills', start: 'top 90%', toggleActions: 'play none none reverse' }
        }
      );
    }
  } else {
    document.querySelectorAll('.reveal, .reveal-up, .tilt-card').forEach(el => el.style.opacity = 1);
    statEls.forEach(animateCount);
  }

  /* ---------- Active nav-link highlighting on scroll ---------- */
  if (window.gsap && window.ScrollTrigger) {
    const navAnchors = [...document.querySelectorAll('[data-nav-link]')];
    const navSections = navAnchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const setActiveNav = (idx) => navAnchors.forEach((a, i) => a.classList.toggle('is-active', i === idx));
    navSections.forEach((sec, i) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onEnter: () => setActiveNav(i), onEnterBack: () => setActiveNav(i)
      });
    });
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom 55%',
      onEnter: () => setActiveNav(-1), onEnterBack: () => setActiveNav(-1)
    });
  }

  /* ---------- Tilt cards (pointer-based 3D tilt) ---------- */
  const canHover = !prefersReduced && window.matchMedia('(hover: hover)').matches;
  if (canHover) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      const inner = card.querySelector('.tilt-card-inner');
      let raf = null;
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          inner.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(6px)`;
        });
      });
      card.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        inner.style.transform = 'rotateY(0) rotateX(0) translateZ(0)';
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (canHover && window.gsap) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const moveX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const moveY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        moveX((e.clientX - rect.left - rect.width / 2) * 0.35);
        moveY((e.clientY - rect.top - rect.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { moveX(0); moveY(0); });
    });
  }

  /* ---------- Custom cursor accent ---------- */
  if (canHover && window.gsap) {
    const dot = document.querySelector('.cursor-dot');
    if (dot) {
      gsap.set(dot, { xPercent: -50, yPercent: -50 });
      const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3.out' });
      const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3.out' });
      window.addEventListener('pointermove', (e) => {
        moveDotX(e.clientX);
        moveDotY(e.clientY);
        dot.classList.add('is-visible');
      }, { passive: true });
      document.addEventListener('pointerleave', () => dot.classList.remove('is-visible'));
      document.querySelectorAll('a, button, .tilt-card').forEach((el) => {
        el.addEventListener('mouseenter', () => dot.classList.add('is-active'));
        el.addEventListener('mouseleave', () => dot.classList.remove('is-active'));
      });
    }
  }


  /* ================= THREE.JS: THE CURRENT =================
     An abstract light rig in place of any character: a handful of long
     graceful filaments hanging in 3D space, with packets of light running
     along them like current through a line. It reads as energy moving
     through a grid, which is the subject of the whole site, and it never
     competes with the photography the way a literal figure did.

     The whole rig flies to a new station for each act, so scrolling
     carries it across the frame rather than parking it in a corner. */
  if (!hasWebGL) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initCurrentScene() {
    const canvas = document.getElementById('webglCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const rig = new THREE.Group();
    scene.add(rig);

    /* ---- A soft round sprite, so every light packet is a glow rather
       than a hard square pixel. ---- */
    function makeGlowTexture() {
      const size = 64;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0.00, 'rgba(255,255,255,1)');
      g.addColorStop(0.22, 'rgba(255,205,150,0.9)');
      g.addColorStop(0.5, 'rgba(255,120,40,0.32)');
      g.addColorStop(1.00, 'rgba(255,106,26,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }
    const glowTex = makeGlowTexture();

    /* ---- Filaments: long, slack catenary-ish sweeps across the frame. ---- */
    const CURVES = 5;
    const SAMPLES = 220;          // dense polyline per curve, sampled once
    const TRAVELLERS = 7;         // light packets per curve
    const TAIL = 5;               // dots making up each packet's tail

    const paths = [];
    for (let i = 0; i < CURVES; i++) {
      const seed = i * 1.9 + 0.4;
      const pts = [];
      const n = 7;
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1);
        pts.push(new THREE.Vector3(
          -9 + t * 18 + Math.sin(seed + t * 2.6) * 1.4,
          Math.sin(seed * 1.6 + t * Math.PI * 1.5) * 2.4 + (i - 2) * 0.85,
          Math.cos(seed * 1.15 + t * Math.PI * 1.1) * 3.2 - 1.2
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
      // Sample once into a flat array; travellers then just index into it,
      // which keeps the per-frame cost to simple lerps.
      const sampled = curve.getPoints(SAMPLES - 1);
      paths.push(sampled);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(sampled);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xff6a1a, transparent: true, opacity: 0.13,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      rig.add(new THREE.Line(lineGeo, lineMat));
    }

    /* ---- Light packets running the filaments ---- */
    const DOTS = CURVES * TRAVELLERS * TAIL;
    const dotGeo = new THREE.BufferGeometry();
    const dotPos = new Float32Array(DOTS * 3);
    const dotCol = new Float32Array(DOTS * 3);
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(dotCol, 3));

    // Per-traveller state: which path, where along it, how fast.
    const travellers = [];
    for (let c = 0; c < CURVES; c++) {
      for (let j = 0; j < TRAVELLERS; j++) {
        travellers.push({
          path: c,
          t: Math.random(),
          speed: 0.035 + Math.random() * 0.055
        });
      }
    }

    // Tail dots fade from a hot white head to the brand orange.
    const headCol = new THREE.Color(0xfff1e2);
    const tailCol = new THREE.Color(0xff5a0a);
    travellers.forEach((_, ti) => {
      for (let d = 0; d < TAIL; d++) {
        const f = d / (TAIL - 1);
        const col = headCol.clone().lerp(tailCol, f).multiplyScalar(1 - f * 0.72);
        const idx = (ti * TAIL + d) * 3;
        dotCol[idx] = col.r; dotCol[idx + 1] = col.g; dotCol[idx + 2] = col.b;
      }
    });
    dotGeo.attributes.color.needsUpdate = true;

    const dotMat = new THREE.PointsMaterial({
      size: 0.34, map: glowTex, vertexColors: true,
      transparent: true, opacity: 0.95, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    rig.add(new THREE.Points(dotGeo, dotMat));

    // Sample a path at normalised t with a lerp between stored points.
    const tmp = new THREE.Vector3();
    function samplePath(pathIdx, t) {
      const pts = paths[pathIdx];
      const last = pts.length - 1;
      const f = ((t % 1) + 1) % 1 * last;
      const i0 = Math.floor(f);
      const i1 = Math.min(i0 + 1, last);
      return tmp.copy(pts[i0]).lerp(pts[i1], f - i0);
    }

    /* ---- Where the rig flies for each act ----
       GSAP tweens these targets; the render loop eases the rig toward them
       and layers the mouse parallax on top, so the two never fight. */
    const target = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, glow: 1 };
    const stations = {
      hero:       { x:  1.6, y:  0.4, z:  0.0, rx: -0.12, ry:  0.22, rz:  0.06, glow: 1.0 },
      about:      { x: -2.4, y: -0.6, z: -1.4, rx:  0.16, ry: -0.34, rz: -0.10, glow: 0.85 },
      experience: { x:  2.6, y:  1.0, z: -0.6, rx: -0.22, ry:  0.46, rz:  0.12, glow: 0.75 },
      projects:   { x: -1.2, y:  0.2, z:  1.8, rx:  0.10, ry: -0.16, rz: -0.05, glow: 1.15 },
      skills:     { x:  0.0, y: -1.2, z: -2.2, rx:  0.30, ry:  0.10, rz:  0.03, glow: 0.9 }
    };

    if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      const acts = [
        ['hero', '#hero', '#hero'],
        ['about', '#about', '#credentials'],
        ['experience', '#experience', '#experience'],
        ['projects', '#projects', '#projects'],
        ['skills', '#skills', '#contact']
      ];
      acts.forEach(([name, from, to]) => {
        const fromEl = document.querySelector(from);
        const toEl = document.querySelector(to);
        if (!fromEl || !toEl) return;
        const fly = () => gsap.to(target, {
          ...stations[name], duration: 2.2, ease: 'power2.inOut', overwrite: 'auto'
        });
        ScrollTrigger.create({
          trigger: fromEl, start: 'top 60%',
          endTrigger: toEl, end: 'bottom 40%',
          onEnter: fly, onEnterBack: fly
        });
      });
      Object.assign(target, stations.hero);
    } else {
      Object.assign(target, stations.hero);
    }

    let w = 0, h = 0;
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      renderer.setSize(w, h, false);
      const narrow = w < 780;
      camera.fov = narrow ? 64 : 50;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Pull the whole rig back and shrink it on phones so the filaments
      // read as depth behind the copy rather than clutter across it.
      rig.scale.setScalar(narrow ? 0.72 : 1);
      dotMat.size = narrow ? 0.26 : 0.34;
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });

    const clock = new THREE.Clock();

    function writeDots(t) {
      travellers.forEach((tr, ti) => {
        for (let d = 0; d < TAIL; d++) {
          // Tail dots sit a little way back along the same filament.
          const p = samplePath(tr.path, tr.t - d * 0.006);
          const idx = (ti * TAIL + d) * 3;
          dotPos[idx] = p.x; dotPos[idx + 1] = p.y; dotPos[idx + 2] = p.z;
        }
      });
      dotGeo.attributes.position.needsUpdate = true;
    }

    if (prefersReduced) {
      // Hold a single still frame -- no travel, no drift.
      writeDots(0);
      rig.position.set(target.x, target.y, target.z);
      rig.rotation.set(target.rx, target.ry, target.rz);
      renderer.render(scene, camera);
      return;
    }

    let elapsed = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      const t = elapsed;

      // Current keeps running along every filament.
      travellers.forEach((tr) => { tr.t = (tr.t + tr.speed * delta) % 1; });
      writeDots(t);

      // Ease toward the act's station, with mouse parallax layered on.
      const px = mouseX * 0.9, py = -mouseY * 0.7;
      rig.position.x += ((target.x + px) - rig.position.x) * 0.045;
      rig.position.y += ((target.y + py) - rig.position.y) * 0.045;
      rig.position.z += (target.z - rig.position.z) * 0.045;
      rig.rotation.x += ((target.rx + mouseY * 0.12) - rig.rotation.x) * 0.045;
      rig.rotation.y += ((target.ry + mouseX * 0.18 + Math.sin(t * 0.09) * 0.06) - rig.rotation.y) * 0.045;
      rig.rotation.z += (target.rz - rig.rotation.z) * 0.045;

      // Packets pulse gently, and brighten on the acts that ask for it.
      dotMat.opacity = target.glow * (0.82 + Math.sin(t * 1.5) * 0.12);

      renderer.render(scene, camera);
    }
    animate();
  }

  initCurrentScene();
})();
