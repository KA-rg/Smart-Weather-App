// public/js/main.js
// Handles: theme toggle, voice input, GPS, localStorage last city,
// loading overlay, Chart rendering, background & particle effects (rain/snow/clouds)

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const micBtn = document.getElementById('micBtn');
  const gpsBtn = document.getElementById('gpsBtn');
  const cityInput = document.getElementById('cityInput');
  const searchForm = document.getElementById('searchForm');

  // Restore last city
  try {
    const last = localStorage.getItem('lastCity');
    if (last && !cityInput.value) cityInput.value = last;
  } catch (e) {}

  // Theme toggle
  function applyTheme(t) {
    if (t === 'dark') body.classList.add('dark-mode'); else body.classList.remove('dark-mode');
    localStorage.setItem('theme', t);
  }
  const savedTheme = localStorage.getItem('theme') || 'auto';
  if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);
  themeToggle?.addEventListener('click', () => {
    const now = body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(now);
  });

  // Voice input
  micBtn?.addEventListener('click', () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new Recognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (ev) => {
      const txt = ev.results[0][0].transcript;
      cityInput.value = txt;
    };
    recog.onerror = () => { /* ignore */ };
    recog.start();
  });

  // GPS
  gpsBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      cityInput.value = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
    }, err => {
      alert('Unable to get location: ' + (err.message || err.code));
    });
  });

  // Save last city and show loading overlay on submit
  const loading = createLoadingOverlay();
  searchForm?.addEventListener('submit', () => {
    try { localStorage.setItem('lastCity', cityInput.value); } catch(e){}
    loading.show();
  });

  // Render chart if present
  const chartDataScript = document.getElementById('chart-data');
  if (chartDataScript) {
    try {
      const chart = JSON.parse(chartDataScript.textContent);
      renderChart(chart);
    } catch (e) { console.error(e) }
  }

  // Background & particles according to WEATHER_CAT set by server
  const weatherCat = window.WEATHER_CAT || 'clear';
  initBackground(weatherCat);

  // functions

  function createLoadingOverlay() {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.innerHTML = `
        <div class="loader">
          <div class="ring"></div>
          <p>Fetching weather...</p>
        </div>`;
      document.body.appendChild(overlay);
    }
    return {
      show: () => overlay.classList.add('show'),
      hide: () => overlay.classList.remove('show')
    };
  }

  // Chart.js temperature chart
  function renderChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const labels = data.dates.map(d => new Date(d).toLocaleDateString());
    const cfg = {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Max (°C)', data: data.maxTemps, tension:0.3, borderWidth:2, fill:false },
          { label: 'Avg (°C)', data: data.avgTemps, tension:0.3, borderWidth:2, fill:true, backgroundColor:'rgba(96,165,250,0.12)' },
          { label: 'Min (°C)', data: data.minTemps, tension:0.3, borderWidth:2, fill:false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    };
    // set canvas height
    document.getElementById('tempChart').height = 220;
    new Chart(ctx, cfg);
  }

  // Background & particle system
  function initBackground(cat) {
    const root = document.getElementById('bg-root');
    root.innerHTML = ''; // clear
    const canvas = document.createElement('canvas');
    canvas.id = 'bgCanvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    root.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // resize
    window.addEventListener('resize', () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    });

    if (cat === 'rain') { startRain(ctx, canvas); }
    else if (cat === 'snow') { startSnow(ctx, canvas); }
    else if (cat === 'cloudy') { startClouds(ctx, canvas); }
    else { startClear(ctx, canvas); }
  }

  // Rain effect
  function startRain(ctx, canvas) {
    const drops = [];
    for (let i=0;i<250;i++) {
      drops.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        len: 10 + Math.random()*20,
        speed: 4 + Math.random()*8,
        thick: 1 + Math.random()*1.5
      });
    }
    function loop(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(3,10,30,0.25)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = 'rgba(174, 214, 241,0.8)';
      ctx.lineWidth = 1;
      for (let d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height) { d.y = -20; d.x = Math.random()*canvas.width; }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  // Snow effect
  function startSnow(ctx, canvas) {
    const flakes = [];
    for (let i=0;i<160;i++) {
      flakes.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: 1 + Math.random()*4,
        d: Math.random()*Math.PI*2,
        sx: Math.random()*0.5,
        sy: 1 + Math.random()*1.5
      });
    }
    function loop(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(10,16,30,0.15)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fill();
        f.x += Math.sin(f.d) * f.sx;
        f.y += f.sy;
        f.d += 0.01;
        if (f.y > canvas.height) { f.y = -10; f.x = Math.random()*canvas.width; }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  // clouds (soft moving shapes)
  function startClouds(ctx, canvas) {
    const clouds = [];
    for (let i=0;i<6;i++) {
      clouds.push({x: i*200 + Math.random()*300, y: 50 + Math.random()*120, w: 180 + Math.random()*140, h: 60 + Math.random()*40, speed: 0.2 + Math.random()*0.5});
    }
    function drawCloud(x,y,w,h,alpha) {
      const grd = ctx.createLinearGradient(x,y,x+w,y+h);
      grd.addColorStop(0, `rgba(255,255,255,${0.07*alpha})`);
      grd.addColorStop(1, `rgba(255,255,255,${0.02*alpha})`);
      ctx.fillStyle = grd;
      roundRect(ctx, x, y, w, h, h/2);
      ctx.fill();
    }
    function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
    function loop(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(2,12,30,0.18)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      for (let c of clouds) {
        drawCloud(c.x, c.y, c.w, c.h, 1.0);
        c.x += c.speed;
        if (c.x - c.w > canvas.width) { c.x = -c.w - Math.random()*200; }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  // clear sky subtle gradient
  function startClear(ctx, canvas) {
    function loop(){
      const g = ctx.createLinearGradient(0,0,0,canvas.height);
      g.addColorStop(0, 'rgba(20,40,90,0.5)');
      g.addColorStop(1, 'rgba(2,8,20,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      requestAnimationFrame(loop);
    }
    loop();
  }

}); // DOMContentLoaded end
