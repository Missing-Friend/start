(() => {
  const hold = document.getElementById('b-hold');
  const door = document.getElementById('b-door');
  const josh = document.getElementById('b-josh');
  const pilot = document.getElementById('b-pilot');
  const player = document.getElementById('b-player');
  const inside = document.getElementById('b-inside');
  const world = document.getElementById('b-world');
  const me = document.getElementById('b-me');
  const closeNate = document.getElementById('b-close-nate');
  const closeAliyah = document.getElementById('b-close-aliyah');
  const frost = document.getElementById('b-frost');
  const lidTop = document.getElementById('b-lid-top');
  const lidBottom = document.getElementById('b-lid-bottom');
  const cover = document.getElementById('b-cover');
  const text = document.getElementById('b-text');
  const black = document.getElementById('b-black');

  // Where the game goes when the ending is over
  const CREDITS_URL = 'credits.html';

  function at(ms, fn) { setTimeout(fn, ms); }

  // ---------- Characters ----------
  function figureSVG(o) {
    const skin = o.skin || '#e3b58c';
    const arms = o.arms || o.torso;
    const hands = o.hands || skin;
    const legs = o.legs || '#1c1f2a';
    let head = '';
    if (o.longHair) head += `<path d="M13 22 Q12 3 31 3 Q50 3 49 22 L50 50 Q42 44 40 32 L22 32 Q19 44 11 50 Z" fill="${o.longHair}"/>`;
    if (o.hood) head += `<circle cx="30" cy="21" r="17" fill="${o.hood}"/>`;
    head += `<circle cx="33" cy="23" r="11" fill="${skin}"/>`;
    if (o.hair) head += `<path d="M21 21 Q22 9 34 10 Q45 11 44 21 Q38 14 31 15 Q25 16 21 21 Z" fill="${o.hair}"/>`;
    if (o.glasses) head += '<g fill="none" stroke="#111" stroke-width="1.3"><circle cx="37" cy="23" r="4.3"/><path d="M41.3 23 L44 22.5"/></g>';
    head += '<circle cx="37.5" cy="23" r="1.3" fill="#222"/>';
    const patch = o.patch ? '<rect x="6.5" y="56" width="7" height="7" fill="#b0893f"/>' : '';
    return `
      <svg viewBox="0 0 60 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="leg la"><rect x="17" y="80" width="11" height="46" rx="4" fill="${legs}"/></g>
        <g class="leg lb"><rect x="32" y="80" width="11" height="46" rx="4" fill="${legs}"/></g>
        <rect x="14" y="36" width="32" height="48" rx="10" fill="${o.torso}"/>
        <rect x="6" y="40" width="11" height="40" rx="5" fill="${arms}"/>
        <rect x="43" y="40" width="11" height="40" rx="5" fill="${arms}"/>
        ${patch}
        <circle cx="11.5" cy="82" r="6.5" fill="${hands}"/>
        <circle cx="48.5" cy="82" r="6.5" fill="${hands}"/>
        ${head}
      </svg>`;
  }

  const PLAYER = { torso: '#2f6fd6', arms: '#2a63c2', hands: '#0b0b0f', hood: '#2f6fd6', legs: '#1c1f2a' };
  const JOSH = { torso: '#59606b', arms: '#4d535d', hair: '#3a2a1e', legs: '#222831' };
  const PILOT = { torso: '#6b4f2f', arms: '#5f4528', hair: '#9a9a9a', patch: true, legs: '#2a2a2a' };
  const NATE = { torso: '#121214', arms: '#121214', hair: '#6b4a2a', glasses: true, legs: '#2d4a7a', skin: '#f0c8a8' };
  const ALIYAH = { torso: '#e86aa0', arms: '#e86aa0', longHair: '#1b1210', glasses: true, legs: '#2d4a7a', skin: '#c68a5c' };

  player.innerHTML = figureSVG(PLAYER);
  josh.innerHTML = figureSVG(JOSH);
  pilot.innerHTML = figureSVG(PILOT);
  document.getElementById('b-nate').innerHTML = figureSVG(NATE);
  document.getElementById('b-aliyah').innerHTML = figureSVG(ALIYAH);
  me.innerHTML = figureSVG(PLAYER);

  function showEnding() {
    text.classList.add('show');
    // Hold on the title, then fade everything out and go to the credits
    at(4500, () => {
      text.classList.add('hide');
      black.classList.add('on');
    });
    at(7200, () => { window.location.href = CREDITS_URL; });
  }

  // Skip the animation for people who ask their system to reduce motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showEnding();
    return;
  }

  // ---------- Sound (best effort: browsers may block it until the page is clicked) ----------
  let ctx = null;
  let humNodes = null;
  let alive = true;

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
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + length);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  function startHum() {
    const c = audio();
    if (!c || humNodes) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 50;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    humNodes = { osc, gain };
  }

  function stopHum() {
    if (!humNodes) return;
    try { humNodes.osc.stop(); } catch (e) { /* already stopped */ }
    humNodes = null;
  }

  // A heartbeat that slows down and then stops
  let beatGap = 800;
  function heartbeat() {
    if (!alive) return;
    tone('sine', 58, 0.6, 0.15);
    setTimeout(() => tone('sine', 52, 0.4, 0.13), 170);
    beatGap += 260;
    setTimeout(heartbeat, beatGap);
  }

  // ---------- Breath puffs in the cold ----------
  let puffing = true;
  function puff() {
    if (!puffing) return;
    const p = document.createElement('div');
    p.className = 'b-puff';
    p.style.left = (44 + Math.random() * 10) + 'vw';
    p.style.top = '56vh';
    inside.appendChild(p);
    setTimeout(() => p.remove(), 2700);
    puffGap += 350;
    setTimeout(puff, puffGap);
  }
  let puffGap = 1100;

  // ---------- Timeline ----------

  // 0.3s: the hold. You, Josh, and the pilot.
  at(300, () => {
    hold.classList.add('show');
  });

  // 1.2s: you walk toward Josh
  at(1200, () => {
    player.classList.add('running');
    player.style.left = '40vw';
  });

  // 2.7s: you stop. Josh steps in to hug you.
  at(2700, () => {
    player.classList.remove('running');
    josh.style.left = '45vw';
  });

  // 3.9s: the pilot rushes in from behind
  at(3900, () => {
    pilot.classList.add('running');
    pilot.style.left = '51vw';
  });

  // 4.4s: the shove. You are thrown toward the open freezer.
  at(4400, () => {
    pilot.classList.remove('running');
    player.classList.add('shoved');
    tone('sine', 90, 0.7, 0.18);
  });

  // 4.85s: the door slams
  at(4850, () => {
    door.classList.add('closed');
    hold.classList.add('shake');
    tone('square', 70, 0.6, 0.35);
  });

  // 5.4s: black
  at(5400, () => {
    cover.classList.add('instant');
    cover.classList.add('on');
  });

  // 6.8s: inside the freezer. Cold, blue, quiet.
  at(6800, () => {
    hold.classList.remove('show');
    hold.style.display = 'none';
    inside.classList.add('show');
    cover.classList.remove('instant');
    cover.classList.remove('on');
    startHum();
  });

  // 9.4s: the camera pans left
  at(9400, () => {
    world.classList.add('pan');
  });

  // 11.4s: Nate, up close
  at(11400, () => {
    closeNate.classList.add('show');
  });

  // 16.4s: Aliyah, up close
  at(16400, () => {
    closeNate.classList.remove('show');
    closeAliyah.classList.add('show');
  });

  // 21.4s: back to the wide shot. You are starting to sink.
  at(21400, () => {
    closeAliyah.classList.remove('show');
    world.classList.remove('pan');
    world.classList.add('reset');
    setTimeout(() => {
      world.classList.remove('reset');
      world.classList.add('slump');
    }, 800);
    frost.classList.add('on');
    puff();
    heartbeat();
  });

  // 26.5s: the breath stops
  at(26500, () => {
    puffing = false;
  });

  // 27.5s: you are lying on the floor between them. All three of you.
  at(27500, () => {
    me.classList.add('show');
  });

  // 29.4s: your eyes close
  at(29400, () => {
    alive = false;
    stopHum();
    lidTop.classList.add('closed');
    lidBottom.classList.add('closed');
  });

  // 32.4s: black
  at(32400, () => {
    cover.classList.remove('instant');
    cover.classList.add('on');
  });

  // 34.2s: the title
  at(34200, showEnding);
})();
