// main.js
document.addEventListener('DOMContentLoaded', () => {

  function applyTilt(el, strength = 15) {
    if (!el) return;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const rx = dy * strength;
      const ry = -dx * strength;
      el.querySelector('.card-inner').style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(30px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.querySelector('.card-inner').style.transform = '';
    });
  }

  applyTilt(document.getElementById('tilt-card'), 10);
  applyTilt(document.getElementById('current-tilt'), 8);

  // Add click animation for forecast days (expand or highlight)
  document.querySelectorAll('.forecast-day').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.forecast-day').forEach(s => s.classList.remove('active-day'));
      el.classList.add('active-day');
      const inner = el.querySelector('.card-inner');
      inner.style.transform = 'translateZ(20px) scale(1.02)';
      setTimeout(()=> inner.style.transform = '', 600);
    });
  });

});
