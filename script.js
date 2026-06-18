// Reveal-on-scroll for .reveal elements
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => revealObserver.observe(el));

// Animated stat counters
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el) {
  const target = Number(el.dataset.count);
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString();
    return;
  }
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statEls = document.querySelectorAll('.stat-num');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
statEls.forEach((el) => statObserver.observe(el));

// Cursor-spotlight + 3D tilt on glass cards
if (!prefersReducedMotion) {
  document.querySelectorAll('.bento-card, .price-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -7;
      const rotateY = ((x - cx) / cx) * 7;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) translateZ(10px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Parallax aurora blobs following the cursor
  const blobLayers = document.querySelectorAll('.blob-layer');
  window.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    blobLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 20);
      layer.style.transform = `translate(${nx * depth}px, ${ny * depth}px)`;
    });
  });
}

// Hero 3D object (Three.js) — glassy torus knot that drifts toward the cursor
function initHero3D() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const container = canvas.parentElement;
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);

  const keyLight = new THREE.DirectionalLight(0x818cf8, 2.4);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x22d3ee, 2.2);
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const geometry = new THREE.TorusKnotGeometry(1.7, 0.5, 220, 32);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x818cf8,
    metalness: 0.25,
    roughness: 0.12,
    transmission: 0.85,
    thickness: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    ior: 1.4,
    iridescence: 0.6,
    iridescenceIOR: 1.3,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.06,
  });
  const knot = new THREE.Mesh(geometry, material);
  scene.add(knot);

  const wireGeometry = new THREE.TorusKnotGeometry(2.05, 0.012, 160, 8);
  const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.35 });
  const wireKnot = new THREE.Mesh(wireGeometry, wireMaterial);
  scene.add(wireKnot);

  let targetRotX = 0;
  let targetRotY = 0;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = nx * 1.2;
    targetRotX = ny * 1.2;
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  let frame = 0;
  function animate() {
    frame += 1;
    knot.rotation.x += 0.0025;
    knot.rotation.y += 0.004;
    wireKnot.rotation.x -= 0.0015;
    wireKnot.rotation.y -= 0.003;

    knot.rotation.x += (targetRotX - knot.rotation.x) * 0.02;
    knot.rotation.y += (targetRotY - knot.rotation.y) * 0.02;
    wireKnot.rotation.x = knot.rotation.x;
    wireKnot.rotation.y = knot.rotation.y;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  if (prefersReducedMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
}

initHero3D();
