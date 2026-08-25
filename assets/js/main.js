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

      // Generic reveal-up sections
      document.querySelectorAll('.reveal-up').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 24 }, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
        });
      });

      // Timeline items stagger from left
      gsap.utils.toArray('.timeline-item').forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, x: -20 }, {
          opacity: 1, x: 0, duration: 0.6, delay: i * 0.05, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });

      // Credential cards stagger
      gsap.fromTo('.tilt-card',
        { opacity: 0, y: 24, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '#credentialGrid', start: 'top 85%', toggleActions: 'play none none reverse' }
        }
      );
    }
  } else {
    document.querySelectorAll('.reveal, .reveal-up, .tilt-card').forEach(el => el.style.opacity = 1);
    statEls.forEach(animateCount);
  }

  /* ---------- Tilt cards (pointer-based 3D tilt) ---------- */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
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

  /* ================= THREE.JS SCENES ================= */
  if (!hasWebGL || !window.THREE) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---- Hero scene: rotating electrical grid / node network ---- */
  function initHeroScene() {
    const canvas = document.getElementById('heroCanvas');
    const container = document.getElementById('hero');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // Lighting (needed for the standard-material character; harmless for the basic-material globe)
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xea580c, 1.4, 14);
    rimLight.position.set(-3, 1.5, 3);
    scene.add(rimLight);

    // Node network: icosahedron-based points connected by lines (circuit-like)
    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.IcosahedronGeometry(3.0, 3);
    const posAttr = geo.attributes.position;
    const nodeCount = posAttr.count;

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

    /* ---- Character: a stylized figure in a thobe & ghutra that turns & looks at the mouse ---- */
    const charPivot = new THREE.Group(); // handles idle float, stays put in world space
    const charGroup = new THREE.Group(); // handles the head-turn rotation
    charPivot.add(charGroup);
    scene.add(charPivot);

    // Procedural red/white checkerboard for the ghutra cloth -- no external
    // texture file needed. NearestFilter + no mipmaps keeps the squares crisp
    // instead of letting minification blur them into a flat pink wash.
    function makeGhutraTexture(repeat) {
      const cells = 4;
      const cellPx = 16;
      const size = cells * cellPx;
      const cnv = document.createElement('canvas');
      cnv.width = cnv.height = size;
      const ctx = cnv.getContext('2d');
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#f4efe6' : '#c81e2c';
          ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
        }
      }
      const tex = new THREE.CanvasTexture(cnv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      return tex;
    }
    const ghutraMatCap = new THREE.MeshStandardMaterial({ map: makeGhutraTexture(3), roughness: 0.85 });
    const ghutraMatFlap = new THREE.MeshStandardMaterial({ map: makeGhutraTexture(1.4), roughness: 0.85, side: THREE.DoubleSide });

    // Thobe (shoulders/torso)
    const thobeMat = new THREE.MeshStandardMaterial({ color: 0xf1ede3, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.7, 0.9, 28), thobeMat);
    body.position.y = -0.4;
    charGroup.add(body);

    // Head -- kept plain/neutral (no attempt at a literal likeness); the ghutra
    // cap, eyes and clothing carry the character's identity instead.
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc98f63, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), skinMat);
    head.position.y = 0.5;
    charGroup.add(head);

    // Ghutra cap -- a shell slightly larger than the head, so it fully covers it
    // (an equal- or smaller-radius shell here would z-fight/clip with the head).
    const ghutraCap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), ghutraMatCap);
    ghutraCap.position.y = 0.5;
    charGroup.add(ghutraCap);

    // Draped side flaps
    [-1, 1].forEach((side) => {
      const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), ghutraMatFlap);
      flap.position.set(side * 0.4, 0.2, 0.05);
      flap.rotation.y = side * 0.4;
      flap.rotation.z = side * -0.06;
      charGroup.add(flap);
    });

    // Agal (the black cord ring)
    const agalMat = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.4 });
    const agal = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 12, 32), agalMat);
    agal.position.y = 0.66;
    agal.rotation.x = Math.PI / 2;
    charGroup.add(agal);

    // Eyes must sit further out than the head+ghutra shell (~0.5) along this
    // angle, otherwise that solid shell occludes them from the camera.
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d });
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.35 });
    const eyePairs = [-0.16, 0.16].map((baseX) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), eyeMat);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), eyeGlowMat);
      eye.position.set(baseX, 0.5, 0.58);
      glow.position.copy(eye.position);
      charGroup.add(eye, glow);
      return { eye, glow, baseX, baseY: 0.5 };
    });

    // Position the character to the right of the (left-aligned, on desktop) hero copy
    charPivot.position.set(2.7, -0.15, 1.8);
    charPivot.scale.setScalar(0.001); // pop-in on load
    gsap?.to?.(charPivot.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'back.out(1.6)', delay: 0.4 });

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
      charPivot.position.x = narrow ? 0 : 2.7;
      charPivot.position.y = narrow ? -2.6 : -0.3;
      charPivot.userData.baseY = charPivot.position.y;
    }
    resize();
    window.addEventListener('resize', resize);
    charPivot.userData.baseY = charPivot.position.y;

    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

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

    function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.06 + mouseX * 0.6;
      group.rotation.x = Math.sin(t * 0.15) * 0.08 + mouseY * 0.3;
      particles.rotation.y = -t * 0.02;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      // Character: head turns toward the cursor, eyes track it a little further, idle bob
      const turnY = mouseX * 0.9;
      const turnX = mouseY * 0.45;
      charGroup.rotation.y += (turnY - charGroup.rotation.y) * 0.08;
      charGroup.rotation.x += (-turnX - charGroup.rotation.x) * 0.08;
      const baseY = charPivot.userData.baseY ?? charPivot.position.y;
      charPivot.position.y = baseY + Math.sin(t * 0.9) * 0.09;
      const eyeX = mouseX * 0.035;
      const eyeY = -mouseY * 0.025;
      eyePairs.forEach(({ eye, glow, baseX, baseY: eBaseY }) => {
        eye.position.set(baseX + eyeX, eBaseY + eyeY, 0.58);
        glow.position.copy(eye.position);
      });

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
