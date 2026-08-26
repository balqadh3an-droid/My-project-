import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
        gsap.to(el, {
          opacity: key === name ? 1 : 0,
          duration: 1.1,
          ease: 'power2.inOut',
          overwrite: 'auto'
        });
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

      // Ken Burns: the frame keeps pushing in across its own act, so the
      // image is never sitting perfectly still while you read over it.
      const img = slides[slide]?.querySelector('img');
      if (img) {
        gsap.fromTo(img,
          { scale: 1.06 },
          {
            scale: 1.16, ease: 'none',
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

      // Generic reveal-up sections -- a light 3D perspective flip, not just a fade
      document.querySelectorAll('.reveal-up').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 34, rotationX: -8, transformPerspective: 1000, transformOrigin: '50% 100%' },
          {
            opacity: 1, y: 0, rotationX: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // Timeline panels rise in sequence
      gsap.utils.toArray('.timeline-item').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // Credential cards stagger -- 3D tumble-in
      gsap.fromTo('.tilt-card',
        { opacity: 0, y: 30, rotationX: -22, rotationY: 10, transformPerspective: 800 },
        {
          opacity: 1, y: 0, rotationX: 0, rotationY: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: '#credentialGrid', start: 'top 85%', toggleActions: 'play none none reverse' }
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

  /* ================= THREE.JS: floating character =================
     The photography is the backdrop now, so the WebGL layer carries only
     the small corner robot -- no competing geometry behind the copy. */
  if (!hasWebGL) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initCharacterScene() {
    const canvas = document.getElementById('webglCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xff6a1a, 2.2, 24);
    rimLight.position.set(-3, 1.5, 3);
    scene.add(rimLight);

    const charPivot = new THREE.Group();
    scene.add(charPivot);
    charPivot.scale.setScalar(0.001);

    let mixer = null;
    const actions = {};
    let activeAction = null;
    let headBone = null;
    let neckBone = null;
    let robotReady = false;
    let robotModel = null;

    function playAction(name, { once = false, next = null } = {}) {
      const action = actions[name];
      if (!action || !mixer) return;
      action.reset();
      action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
      action.clampWhenFinished = once;
      action.fadeIn(0.35);
      action.play();
      if (activeAction && activeAction !== action) activeAction.fadeOut(0.35);
      activeAction = action;
      if (once && next) {
        const onFinished = (e) => {
          if (e.action !== action) return;
          mixer.removeEventListener('finished', onFinished);
          playAction(next);
        };
        mixer.addEventListener('finished', onFinished);
      }
    }

    new GLTFLoader().load(
      'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
      (gltf) => {
        const model = gltf.scene;
        model.position.y = -1.05;
        charPivot.add(model);
        robotModel = model;
        resize();

        headBone = model.getObjectByName('Head') || null;
        neckBone = model.getObjectByName('Neck') || null;

        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => { actions[clip.name] = mixer.clipAction(clip); });
        robotReady = true;

        if (prefersReduced) {
          charPivot.scale.setScalar(1);
          if (actions.Idle) { actions.Idle.play(); mixer.update(0); }
          renderer.render(scene, camera);
          return;
        }

        playAction('Wave', { once: true, next: 'Idle' });
        gsap?.to?.(charPivot.scale, { x: 1, y: 1, z: 1, duration: 1, ease: 'back.out(1.6)', delay: 0.2 });

        document.querySelector('.btn-primary')?.addEventListener('mouseenter', () => {
          if (robotReady) playAction('ThumbsUp', { once: true, next: 'Idle' });
        });
        document.querySelector('.btn-ghost')?.addEventListener('mouseenter', () => {
          if (robotReady) playAction('Yes', { once: true, next: 'Idle' });
        });
      },
      undefined,
      () => { /* Model blocked/offline -- the photographic backdrop still carries the page. */ }
    );

    let w = 0, h = 0;
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      renderer.setSize(w, h, false);
      const narrow = w < 780;
      camera.fov = narrow ? 62 : 50;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Pin the robot to a screen corner so it never crowds the copy or
      // the glass panels sitting over the photography.
      charPivot.position.x = narrow ? 1.72 : 5.5;
      charPivot.position.y = narrow ? -3.05 : 2.9;
      charPivot.userData.baseY = charPivot.position.y;
      if (robotModel) robotModel.scale.setScalar(narrow ? 0.14 : 0.2);
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

    if (prefersReduced) {
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

      if (mixer) mixer.update(delta);

      // Head/neck aim toward the cursor, layered over whatever clip is playing
      if (headBone) {
        headBone.rotation.y += mouseX * 0.55;
        headBone.rotation.x += -mouseY * 0.3;
      }
      if (neckBone) {
        neckBone.rotation.y += mouseX * 0.2;
      }

      const baseY = charPivot.userData.baseY ?? charPivot.position.y;
      charPivot.position.y = baseY + Math.sin(t * 0.9) * 0.06;

      renderer.render(scene, camera);
    }
    animate();
  }

  initCharacterScene();
})();
