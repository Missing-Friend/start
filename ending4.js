(() => {
  const scene = document.getElementById('e4-scene');
  const tunnel = document.getElementById('e4-tunnel');
  const light = document.getElementById('e4-light');
  const back = document.getElementById('e4-back');
  const hand = document.getElementById('e4-hand');
  const cut = document.getElementById('e4-cut');
  const text = document.getElementById('e4-text');
  const retry = document.getElementById('e4-retry');

  // Where "Try again" sends the player (part 5 starts fresh from your part 4 results)
  const RETRY_URL = 'part5.html';

  retry.onclick = () => { window.location.href = RETRY_URL; };

  function at(ms, fn) { setTimeout(fn, ms); }

  function showEnding() {
    text.classList.add('show');
    at(4500, () => retry.classList.add('show'));
  }

  // Skip the animation for people who ask their system to reduce motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showEnding();
    return;
  }

  // Build the rushing rings
  const RING_COUNT = 10;
  for (let i = 0; i < RING_COUNT; i++) {
    const ring = document.createElement('div');
    ring.className = 'e4-ring';
    ring.style.animationDelay = (-i * (4.8 / RING_COUNT)) + 's';
    tunnel.appendChild(ring);
  }

  // ---------- Sound (best effort: browsers may block it until the page is clicked) ----------
  let ctx = null;

  function audio() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx.state === 'running' ? ctx : null;
    } catch (e) {
      return null;
    }
  }

  function thump(freq, volume, length) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + length);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  // ---------- Josh's rhythm in the light: tap, tap-tap, tap ----------
  let pulsing = true;
  const PATTERN = [0, 650, 900, 1550]; // when each tap starts, in ms
  const PATTERN_LENGTH = 3300;

  function pulseOnce() {
    if (!pulsing) return;
    light.classList.add('on');
    thump(120, 0.45, 0.12);
    setTimeout(() => light.classList.remove('on'), 170);
  }

  function runPattern() {
    if (!pulsing) return;
    PATTERN.forEach(ms => setTimeout(pulseOnce, ms));
    setTimeout(runPattern, PATTERN_LENGTH);
  }

  // ---------- Timeline ----------

  // 0.3s: fade in, you are crawling toward a light
  at(300, () => {
    scene.classList.add('visible');
    light.classList.add('near');
  });

  // 1.2s: the light starts tapping, in the rhythm you know
  at(1200, runPattern);

  // 5.4s: a crash behind you. The grate swings open and the tunnel fills with light.
  at(5400, () => {
    pulsing = false;
    light.classList.remove('on');
    light.classList.add('out');
    tunnel.classList.add('frozen');
    scene.classList.add('shake');
    back.classList.add('on');
    thump(60, 1.0, 0.5);
  });

  // 6.8s: a hand reaches in after you
  at(6800, () => {
    hand.classList.add('reach');
  });

  // 8.4s: it closes around you
  at(8400, () => {
    hand.classList.remove('reach');
    hand.classList.add('grab');
    thump(70, 0.9, 0.35);
  });

  // 8.9s: cut to black
  at(8900, () => {
    cut.classList.add('on');
  });

  // 11.4s: red letters fade in
  at(11400, showEnding);
})();
