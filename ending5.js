(() => {
  const scene = document.getElementById('e5-scene');
  const door = document.getElementById('e5-door');
  const man = document.getElementById('e5-man');
  const player = document.getElementById('e5-player');
  const pivot = document.getElementById('e5-pivot');
  const fallen = document.getElementById('e5-fallen');
  const line = document.getElementById('e5-line');
  const text = document.getElementById('e5-text');
  const retry = document.getElementById('e5-retry');

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

  function tone(type, freq, volume, length) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + length);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  function footsteps(count, gap) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => tone('sine', 86, 0.55, 0.11), i * gap);
    }
  }

  // ---------- Timeline ----------

  // 0.3s: fade in. You are pressed against the wall beside the door, wrench raised.
  at(300, () => {
    scene.classList.add('visible');
  });

  // 2.2s: footsteps in the corridor
  at(2200, () => footsteps(4, 700));

  // 5.0s: the bolt slides and the door swings open
  at(5000, () => {
    tone('square', 180, 0.25, 0.12);
    door.classList.add('open');
  });

  // 5.8s: a shape stands in the light, and steps in
  at(5800, () => {
    man.classList.add('show');
    man.classList.add('walk');
    footsteps(2, 650);
  });

  // 7.6s: you swing
  at(7600, () => {
    player.classList.add('lunge');
    pivot.classList.add('swing');
  });

  // 7.7s: he is not where the wrench lands
  at(7700, () => {
    man.classList.add('dodge');
  });

  // 8.0s: the wrench slips away and clatters on the floor
  at(8000, () => {
    pivot.classList.add('gone');
    fallen.classList.add('drop');
    setTimeout(() => tone('triangle', 700, 0.5, 0.16), 520);
  });

  // 8.8s: he steps forward, calm, and you recoil
  at(8800, () => {
    man.classList.remove('dodge');
    man.classList.add('step');
    player.classList.remove('lunge');
    player.classList.add('recoil');
  });

  // 10.0s: he says your name
  at(10000, () => {
    line.classList.add('show');
  });

  // 12.2s: the picture closes like an eye
  at(12200, () => {
    line.classList.remove('show');
    line.classList.add('hide');
    scene.classList.add('iris');
  });

  // 14.6s: red letters fade in
  at(14600, showEnding);
})();
