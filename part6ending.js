(() => {
  // Where the game goes when the ending is over
  const CREDITS_URL = 'credits.html';

  const $ = (id) => document.getElementById(id);
  const views = Array.from(document.querySelectorAll('.v'));

  function show(id) { views.forEach(v => v.classList.toggle('show', v.id === id)); }
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
  const COP = { torso: '#1b2a4a', arms: '#1b2a4a', hair: '#222', legs: '#10192e', hands: '#0b0b0f' };
  const ANCHOR = { torso: '#7a1f2b', arms: '#7a1f2b', longHair: '#3a2518', skin: '#d9a984', legs: '#222' };

  function put(id, opts) { $(id).innerHTML = figureSVG(opts); }

  put('h-josh', JOSH); put('h-pilot', PILOT); put('h-player', PLAYER);
  put('c-player', PLAYER);
  put('b-player', PLAYER);
  put('w-me', PLAYER); put('w-josh', JOSH); put('w-pilot', PILOT);
  put('w-cop1', COP); put('w-cop2', COP); put('w-cop3', COP);
  put('a-josh', JOSH); put('a-pilot', PILOT); put('a-cop1', COP); put('a-cop2', COP);
  put('d-cop', COP);
  put('n-anchor', ANCHOR); put('n-inset-fig', PLAYER);

  const phoneEl = document.createElement('div');
  phoneEl.id = 'b-phone';
  $('b-player').appendChild(phoneEl);

  // ---------- Subtitles ----------
  const sub = $('sub');
  const subWho = $('sub-who');
  const subLine = $('sub-line');

  function say(who, text, speed) {
    subWho.textContent = who;
    subLine.textContent = '';
    sub.classList.add('show');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      subLine.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(timer);
    }, speed);
  }

  function hideSub() { sub.classList.remove('show'); }

  // Schedules a series of lines one after another. Returns the time they all end.
  function sequence(start, lines, speed) {
    let t = start;
    lines.forEach(l => {
      const s = t;
      at(s, () => say(l.who, l.text, speed));
      t += l.text.length * speed + (l.hold || 700);
    });
    return t;
  }

  const cap = $('cap');
  function caption(text) {
    cap.textContent = text;
    cap.classList.add('show');
  }
  function hideCaption() { cap.classList.remove('show'); }

  // ---------- The ending title ----------
  function showFinal() {
    $('final-text').classList.add('show');
    at(5000, () => {
      $('final-text').classList.add('hide');
      $('cover').classList.add('on');
    });
    at(7600, () => { window.location.href = CREDITS_URL; });
  }

  // Skip the animation for people who ask their system to reduce motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFinal();
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

  function beep(freq, length, volume) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
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

  function shot(volume) {
    const c = audio();
    if (!c) return;
    const length = 0.28;
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * length), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = volume || 0.8;
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
  }

  function siren() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.7);
    osc.frequency.linearRampToValueAtTime(620, t + 1.4);
    osc.frequency.linearRampToValueAtTime(900, t + 2.1);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 2.5);
  }

  let beating = false;
  function heartbeat() {
    if (!beating) return;
    thump(58, 0.6, 0.15);
    setTimeout(() => thump(52, 0.4, 0.13), 170);
    setTimeout(heartbeat, 760);
  }

  // =====================================================================
  //  Timeline
  // =====================================================================

  // ---- 1. The hold: you ask to use the bathroom ----
  at(300, () => show('v-hold'));
  at(900, () => say('PHILIP', 'Hey... sorry. I really need the bathroom. Real quick.', 32));
  at(3300, () => say('JOSH', 'Now? ...Sure. Don\'t be long.', 30));
  at(4900, () => {
    hideSub();
    const p = $('h-player');
    p.classList.add('running');
    p.style.left = '-25vw';
  });

  // ---- 2. The sprint to the bathroom door ----
  at(6100, () => {
    show('v-corridor');
    const p = $('c-player');
    p.classList.add('running');
    setTimeout(() => { p.style.left = '76vw'; }, 80);
  });
  at(7500, () => {
    $('c-player').classList.add('in');
    $('c-world').classList.add('zoom'); // slow zoom on the door
  });

  // ---- 3. Inside the bathroom ----
  const bath = $('v-bath');
  at(9800, () => {
    show('v-bath');
    bath.classList.add('pacing');
    $('b-player').classList.add('running');
  });
  at(12600, () => {
    bath.classList.remove('pacing');
    bath.classList.add('still');
    bath.classList.add('phone');
    $('b-player').classList.remove('running');
  });

  // ---- 4. Dialing 911 ----
  const keysEl = $('ph-keys');
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach(k => {
    const d = document.createElement('div');
    d.className = 'k';
    d.textContent = k;
    d.dataset.k = k;
    keysEl.appendChild(d);
  });
  const key9 = keysEl.querySelector('[data-k="9"]');
  const key1 = keysEl.querySelector('[data-k="1"]');
  const callBtn = $('ph-call');
  const finger = $('finger');
  const numberEl = $('ph-number');

  function fingerTo(el, pressed) {
    const r = el.getBoundingClientRect();
    const w = finger.offsetWidth;
    const x = r.left + r.width / 2 - w / 2;
    const y = r.top + r.height * 0.4 + (pressed ? 10 : 0);
    finger.style.transform = `translate(${x}px, ${y}px) rotate(-8deg) ${pressed ? 'scale(0.95)' : ''}`;
    finger.classList.toggle('press', !!pressed);
  }

  function tap(el, digit, freq) {
    fingerTo(el, true);
    el.classList.add('hit');
    beep(freq, 0.12, 0.25);
    if (digit) numberEl.textContent += digit;
    setTimeout(() => {
      fingerTo(el, false);
      el.classList.remove('hit');
    }, 150);
  }

  at(13400, () => {
    show('v-dial');
    fingerTo(key9, false);
  });
  at(14000, () => tap(key9, '9', 852));
  at(14450, () => fingerTo(key1, false));
  at(14850, () => tap(key1, '1', 697));
  at(15250, () => tap(key1, '1', 697));
  at(15650, () => fingerTo(callBtn, false));
  at(16000, () => {
    tap(callBtn, '', 523);
    $('ph-sos').textContent = 'CALLING...';
    callBtn.classList.add('ringing');
  });
  at(16300, () => { beep(440, 0.4, 0.15); beep(480, 0.4, 0.15); });
  at(17000, () => { beep(440, 0.4, 0.15); beep(480, 0.4, 0.15); });

  // ---- 5. The call ----
  at(17700, () => {
    show('v-bath');
    bath.classList.add('call');
  });

  const callLines = [
    { who: '911', text: 'Nine-one-one, what is your emergency?' },
    { who: 'PHILIP', text: 'Please. My name is Philip. I am on a ship in the bay, seventy-two degrees south, one sixty-eight east.' },
    { who: '911', text: 'Sir, are you safe right now?' },
    { who: 'PHILIP', text: 'No. A man named Josh led me out here. He is not missing. He faked it. He is the kidnapper.' },
    { who: 'PHILIP', text: 'His partner is a pilot. They plan to kill me. I have proof on a camera, and there are two bodies in the cold room.' },
    { who: '911', text: 'Stay where you are. Do not come out. Help is on the way.', hold: 900 }
  ];
  const callEnd = sequence(17900, callLines, 18);

  at(callEnd - 4000, () => { $('b-batt').textContent = 'BATTERY 1%'; });

  // ---- 6. 5 MINS LATER ----
  const T1 = callEnd + 300;
  at(T1, () => {
    hideSub();
    show('v-card');
  });

  // ---- 7. The crack under the door ----
  const T2 = T1 + 2300;
  const strip = $('cr-strip');
  const crFlash = $('cr-flash');

  function runShadows(n) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const f = document.createElement('div');
        f.className = 'shadow-foot';
        f.style.left = '-8vw';
        f.style.width = (4 + Math.random() * 3) + 'vw';
        $('cr-shadows').appendChild(f);
        requestAnimationFrame(() => {
          f.style.transition = 'left ' + (0.45 + Math.random() * 0.25) + 's linear';
          f.style.left = '104vw';
        });
        setTimeout(() => f.remove(), 1200);
      }, i * 170);
    }
  }

  function boomText(text) {
    const b = document.createElement('div');
    b.className = 'boom';
    b.textContent = text;
    b.style.left = (10 + Math.random() * 60) + 'vw';
    b.style.top = (8 + Math.random() * 50) + 'vh';
    $('boom-layer').appendChild(b);
    setTimeout(() => b.remove(), 500);
  }

  function crackFlash(text) {
    strip.classList.add('flash');
    crFlash.style.opacity = 0.35;
    shot(0.8);
    if (text) boomText(text);
    setTimeout(() => {
      strip.classList.remove('flash');
      crFlash.style.opacity = 0;
    }, 70);
  }

  at(T2, () => {
    show('v-crack');
    beating = true;
    heartbeat();
  });
  at(T2 + 700, () => runShadows(5));
  at(T2 + 1900, () => crackFlash('BOOM'));
  at(T2 + 2600, () => crackFlash('BOOM'));
  at(T2 + 2800, () => crackFlash('BOOM'));
  at(T2 + 3600, () => crackFlash('BOOM'));
  for (let i = 0; i < 8; i++) {
    at(T2 + 4200 + i * 120, () => crackFlash(''));
  }
  at(T2 + 4300, () => runShadows(4));

  // ---- 8. Watching from the doorway ----
  const T3 = T2 + 5600;
  const wFlash = $('w-flash');

  function muzzle() {
    const m = document.createElement('div');
    m.className = 'mz';
    const left = Math.random() < 0.5 ? 28 + Math.random() * 16 : 60 + Math.random() * 10;
    m.style.left = left + 'vw';
    m.style.bottom = (30 + Math.random() * 10) + 'vh';
    $('v-watch').appendChild(m);
    setTimeout(() => m.remove(), 90);
  }

  function runWatch(ms) {
    const end = performance.now() + ms;
    (function loop() {
      if (performance.now() > end) return;
      wFlash.style.opacity = 0.2 + Math.random() * 0.4;
      muzzle();
      shot(0.5);
      setTimeout(() => { wFlash.style.opacity = 0; }, 60);
      setTimeout(loop, 110 + Math.random() * 190);
    })();
  }

  at(T3, () => {
    beating = false;
    show('v-watch');
    setTimeout(() => $('w-me').classList.add('in'), 60);
    runWatch(3600);
  });

  // ---- 9. Your eyes ----
  const T4 = T3 + 3800;
  const eFlash = $('e-flash');
  const glintL = $('glintL');
  const glintR = $('glintR');

  function runEyes(ms) {
    const end = performance.now() + ms;
    (function loop() {
      if (performance.now() > end) {
        eFlash.style.opacity = 0;
        glintL.style.opacity = 0;
        glintR.style.opacity = 0;
        return;
      }
      const o = Math.random() * 0.55;
      eFlash.style.opacity = o;
      const g = o > 0.25 ? 1 : 0;
      glintL.style.opacity = g;
      glintR.style.opacity = g;
      if (Math.random() < 0.4) shot(0.3);
      setTimeout(loop, 70 + Math.random() * 130);
    })();
  }

  at(T4, () => {
    show('v-eyes');
    runEyes(5000);
  });

  // ---- 10. In the pupil ----
  const T5 = T4 + 5000;
  const pFlash = $('p-flash');
  const rFlash = $('rFlash');
  const rFlash2 = $('rFlash2');
  const rJosh = $('rJosh');

  function pulse(el) {
    el.setAttribute('opacity', 1);
    setTimeout(() => el.setAttribute('opacity', 0), 90);
  }

  at(T5, () => {
    show('v-pupil');
    $('p-wrap').classList.add('zoom');
  });
  at(T5 + 1500, () => { pulse(rFlash2); shot(0.5); });
  at(T5 + 2300, () => { pulse(rFlash); shot(0.7); });
  at(T5 + 2800, () => {
    pulse(rFlash2);
    rJosh.classList.add('fall');
    shot(0.9);
    pFlash.style.opacity = 0.3;
    setTimeout(() => { pFlash.style.opacity = 0; }, 80);
  });

  // ---- 11. The arrests ----
  const T6 = T5 + 4600;
  at(T6, () => {
    show('v-arrest');
    caption('Two suspects in custody');
    siren();
    setTimeout(() => beep(1400, 0.08, 0.3), 900);
    setTimeout(() => beep(1400, 0.08, 0.3), 1300);
  });

  // ---- 12. The cold room ----
  const T7 = T6 + 3700;
  at(T7, () => {
    show('v-bodies');
    hideCaption();
    setTimeout(() => $('d-slab').classList.add('open'), 300);
    setTimeout(() => caption('The bodies of Nate and Aliyah are found'), 1400);
  });

  // ---- 13. The news ----
  const T8 = T7 + 4000;
  at(T8, () => {
    show('v-news');
    hideCaption();
    sub.classList.add('news');
  });

  const newsLines = [
    { who: 'ANCHOR', text: 'Good evening. Tonight, a missing person case has ended with two arrests.', hold: 600 },
    { who: 'ANCHOR', text: 'Police say Josh, reported kidnapped weeks ago, was never taken. He staged his own disappearance with help from a charter pilot.', hold: 600 },
    { who: 'ANCHOR', text: 'Two of Josh\'s friends, Nate and Aliyah, were found dead aboard the ship where he was hiding.', hold: 600 },
    { who: 'ANCHOR', text: 'Both men are in custody. Officers credit one young man: Philip, who followed Josh\'s clues across the world and made one last call with the little battery he had left.', hold: 600 },
    { who: 'ANCHOR', text: 'Police are calling him a hero.', hold: 1500 }
  ];
  const newsStart = T8 + 600;
  const newsEnd = sequence(newsStart, newsLines, 16);

  // The inset lights up gold on the last line
  const lastLineStart = newsEnd - ('Police are calling him a hero.'.length * 16 + 1500);
  at(lastLineStart, () => {
    $('n-inset').classList.add('hero');
    $('n-inset-cap').textContent = 'PHILIP: HERO';
  });

  // ---- 14. The True Ending ----
  const T9 = newsEnd + 400;
  at(T9, () => {
    hideSub();
    $('cover').classList.add('on');
  });
  at(T9 + 2200, showFinal);
})();
