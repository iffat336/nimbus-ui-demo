const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

if (!prefersReducedMotion) {
  const heroMedia = document.querySelector('.hero-media img');
  window.addEventListener('scroll', () => {
    const offset = window.scrollY * 0.25;
    if (heroMedia) heroMedia.style.transform = `scale(1.05) translateY(${offset}px)`;
  });
}
