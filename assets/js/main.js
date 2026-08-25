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
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; }
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

  /* ================= THREE.JS SCENES ================= */
  if (!hasWebGL) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---- Hero scene: node network backdrop + a rigged 3D robot that watches the cursor ---- */
  function initHeroScene() {
    const canvas = document.getElementById('heroCanvas');
    const container = document.getElementById('hero');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xea580c, 1.6, 16);
    rimLight.position.set(-3, 1.5, 3);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x64748b, 0.6, 16);
    fillLight.position.set(2, -1, 4);
    scene.add(fillLight);

    // Node network: icosahedron-based points connected by lines (circuit-like)
    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.IcosahedronGeometry(3.0, 3);
    const nodesMat = new THREE.PointsMaterial({
      color: 0xea580c, size: 0.045, transparent: true, opacity: 0.9, sizeAttenuation: true
    });
    const nodes = new THREE.Points(geo, nodesMat);
    group.add(nodes);

    const edgesGeo = new THREE.EdgesGeometry(geo, 1);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.28 });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    group.add(edges);

    // Ambient floating particles
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 6 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.03, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ---- Character: a rigged, animated robot (RobotExpressive, three.js sample asset) ---- */
    const charPivot = new THREE.Group();
    scene.add(charPivot);
    charPivot.scale.setScalar(0.001);

    let mixer = null;
    const actions = {};
    let activeAction = null;
    let headBone = null;
    let neckBone = null;
    let robotReady = false;

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

    let robotModel = null;
    new GLTFLoader().load(
      'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
      (gltf) => {
        const model = gltf.scene;
        model.position.y = -1.05;
        model.scale.setScalar(0.62);
        charPivot.add(model);
        robotModel = model;
        resize(); // apply the correct desktop/mobile scale now that the model exists

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
      () => { /* Model failed to load (offline/blocked) -- the globe backdrop still renders fine. */ }
    );

    let w = 0, h = 0;
    function resize() {
      const rect = container.getBoundingClientRect();
      w = rect.width; h = rect.height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Narrow/portrait viewports: park the character centered below the (centered) copy
      // instead of off to the right of a left-aligned column that no longer exists.
      const narrow = w < 780;
      charPivot.position.x = narrow ? 0 : 2.6;
      charPivot.position.y = narrow ? -4.6 : -0.1;
      charPivot.userData.baseY = charPivot.position.y;
      if (robotModel) robotModel.scale.setScalar(narrow ? 0.46 : 0.62);
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    // Scroll-scrubbed depth: the globe recedes and the camera pulls back as the
    // visitor scrolls past the hero, instead of just sitting there statically.
    if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: container, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      // (charPivot.scale is left alone here -- it's owned by the pop-in tween
      // once the robot loads, and a second tween on the same props would
      // fight it via GSAP's overwrite handling.)
      scrollTl
        .to(camera.position, { z: 13, ease: 'none' }, 0)
        .to(group.scale, { x: 0.7, y: 0.7, z: 0.7, ease: 'none' }, 0);
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

      group.rotation.y = t * 0.06 + mouseX * 0.6;
      group.rotation.x = Math.sin(t * 0.15) * 0.08 + mouseY * 0.3;
      particles.rotation.y = -t * 0.02;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.02;
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
      charPivot.position.y = baseY + Math.sin(t * 0.9) * 0.07;

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
