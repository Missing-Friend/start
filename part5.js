(() => {
  const gameScreen = document.getElementById('game-screen');
  const currentCharacter = document.getElementById('current-character');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Config ----------
  const P4_KEY = 'missing_part4';      // read: results saved by part 4
  const SAVE_KEY = 'missing_part5';    // write: results for part 6
  // Which "caught" ending you get depends on where you slipped up
  const ENDING_CELL = 'ending3.html';   // caught while still in your cell (the wall, the horn)
  const ENDING_VENT = 'ending4.html';   // caught in the vent, or cut Josh loose too slowly
  const ENDING_AMBUSH = 'ending5.html'; // your ambush failed
  const NEXT_PART_URL = 'part6.html';  // after the final choice

  const NOISE_LIMIT = 5;               // make this much noise and you are caught
  const DRAIN_MS = 1500;               // phone battery drops 1% this often while the light is on
  const EXAMINE_COST = 2;              // extra battery % spent each time you search something

  // ---------- Load part 4 results ----------
  function loadPart4() {
    try {
      const raw = localStorage.getItem(P4_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Storage can be blocked or empty. Fall back to defaults below.
    }
    return null;
  }

  const p4 = loadPart4() || { heat: 3, slips: 0, flags: {}, info: [] };

  const state = {
    heat: Math.max(0, Number(p4.heat) || 0),
    slips: Math.max(0, Number(p4.slips) || 0),
    flags: Object.assign({}, p4.flags || {}),
    noise: Math.floor(Math.max(0, Number(p4.heat) || 0) / 4), // how much attention you have drawn here
    battery: 0,
    sound: true,
    stage: 'cell' // 'cell' (your cell), 'vent' (the vent), 'josh' (Josh's cell)
  };
  const gatheredInfo = Array.isArray(p4.info) ? p4.info.slice() : [];

  function addNoise(n) {
    state.noise = Math.max(0, state.noise + n);
  }

  function setFlags(obj) {
    Object.assign(state.flags, obj);
  }

  // ---------- Info panel ----------
  function addInfo(entry) {
    const items = Array.isArray(entry) ? entry : [entry];
    items.forEach(text => {
      if (!gatheredInfo.includes(text)) gatheredInfo.push(text);
    });
    renderInfo();
  }

  function renderInfo() {
    infoContent.innerHTML = '';
    if (gatheredInfo.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Nothing yet.';
      infoContent.appendChild(empty);
      return;
    }
    gatheredInfo.forEach(text => {
      const entry = document.createElement('div');
      entry.className = 'info-entry';
      entry.textContent = text;
      infoContent.appendChild(entry);
    });
  }

  infoButton.onclick = () => { infoPanel.style.display = 'block'; };
  closeInfo.onclick = () => { infoPanel.style.display = 'none'; };

  // ---------- Helpers ----------
  function clearScreen() {
    gameScreen.innerHTML = '';
  }

  function addText(text, className) {
    const p = document.createElement('p');
    p.textContent = text;
    if (className) p.className = className;
    gameScreen.appendChild(p);
    return p;
  }

  function addParagraphs(content) {
    const list = Array.isArray(content) ? content : [content];
    list.filter(Boolean).forEach(t => addText(t));
  }

  function addButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = onClick;
    gameScreen.appendChild(btn);
    return btn;
  }

  // Choices appear in a random order
  function addChoices(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    copy.forEach(c => addButton(c.label, c.run));
  }

  // If you have made too much noise, the next step is the ending instead
  function go(fn) {
    if (state.noise >= NOISE_LIMIT) {
      caughtEnding();
      return;
    }
    fn();
  }

  function showResult(text, next, label) {
    clearScreen();
    addParagraphs(text);
    addButton(label || 'Continue', () => go(next));
  }

  function saveProgress(extra) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({
        heat: state.heat,
        noise: state.noise,
        flags: state.flags,
        info: gatheredInfo
      }, extra || {})));
    } catch (e) {
      // The game still works without storage.
    }
  }

  function fadeAndGo(url) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: black; opacity: 0; transition: opacity 2s;
      z-index: 99999;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 50);
    setTimeout(() => { window.location.href = url; }, 2050);
  }

  function caughtEnding() {
    clearScreen();
    document.body.classList.remove('p5-horn');

    let url;
    let caughtAt;
    let lines;

    if (state.flags.failedAmbush) {
      url = ENDING_AMBUSH;
      caughtAt = 'ambush';
      lines = [
        'The bolt slides back. The door swings in. You swing the wrench with everything you have, and he is simply not where it lands.'
      ];
    } else if (state.flags.cutLate || state.stage === 'vent' || state.stage === 'josh') {
      url = ENDING_VENT;
      caughtAt = 'vent';
      lines = [
        state.flags.cutLate
          ? 'The tie finally parts, and it is too late. Behind you, the whole vent fills with light.'
          : 'A crash behind you. The grate you left hanging open swings wide, and the whole vent fills with light.'
      ];
    } else {
      url = ENDING_CELL;
      caughtAt = 'cell';
      lines = [
        'You never even hear the bolt. The door simply opens, and the light behind it is very bright, and very patient.'
      ];
    }

    addParagraphs(lines);
    saveProgress({ caught: true, caughtAt });
    setTimeout(() => fadeAndGo(url), 1600);
  }

  // ---------- Sound (made with the browser, no audio files) ----------
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function hornSound() {
    if (!state.sound) return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.2);
    gain.gain.setValueAtTime(0.4, t + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
    filter.connect(gain);
    gain.connect(ctx.destination);
    [68, 72].forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 2.5);
    });
  }

  function renderSoundButton() {
    currentCharacter.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = state.sound ? 'Sound: on' : 'Sound: off';
    btn.onclick = () => {
      state.sound = !state.sound;
      btn.textContent = state.sound ? 'Sound: on' : 'Sound: off';
    };
    currentCharacter.appendChild(btn);
  }

  // =====================================================================
  //  SCENE 0: Waking up (eyelids and blurry vision)
  // =====================================================================
  function computeBattery() {
    let b = 50 - state.heat * 2 - state.slips * 5;
    if (state.flags.helper) b += 12;
    if (state.flags.crewAlerted) b -= 8;
    return Math.max(18, Math.min(55, Math.round(b)));
  }

  function startChapter() {
    state.battery = computeBattery();
    renderInfo();
    renderSoundButton();
    clearScreen();

    addText('PART 5: THE QUIET ROOM', 'location-tag');
    addParagraphs([
      'Your head is a bell someone has rung too hard. Cold stone under your cheek. Something rough and tight around your wrists.',
      state.slips >= 3
        ? 'You do not remember the rock, only the sound it made.'
        : 'You remember the rock. You remember the shape coming up behind you.',
      'The floor hums, a deep slow throb you can feel in your teeth. You are back aboard the ship.'
    ]);

    // Eyelids that open in two tries, and a blur that slowly clears
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    top.className = 'p5-lid top';
    bottom.className = 'p5-lid bottom';
    document.body.appendChild(top);
    document.body.appendChild(bottom);

    const blur = Math.min(8, 4 + state.slips);
    gameScreen.style.transition = 'none';
    gameScreen.style.filter = `blur(${blur}px)`;

    function lids(cls) {
      [top, bottom].forEach(l => { l.className = 'p5-lid ' + l.className.split(' ')[1] + ' ' + cls; });
    }

    setTimeout(() => lids('ajar'), 700);
    setTimeout(() => lids(''), 1500);
    setTimeout(() => lids('open'), 2100);
    setTimeout(() => {
      gameScreen.style.transition = 'filter 5s ease';
      gameScreen.style.filter = 'blur(0px)';
    }, 1800);
    setTimeout(() => {
      top.remove();
      bottom.remove();
    }, 4200);

    setTimeout(() => {
      addButton('Find your phone', () => {
        gameScreen.style.transition = 'none';
        gameScreen.style.filter = 'none';
        go(sceneDark);
      });
    }, 3800);
  }

  // =====================================================================
  //  SCENE 1: The dark room (search with your phone light before it dies)
  // =====================================================================
  function sceneDark() {
    clearScreen();
    addText('THE DARK', 'location-tag');
    addParagraphs([
      `The dark is total. You feel through your coat and find your phone: a cracked screen, no signal, and ${state.battery}% battery. It is not much, but it is a light.`,
      state.flags.helper ? 'A small kindness: the crewman made you charge it before you left the engine room.' : null,
      state.flags.crewAlerted ? 'Someone has gone through your coat. The battery is lower than you remember.' : null,
      'Move your pointer (or finger) to sweep the light. Click something to search it. The light drains the battery, and so does searching. You can turn the light off to save what is left.'
    ]);

    let lightOn = true;
    let finished = false;
    const examined = new Set();

    // HUD
    const hud = document.createElement('div');
    hud.className = 'p5-hud';
    const batteryEl = document.createElement('span');
    batteryEl.className = 'p5-battery';
    const lightBtn = document.createElement('button');
    hud.appendChild(batteryEl);
    hud.appendChild(lightBtn);

    // The room
    const room = document.createElement('div');
    room.className = 'p5-room';
    const floor = document.createElement('div');
    floor.className = 'p5-floor';
    room.appendChild(floor);

    const note = document.createElement('div');
    note.className = 'p5-note';

    const spots = [
      {
        id: 'scratch', cls: 'scratch', x: 6, y: 14, w: 22, h: 34,
        build: (el) => {
          ['DON\'T SHOUT.', 'HE HEARS', 'EVERYTHING.'].forEach(line => {
            const d = document.createElement('div');
            d.textContent = line;
            el.appendChild(d);
          });
        },
        text: [
          'Words scratched into the stone in ragged, shaky letters an inch high: "DON\'T SHOUT. HE HEARS EVERYTHING."',
          'Underneath, a small drawing of a fist, as if to say: knock instead.'
        ],
        apply: () => {
          setFlags({ gotWarning: true });
          addInfo('Scratched on the cell wall: "Don\'t shout. He hears everything." Under it, a drawing of a fist.');
        }
      },
      {
        id: 'edge', cls: 'edge', x: 58, y: 62, w: 26, h: 14,
        text: [
          'A bed frame bolted to the floor. One corner has snapped, leaving a jagged edge.',
          'You saw the plastic tie on your wrists against it until it frays and gives. You snap off a flat sliver of rusted metal and keep it.'
        ],
        apply: () => {
          setFlags({ freed: true, hasShard: true });
          addInfo('Freed your wrists on the broken bed frame and kept a sliver of rusted metal.');
        }
      },
      {
        id: 'vent', cls: 'vent', x: 73, y: 8, w: 17, h: 17,
        text: [
          'A rusted vent grate, a little above head height. Cold air breathes out of it.',
          state.flags.followedTapping
            ? 'Faintly, through the metal, a rhythm: tap, tap-tap, tap. You know it better than your own name.'
            : 'Faintly, through the metal, you hear something rhythmic: tap, tap-tap, tap.'
        ],
        apply: () => {
          setFlags({ gotVent: true });
          addInfo('A rusted vent grate breathes cold air. The tapping seems to come from behind it.');
        }
      },
      {
        id: 'slot', cls: 'slot', x: 42, y: 40, w: 14, h: 34,
        text: [
          'A steel door with a narrow slot at eye level. Through it: a bare corridor and a caged bulb.',
          'Two men are talking low, just out of sight. "He leaves the second the horn goes. Shift change. Ten minutes where nobody walks this hall."'
        ],
        apply: () => {
          setFlags({ gotSlot: true });
          addInfo('Through the door slot: "He leaves the second the horn goes. Ten minutes where nobody walks this hall."');
        }
      },
      {
        id: 'bucket', cls: 'bucket', x: 18, y: 66, w: 9, h: 14,
        text: [
          'A bucket skinned with ice. You tip it over, and underneath, wedged against the wall, is a strip of cloth tied in a clumsy double knot.',
          'Josh was held in this room before.'
        ],
        apply: () => {
          setFlags({ gotCloth: true });
          addInfo('Under the bucket: a strip of cloth with Josh\'s double knot. He was held here before.');
        }
      }
    ];

    const dark = document.createElement('div');
    dark.className = 'p5-dark';

    spots.forEach(spot => {
      const el = document.createElement('div');
      el.className = 'p5-hs p5-hs-' + spot.cls;
      el.style.left = spot.x + '%';
      el.style.top = spot.y + '%';
      el.style.width = spot.w + '%';
      el.style.height = spot.h + '%';
      if (spot.build) spot.build(el);
      el.addEventListener('click', () => examine(spot, el));
      room.appendChild(el);
    });
    room.appendChild(dark);

    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Stop searching';

    gameScreen.appendChild(hud);
    gameScreen.appendChild(room);
    gameScreen.appendChild(note);
    gameScreen.appendChild(doneBtn);

    // Light handling
    const pointer = { x: 0, y: 0 };

    function radius() {
      return 38 + state.battery * 1.8;
    }

    function updateLight() {
      room.style.setProperty('--x', pointer.x + 'px');
      room.style.setProperty('--y', pointer.y + 'px');
      room.style.setProperty('--r', radius() + 'px');
      dark.classList.toggle('off', !lightOn || state.battery <= 0);
      dark.classList.toggle('low', lightOn && state.battery > 0 && state.battery <= 8);
    }

    function updateHud() {
      batteryEl.textContent = `Phone: ${state.battery}%`;
      batteryEl.classList.toggle('low', state.battery <= 8);
      lightBtn.textContent = `Light: ${lightOn && state.battery > 0 ? 'ON' : 'OFF'}`;
      updateLight();
    }

    function setNote(lines) {
      note.innerHTML = '';
      lines.filter(Boolean).forEach(t => {
        const p = document.createElement('p');
        p.textContent = t;
        note.appendChild(p);
      });
    }

    function movePointer(e) {
      const rect = room.getBoundingClientRect();
      pointer.x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      pointer.y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      updateLight();
    }

    room.addEventListener('pointermove', movePointer);
    room.addEventListener('pointerdown', movePointer);

    function isLit(el) {
      if (!lightOn || state.battery <= 0) return false;
      const r = el.getBoundingClientRect();
      const rr = room.getBoundingClientRect();
      const px = pointer.x + rr.left;
      const py = pointer.y + rr.top;
      const dx = Math.max(r.left - px, 0, px - r.right);
      const dy = Math.max(r.top - py, 0, py - r.bottom);
      return Math.hypot(dx, dy) <= radius() * 0.85;
    }

    function examine(spot, el) {
      if (finished) return;
      if (!isLit(el)) {
        setNote(['Only darkness there.']);
        return;
      }
      if (examined.has(spot.id)) {
        setNote(['You already searched there.']);
        return;
      }
      examined.add(spot.id);
      state.battery = Math.max(0, state.battery - EXAMINE_COST);
      spot.apply();
      setNote(spot.text);
      if (state.battery <= 0) {
        // The light dies right after you find something: keep what you found on screen
        state.battery = 0;
        lightOn = false;
        const p = document.createElement('p');
        p.textContent = 'The screen flickers once and dies. The dark comes down like a lid.';
        note.appendChild(p);
      }
      updateHud();
    }

    function checkBattery() {
      if (state.battery <= 0 && !finished) {
        state.battery = 0;
        lightOn = false;
        setNote([
          'The screen flickers once and dies. The dark comes down like a lid.',
          'Whatever you found, you found. Whatever you didn\'t, you are not going to.'
        ]);
      }
    }

    lightBtn.onclick = () => {
      if (state.battery <= 0) return;
      lightOn = !lightOn;
      updateHud();
    };

    const tick = setInterval(() => {
      if (finished) return;
      if (lightOn && state.battery > 0) {
        state.battery--;
        checkBattery();
        updateHud();
      }
    }, DRAIN_MS);

    doneBtn.onclick = () => {
      finished = true;
      clearInterval(tick);
      // Did you leave the dark with some battery to spare? A secret ending needs this.
      setFlags({ phoneAlive: state.battery > 0 });
      go(sceneWall);
    };

    // Start the light in the middle of the room once it has a size
    requestAnimationFrame(() => {
      pointer.x = room.clientWidth / 2;
      pointer.y = room.clientHeight / 2;
      updateHud();
    });
  }

  // =====================================================================
  //  SCENE 2: The wall (Josh is on the other side)
  // =====================================================================
  function sceneWall() {
    clearScreen();
    addText('THE WALL', 'location-tag');
    addParagraphs([
      'You sit with your back against the cold stone. Then, very softly, from the other side: tap, tap-tap, tap.',
      state.flags.followedTapping
        ? 'The old rhythm. The one you followed through the dark below deck. He is here.'
        : 'A rhythm, patient and deliberate, repeating.',
      'A moment later, a muffled voice, so quiet you almost take it for your own thoughts: "Philip? Philip, is that you?"',
      state.flags.gotWarning ? 'You remember the scratched words on the wall. Don\'t shout.' : null
    ]);

    addChoices([
      {
        label: 'Whisper back: "It\'s me."',
        run: () => {
          addNoise(1);
          showResult([
            'Your whisper sounds like a shout in the quiet. "Shh!" Josh hisses through the stone. In the corridor, a chair scrapes, then goes still.',
            'You both hold your breath until your lungs hurt. Nobody comes. Not yet.'
          ], wallMessage);
        }
      },
      {
        label: 'Knock back once, softly.',
        run: () => {
          showResult([
            state.flags.followedTapping
              ? 'One soft knock. A pause. Then one soft knock answers, and you can almost hear him exhale. He knows your knock.'
              : 'One soft knock. A long pause. Then one soft knock answers, hesitant, as if he is afraid to believe it.'
          ], wallMessage);
        }
      }
    ]);
  }

  function wallMessage() {
    addInfo('Josh whispered through the wall: use the vent, but only when the horn goes.');
    showResult([
      '"Listen," Josh whispers, fast and low. "There is a vent in your wall. It runs to mine. When the horn goes, the corridor empties. Not before. If you go early, he hears you. Wait for the horn, then come to me."',
      'You hear him swallow. "Please don\'t be early."'
    ], sceneHorn);
  }

  // =====================================================================
  //  SCENE 3: Listening for the horn (patience, not speed)
  // =====================================================================
  function sceneHorn() {
    clearScreen();
    addText('THE LISTENING', 'location-tag');
    addParagraphs([
      'The vent, but only when the horn sounds. Josh did not say why. He did not have to.',
      state.flags.gotSlot
        ? 'Two men said it plainly through the door: when the horn goes, the corridor empties.'
        : 'You do not know what the horn means, only that Josh wants you to wait for it.',
      'Press your ear to the stone and listen. Move too early and the whole ship will hear you. Wait too long and the moment is gone.'
    ]);

    const windowMs = state.flags.gotSlot ? 3600 : 2200;
    let hornCount = 0;
    let hornActive = false;
    let finished = false;
    let timer1 = null;
    let timer2 = null;

    const status = addText('Listening...', 'p5-listen waiting');
    addButton('Go to the vent', onGo);

    function schedule() {
      timer1 = setTimeout(soundHorn, 8000 + Math.random() * 6000);
    }

    function soundHorn() {
      hornCount++;
      hornActive = true;
      hornSound();
      status.textContent = 'HORN';
      status.className = 'p5-listen hornblast';
      document.body.classList.add('p5-horn');
      timer2 = setTimeout(endHorn, windowMs);
    }

    function endHorn() {
      hornActive = false;
      document.body.classList.remove('p5-horn');
      if (finished) return;

      if (hornCount >= 2) {
        finished = true;
        addNoise(2);
        showResult([
          'The second horn fades and you are still sitting there. Footsteps return to the corridor, and then, on the other side of the door, they stop.',
          'You scramble for the vent anyway. It is not quiet.'
        ], sceneVent);
        return;
      }

      addNoise(1);
      status.textContent = 'The horn fades. Footsteps return to the corridor. Keep listening.';
      status.className = 'p5-listen waiting';
      schedule();
    }

    function onGo() {
      if (finished) return;
      finished = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.body.classList.remove('p5-horn');

      if (hornActive) {
        addNoise(-1);
        showResult([
          'You move on the horn, loud enough to bury the sound of your own breathing. The corridor outside goes empty, boots receding.',
          'For ten minutes, the ship belongs to you.'
        ], sceneVent);
      } else {
        addNoise(2);
        showResult([
          'The vent grate rattles in your hands before you have taken a single step. In the corridor, a chair scrapes.',
          'Someone is listening. Someone is always listening.'
        ], sceneVent);
      }
    }

    schedule();
  }

  // =====================================================================
  //  SCENE 4: The vent
  // =====================================================================
  function sceneVent() {
    state.stage = 'vent';
    const f = state.flags;
    const lines = [];

    if (f.hasWrench) {
      lines.push('The wrench handle bites into the rusted screws and they let go with barely a whisper. The man must have tossed it in here with you, like an afterthought.');
    } else if (f.hasShard) {
      lines.push('You work the sliver of metal into the screws, one at a time, until the grate comes away in your hands.');
    } else {
      lines.push('The screws are rusted nearly through. You lean on the grate until it gives, and the sound it makes is the sound of someone breaking a bone.');
      addNoise(1);
    }

    if (!f.freed) {
      lines.push('Your wrists are still bound. You haul yourself up by your elbows and scrape the skin raw doing it.');
      addNoise(1);
    }

    lines.push(
      'Beyond the grate is a tube of cold metal barely wider than your shoulders. You crawl. Fifteen feet. Twenty. A thin line of light ahead, and the smell of other people\'s fear.',
      'And then, close enough to touch, a whisper cracked in half: "Philip?"'
    );

    showResult(lines, sceneCell, 'Keep crawling');
  }

  // =====================================================================
  //  SCENE 5: Josh (the final choice of this part)
  // =====================================================================
  function sceneCell() {
    state.stage = 'josh';
    clearScreen();
    addText('THE OTHER CELL', 'location-tag');
    addParagraphs([
      'Josh is sitting against the far wall with his wrists tied to a pipe. He looks thinner than he did in the park, and older, and his eyes find yours like they do not trust what they are seeing.',
      '"You came," he says. "I told them you would. I told them." His voice breaks and he laughs at himself for it.',
      '"Listen. The horn is almost over. In a couple of minutes he comes to check on me, and he knows how to check. I know why he took me, and I will tell you everything, but not here, not like this."',
      '"We only have one way out and it is not the door."'
    ]);

    addChoices([
      {
        label: 'Cut Josh loose and take him back through the vent.',
        run: () => {
          if (state.flags.hasShard || state.flags.hasWrench) {
            setFlags({ escapedTogether: true });
            addInfo('You freed Josh and took him into the vent.');
            finishPart([
              'The rusted metal bites through the tie in a few ragged strokes. Josh sags against you, then straightens.',
              'You push him into the vent first. As you follow, behind you, a bolt slides back.'
            ]);
          } else {
            addNoise(2);
            setFlags({ cutLate: true });
            addInfo('You freed Josh, but too slowly.');
            finishPart([
              'You saw at the tie with your fingernails, with the edge of the grate, with anything. It parts too late.',
              'Josh is half in the vent when the bolt slides back behind you.'
            ]);
          }
        }
      },
      {
        label: 'Send Josh into the vent alone and stay behind.',
        run: () => {
          setFlags({ decoy: true });
          addInfo('You stayed behind so Josh could escape.');
          finishPart([
            'He argues. You win, because you are out of time and he knows it. His hands are free and his eyes are wet.',
            '"Don\'t you dare," he whispers. Then he is gone into the dark, small and quiet as breath, and you pull the grate shut behind him and sit down on the cold floor to wait.'
          ]);
        }
      },
      {
        label: 'Wait behind the door and ambush the man when he opens it.',
        run: () => {
          if (state.flags.hasWrench) {
            setFlags({ ambushed: true });
            addInfo('You ambushed the man with a wrench.');
            finishPart([
              'You press yourself flat against the wall, wrench raised, heartbeat in your ears. Footsteps. The bolt. A shape in the doorway.',
              'You swing. Something heavy hits the floor.'
            ]);
          } else {
            addNoise(3);
            setFlags({ failedAmbush: true });
            finishPart([
              'You press yourself flat against the wall with nothing but your hands. Footsteps. The bolt.',
              'He has never been surprised in his life.'
            ]);
          }
        }
      }
    ]);
  }

  function finishPart(lines) {
    clearScreen();
    addParagraphs(lines);
    saveProgress({ completed: true });
    addButton('Continue', () => {
      if (state.noise >= NOISE_LIMIT) {
        caughtEnding();
      } else {
        saveProgress({ completed: true });
        fadeAndGo(NEXT_PART_URL);
      }
    });
  }

  // ---------- Go ----------
  startChapter();
})();
