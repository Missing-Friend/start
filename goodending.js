(() => {
  const scene = document.getElementById('g-scene');
  const lever = document.getElementById('g-lever');
  const chainH = document.getElementById('g-chain-h');
  const chainV = document.getElementById('g-chain-v');
  const crate = document.getElementById('g-crate');
  const dust = document.getElementById('g-dust');
  const puddle = document.getElementById('g-puddle');
  const player = document.getElementById('g-player');
  const sub = document.getElementById('g-sub');
  const line = document.getElementById('g-line');
  const flash = document.getElementById('g-flash');
  const text = document.getElementById('g-text');
  const black = document.getElementById('g-black');

  // Where the game goes when the ending is over
  const CREDITS_URL = 'credits.html';

  const JOSH_LINE = 'What was that supposed to do?';

  function at(ms, fn) { setTimeout(fn, ms); }

  // ---------- Characters ----------
  function figureSVG(o) {
    const skin = o.skin || '#e3b58c';
    const arms = o.arms || o.torso;
    const hands = o.hands || skin;
    const legs = o.legs || '#1c1f2a';
    let head = '';
    if (o.hood) head += `<circle cx="30" cy="21" r="17" fill="${o.hood}"/>`;
    head += `<circle cx="33" cy="23" r="11" fill="${skin}"/>`;
    if (o.hair) head += `<path d="M21 21 Q22 9 34 10 Q45 11 44 21 Q38 14 31 15 Q25 16 21 21 Z" fill="${o.hair}"/>`;
    head += `<circle cx="37.5" cy="23" r="1.3" fill="#222"/>`;
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

  document.getElementById('g-player').innerHTML = figureSVG({
    torso: '#2f6fd6', arms: '#2a63c2', hands: '#0b0b0f', hood: '#2f6fd6', legs: '#1c1f2a'
  });
  document.getElementById('g-josh').innerHTML = figureSVG({
    torso: '#59606b', arms: '#4d535d', hair: '#3a2a1e', legs: '#222831'
  });
  document.getElementById('g-pilot').innerHTML = figureSVG({
    torso: '#6b4f2f', arms: '#5f4528', hair: '#9a9a9a', patch: true, legs: '#2a2a2a'
  });

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

  function crash() {
    const c = audio();
    if (!c) return;
    const length = 0.9;
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * length), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = 0.8;
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
    tone('sine', 55, 0.9, 0.6);
  }

  // Types a line out one letter at a time, then calls done()
  function typeLine(str, speed, done) {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      line.textContent = str.slice(0, i);
      if (i >= str.length) {
        clearInterval(timer);
        done();
      }
    }, speed);
  }

  // ---------- Timeline ----------

  // 0.3s: fade in. Josh and the pilot stand by the table, under the crate.
  at(300, () => {
    scene.classList.add('visible');
  });

  // 1.2s: you run for the wall
  at(1200, () => {
    player.classList.add('running');
    player.style.left = '11vw';
  });

  // 2.4s: you pull the lever
  at(2400, () => {
    player.classList.remove('running');
    lever.classList.add('pulled');
    tone('square', 140, 0.3, 0.18);
  });

  // 2.9s: the chain jerks tight and the crate starts to sway
  at(2900, () => {
    chainH.classList.add('jerk');
    crate.classList.add('sway');
    tone('sawtooth', 90, 0.25, 0.5);
  });

  // 3.8s: Josh turns, confused
  at(3800, () => {
    sub.classList.add('show');
    typeLine(JOSH_LINE, 70, dropCrate);
  });

  // The crate falls the instant his line ends
  function dropCrate() {
    chainV.classList.add('snap');
    crate.classList.remove('sway');
    crate.classList.add('drop');

    // Impact
    setTimeout(() => {
      scene.classList.add('shake');
      flash.classList.add('go');
      dust.classList.add('puff');
      sub.classList.remove('show');
      crash();
    }, 450);

    // Something spills out from under it
    setTimeout(() => {
      puddle.classList.add('grow');
    }, 900);

    // Hold on the aftermath, then fade out
    setTimeout(() => {
      scene.classList.add('out');
    }, 6000);

    // The title
    setTimeout(showEnding, 8800);
  }
})();
