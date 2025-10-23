export function mountParticles() {
  const el = document.querySelector('[data-sparkles]');
  if (!el) return;

  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.className = 'pointer-events-none absolute block w-1 h-1 rounded-full bg-white/80';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.opacity = String(0.3 + Math.random() * 0.7);
    s.style.filter = 'blur(0.5px)';
    s.style.animation = `float ${4 + Math.random() * 6}s ease-in-out infinite`;
    el.appendChild(s);
  }
}
