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
  }
  if (window.Lenis && window.gsap && window.ScrollTrigger && !prefersReduced) {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true
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
      navLinks.style.cssText = 'display:flex;position:fixed;top:var(--nav-h);left:0;right:0;flex-direction:column;background:rgba(10,13,18,.97);padding:24px;gap:20px;border-bottom:1px solid var(--color-border);';
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
    if (prefersReduced) {
      el.textContent = formatCount(target, decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = formatCount(obj.v, decimals) + suffix; }
    });
  }

  /* ---------- GSAP scroll reveals ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

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

      // Generic reveal-up sections -- a light 3D perspective flip, not just a fade
      document.querySelectorAll('.reveal-up').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 28, rotationX: -10, transformPerspective: 900, transformOrigin: '50% 100%' },
          {
            opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // Timeline items stagger from left
      gsap.utils.toArray('.timeline-item').forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, x: -20 }, {
          opacity: 1, x: 0, duration: 0.6, delay: i * 0.05, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });

      // Cinematic image dividers -- a slow parallax drift on the image itself
      // as its section scrolls through, independent of the WebGL scene.
      gsap.utils.toArray('.divider-media img').forEach((img) => {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: img.closest('.divider'), start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      // Credential cards stagger -- 3D tumble-in
      gsap.fromTo('.tilt-card',
        { opacity: 0, y: 30, rotationX: -25, rotationY: 12, transformPerspective: 800 },
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

  /* ================= THREE.JS SCENES ================= */
  if (!hasWebGL) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---- Hero scene: a glass-obsidian torus knot backdrop + a small corner robot ---- */
  function initHeroScene() {
    const canvas = document.getElementById('webglCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // Cinematic two-tone lighting rig: a cyan key for highlight pop against
    // a dark obsidian fill, with the site's orange kept as the rim accent
    // so the brand colour still reads even though the key light is cyan.
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    scene.add(ambientLight);
    const keyLight = new THREE.PointLight(0x00f0ff, 4.5, 40);
    keyLight.position.set(6, 6, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xff5500, 3.0);
    rimLight.position.set(-8, -4, -5);
    scene.add(rimLight);

    /* ---- The core visual: a single sleek glass-obsidian torus knot --
       one mesh, no separate rings/starfield/particle layers, per the
       surgical-swap directive. ---- */
    const group = new THREE.Group();
    scene.add(group);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.8, 0.55, 180, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x070b14, transmission: 0.95, opacity: 1.0, transparent: true,
        roughness: 0.03, metalness: 0.05, ior: 1.52, thickness: 2.8,
        clearcoat: 1.0, clearcoatRoughness: 0.02,
        emissive: 0x0a1420, emissiveIntensity: 0.5
      })
    );
    group.add(knot);

    // Ambient spark field: a shell of cyan points drifting slowly around
    // the knot, each independently on its own slow orbit.
    const sparkCount = 160;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const r = 2.6 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      sparkPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sparkPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sparkPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x00f0ff, size: 0.04, transparent: true, opacity: 0.5, sizeAttenuation: true
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    /* ---- Character: a small, corner-anchored rigged robot (RobotExpressive,
       a CC0 three.js sample asset) so it never competes with the name/stats
       for attention -- top-right on desktop, bottom-right on mobile. ---- */
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
        resize(); // apply the correct desktop/mobile scale + corner position now that the model exists

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

        // A little UI-reactive personality: the robot responds to the primary actions.
        document.querySelector('.btn-primary')?.addEventListener('mouseenter', () => {
          if (robotReady) playAction('ThumbsUp', { once: true, next: 'Idle' });
        });
        document.querySelector('.btn-ghost')?.addEventListener('mouseenter', () => {
          if (robotReady) playAction('Yes', { once: true, next: 'Idle' });
        });
      },
      undefined,
      () => { /* Model failed to load (offline/blocked) -- the knot backdrop still renders fine. */ }
    );

    let w = 0, h = 0;
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      renderer.setSize(w, h, false);
      const narrow = w < 780;
      // Widen the FOV on small screens so the knot doesn't feel cramped
      // or clipped in a narrow, tall viewport.
      camera.fov = narrow ? 62 : 50;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Keep the robot pinned to a screen corner: top-right on desktop
      // (copy is left-aligned there), bottom-right on mobile (copy is
      // centered full-width up top, so there's no side margin to use).
      charPivot.position.x = narrow ? 1.35 : 5.0;
      charPivot.position.y = narrow ? -2.6 : 2.6;
      charPivot.userData.baseY = charPivot.position.y;
      if (robotModel) robotModel.scale.setScalar(narrow ? 0.15 : 0.22);
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    // Scroll-driven "flythrough": on desktop, pin the hero for one extra
    // viewport of scroll while the camera flies toward the knot and a veil
    // fades to black, then release into About underneath -- the transition
    // does the work instead of just sitting there statically. Mobile and
    // reduced-motion skip the pin (heavy scroll-jacking reads badly on touch)
    // and get a plain, cheap recede-and-fade instead.
    // Scroll-driven additive offsets. These live on plain objects (not on
    // camera.position/group.rotation directly) wherever the render loop also
    // writes to that property every frame -- letting GSAP tween the offset
    // object avoids the tween and the per-frame mouse-parallax code fighting
    // over the same value.
    const scrollCam = { x: 0, y: 0 };
    const scrollTilt = { x: 0 };
    const scrollSpin = { mult: 1, extra: 0 };

    const isDesktop = window.matchMedia('(min-width: 780px)').matches;
    if (window.gsap && window.ScrollTrigger && !prefersReduced && isDesktop) {
      const veil = document.querySelector('.hero-veil');
      gsap.timeline({
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=100%', scrub: 0.7, pin: true }
      })
        .to('.hero-content', { opacity: 0, y: -40, duration: 0.3, ease: 'power1.in' }, 0)
        .to('.hero-stats', { opacity: 0, y: -20, duration: 0.26, ease: 'power1.in' }, 0)
        .to(camera.position, { z: 1.3, ease: 'power1.in', duration: 1 }, 0.05)
        .to(group.rotation, { y: '+=2.6', ease: 'power1.in', duration: 1 }, 0.05)
        .to(group.scale, { x: 2.6, y: 2.6, z: 2.6, ease: 'power1.in', duration: 1 }, 0.05)
        .to(veil, { opacity: 1, duration: 0.35, ease: 'power2.in' }, 0.6);
    } else if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      gsap.timeline({
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      })
        .to(camera.position, { z: 13, ease: 'none' }, 0)
        .to(group.scale, { x: 0.7, y: 0.7, z: 0.7, ease: 'none' }, 0);
    }

    // Acts 2-4: as later sections scroll through view, drift the camera,
    // lighting mood and rotation without pinning -- an ambient parallax
    // "flight" behind the content rather than a scroll-jacked hijack.
    if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      const heroEndZ = isDesktop ? 1.3 : 13;
      const heroEndScale = isDesktop ? 2.6 : 0.7;

      // Act 2 -- About + Credentials: emerge from the close Hero flythrough
      // back out to a calm establishing shot; the glass glow brightens.
      gsap.timeline({
        scrollTrigger: {
          trigger: '#about', start: 'top bottom', endTrigger: '#credentials', end: 'bottom top', scrub: 0.8
        }
      })
        .fromTo(camera.position, { z: heroEndZ }, { z: 8, ease: 'none' }, 0)
        .fromTo(group.scale, { x: heroEndScale, y: heroEndScale, z: heroEndScale }, { x: 1, y: 1, z: 1, ease: 'none' }, 0)
        .fromTo(knot.material, { emissiveIntensity: 0.5 }, { emissiveIntensity: 0.9, ease: 'none' }, 0)
        .fromTo(scrollCam, { x: 0, y: 0 }, { x: -0.6, y: 0.15, ease: 'none' }, 0);

      // Act 3 -- Experience: a sweeping lateral orbit and darker, harder-working tones.
      gsap.timeline({
        scrollTrigger: { trigger: '#experience', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      })
        .fromTo(scrollCam, { x: -0.6 }, { x: 1.4, ease: 'none' }, 0)
        .fromTo(scrollSpin, { extra: 0 }, { extra: 1.1, ease: 'none' }, 0)
        .fromTo(rimLight, { intensity: 3.0 }, { intensity: 1.5, ease: 'none' }, 0)
        .fromTo(ambientLight, { intensity: 1.2 }, { intensity: 0.7, ease: 'none' }, 0)
        .fromTo(camera.position, { z: 8 }, { z: 6.4, ease: 'none' }, 0);

      // Act 4 -- Skills: settle into a locked, top-down overview as the spin damps.
      gsap.timeline({
        scrollTrigger: { trigger: '#skills', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 }
      })
        .fromTo(scrollCam, { x: 1.4, y: 0.15 }, { x: 0, y: 0.9, ease: 'none' }, 0)
        .fromTo(scrollTilt, { x: 0 }, { x: 0.5, ease: 'none' }, 0)
        .fromTo(scrollSpin, { mult: 1 }, { mult: 0.2, ease: 'none' }, 0)
        .fromTo(rimLight, { intensity: 1.5 }, { intensity: 2.3, ease: 'none' }, 0)
        .fromTo(ambientLight, { intensity: 0.7 }, { intensity: 0.9, ease: 'none' }, 0)
        .fromTo(camera.position, { z: 6.4 }, { z: 9.5, ease: 'none' }, 0);
    }

    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });

    const clock = new THREE.Clock();

    function renderStatic() {
      group.rotation.set(0.3, 0.4, 0);
      renderer.render(scene, camera);
    }

    if (prefersReduced) {
      renderStatic();
      return;
    }

    let elapsed = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      const t = elapsed;

      group.rotation.y = t * 0.06 * scrollSpin.mult + mouseX * 0.6 + scrollSpin.extra;
      group.rotation.x = Math.sin(t * 0.15) * 0.08 + mouseY * 0.3 + scrollTilt.x;
      sparks.rotation.y = t * 0.015;
      sparks.rotation.x = Math.sin(t * 0.1) * 0.05;
      camera.position.x += (mouseX * 1.2 + scrollCam.x - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 1.2 + scrollCam.y - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      if (mixer) mixer.update(delta);

      // Head/neck aim toward the cursor, layered on top of whatever clip is playing
      if (headBone) {
        headBone.rotation.y += mouseX * 0.55;
        headBone.rotation.x += -mouseY * 0.3;
      }
      if (neckBone) {
        neckBone.rotation.y += mouseX * 0.2;
      }

      const baseY = charPivot.userData.baseY ?? charPivot.position.y;
      charPivot.position.y = baseY + Math.sin(t * 0.9) * 0.05;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ---- Contact scene: slow drifting torus knot (subtle) ---- */
  function initContactScene() {
    const canvas = document.getElementById('contactCanvas');
    const container = document.querySelector('.contact-inner');
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const geo = new THREE.TorusKnotGeometry(1.6, 0.35, 160, 20, 2, 3);
    const mat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.35 });
    const knot = new THREE.Mesh(geo, mat);
    scene.add(knot);

    function resize() {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    if (prefersReduced) {
      renderer.render(scene, camera);
      return;
    }

    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const t = clock.getElapsedTime();
      knot.rotation.x = t * 0.12;
      knot.rotation.y = t * 0.09;
      renderer.render(scene, camera);
    }
    animate();
  }

  initHeroScene();
  initContactScene();
})();
