(() => {
  const gameScreen = document.getElementById('game-screen');
  const currentCharacter = document.getElementById('current-character');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Config ----------
  const P3_KEY = 'missing_part3';      // read: results saved by part 3
  const SAVE_KEY = 'missing_part4';    // write: results for part 5
  const ENDING_URL = 'ending2.html';   // too many mistakes in the chase
  const NEXT_PART_URL = 'part5.html';  // after the cutscene

  const MAX_MISTAKES = 3;              // a 4th mistake ends the chase
  const DOUBLE_CLICK_MS = 320;         // two clicks within this = a "drop"
  const BASE_WINDOW_MS = 3000;         // time you get per obstacle at best
  const MIN_WINDOW_MS = 2000;          // time you get per obstacle at worst

  const KEYPAD_CODE = '1213';          // tally marks (1 2 1) + hatch stencil (3)
  const KNOCK_PATTERN = [1, 2, 1];     // tap, tap-tap, tap
  const KNOCK_GROUP_GAP_MS = 520;      // gap that starts a new group of knocks
  const KNOCK_IDLE_MS = 1700;          // silence after which the door judges you

  // ---------- Load part 3 results ----------
  function loadPart3() {
    try {
      const raw = localStorage.getItem(P3_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Storage can be blocked or empty. Fall back to defaults below.
    }
    return null;
  }

  const p3 = loadPart3() || { distance: 3, flags: {}, info: [] };

  // heat = how much attention you have drawn. It starts as your distance from Josh at the end of part 3
  // and it shortens the time you get in the chase.
  const state = {
    heat: Math.max(0, Number(p3.distance) || 0),
    flags: Object.assign({}, p3.flags || {})
  };
  const gatheredInfo = Array.isArray(p3.info) ? p3.info.slice() : [];

  function addHeat(n) {
    state.heat = Math.max(0, state.heat + n);
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

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // A list of choices in random order: [{ label, run }]
  function addChoices(list) {
    shuffle(list).forEach(c => addButton(c.label, c.run));
  }

  // A result screen with a single button to move on
  function showResult(text, next, label) {
    clearScreen();
    addParagraphs(text);
    addButton(label || 'Continue', next);
  }

  // A text box plus a button. onSubmit(value) is called on click or Enter.
  function addInput(placeholder, onSubmit, opts) {
    const options = opts || {};
    const row = document.createElement('div');
    row.className = 'p4-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    if (options.maxLength) input.maxLength = options.maxLength;
    if (options.numeric) input.inputMode = 'numeric';
    const btn = document.createElement('button');
    btn.textContent = options.button || 'Enter';
    const submit = () => {
      const value = input.value.trim();
      if (!value) return;
      onSubmit(value, input);
    };
    btn.onclick = submit;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    row.appendChild(input);
    row.appendChild(btn);
    gameScreen.appendChild(row);
    input.focus();
    return input;
  }

  function saveProgress(extra) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({
        heat: state.heat,
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

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ---------- Figures ----------
  // The same character model as ending1: blue hoodie, black gloves.
  function playerSVG() {
    return `
      <svg viewBox="0 0 60 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="p4-leg p4-leg-a"><rect x="17" y="80" width="11" height="46" rx="4" fill="#1c1f2a"/></g>
        <g class="p4-leg p4-leg-b"><rect x="32" y="80" width="11" height="46" rx="4" fill="#1c1f2a"/></g>
        <rect x="14" y="36" width="32" height="48" rx="10" fill="#2f6fd6"/>
        <rect x="6" y="40" width="11" height="40" rx="5" fill="#2a63c2"/>
        <rect x="43" y="40" width="11" height="40" rx="5" fill="#2a63c2"/>
        <circle cx="11.5" cy="82" r="6.5" fill="#0b0b0f"/>
        <circle cx="48.5" cy="82" r="6.5" fill="#0b0b0f"/>
        <circle cx="30" cy="21" r="17" fill="#2f6fd6"/>
        <circle cx="33" cy="23" r="11" fill="#e3b58c"/>
        <circle class="p4-eye-open" cx="37" cy="22" r="1.5" fill="#222"/>
        <path class="p4-eye-closed" d="M35.500 22 h3.500" stroke="#222" stroke-width="1.500" stroke-linecap="round" fill="none"/>
      </svg>`;
  }

  function shadowSVG() {
    return `
      <svg viewBox="0 0 60 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="p4-leg p4-leg-a"><rect x="17" y="80" width="11" height="46" rx="4" fill="#050507"/></g>
        <g class="p4-leg p4-leg-b"><rect x="32" y="80" width="11" height="46" rx="4" fill="#050507"/></g>
        <rect x="12" y="36" width="36" height="48" rx="10" fill="#050507" stroke="#14141b" stroke-width="1.5"/>
        <rect x="4" y="40" width="11" height="40" rx="5" fill="#050507"/>
        <rect x="45" y="40" width="11" height="40" rx="5" fill="#050507"/>
        <circle cx="30" cy="21" r="15" fill="#050507" stroke="#14141b" stroke-width="1.5"/>
        <polygon class="p4-knife" points="2,84 -12,90 2,92" fill="#b9c0cc"/>
      </svg>`;
  }

  // =====================================================================
  //  SCENE 0: Arrival (changes with how part 3 ended)
  // =====================================================================
  function startChapter() {
    renderInfo();
    clearScreen();
    addText('PART 4: BELOW THE WATERLINE', 'location-tag');

    if (state.flags.chasedHelicopter) {
      addParagraphs([
        'The helicopter\'s lights shrink into the dark. Josh was never on it. You know that now.',
        'The crew is spilling onto the deck behind you, so you do the only thing left to do. You drop through a maintenance hatch and slam it shut over your head. Your heart is hammering, and the ladder ends in the engine room.',
        'If Josh is anywhere on this ship, he is below you.'
      ]);
    } else if (state.flags.foundEngineRoomPath) {
      addParagraphs([
        'The engine room swallows you. Heat, noise, a deep hum that you can feel in your ribs.',
        'Somewhere in the maze of pipes, the tapping has stopped. That is worse than hearing it. Whoever was making it knows you are close.'
      ]);
    } else {
      addParagraphs([
        'You find your way down into the engine room. Heat, noise, a deep hum in the floor.',
        'Josh is somewhere on this ship. You can feel it. You just have to read what he left behind.'
      ]);
    }

    addButton('Look around', sceneExamine);
  }

  // =====================================================================
  //  SCENE 1: Examine the room (you can only look at a few things)
  // =====================================================================
  function sceneExamine() {
    const f = state.flags;
    let remaining = 3 - (f.alerted ? 1 : 0) - (f.chasedHelicopter ? 1 : 0);
    remaining = Math.max(2, remaining);
    const used = new Set();

    const items = [
      {
        id: 'bulkhead',
        label: 'The pipes near the floor',
        text: [
          'Down near the floor, in the gap between two pipes, someone has scratched marks into the paint with a key. One line, a gap, two lines, a gap, one line.',
          '| || |'
        ],
        apply: () => {
          setFlags({ gotTally: true });
          addInfo('Scratched into the engine room bulkhead: | || |');
        }
      },
      {
        id: 'stencil',
        label: 'The hatch in the far wall',
        text: [
          'Under years of grease, the hatch bears a faded stenciled number: 3.',
          'Beside it is a keypad with a cracked plastic cover.'
        ],
        apply: () => {
          setFlags({ gotDeck: true });
          addInfo('The hatch in the engine room is stenciled with the number 3.');
        }
      },
      {
        id: 'mug',
        label: 'The mug on the workbench',
        text: [
          'A mug of something dark, with a thin skin just starting to form on top. It is still warm.',
          'Whoever sat here left minutes ago, in a hurry.'
        ],
        apply: () => {
          setFlags({ gotMug: true });
          addHeat(-1);
          addInfo('A mug on the workbench was still warm. Someone left minutes ago.');
        }
      },
      {
        id: 'logbook',
        label: 'The crew logbook',
        text: [
          'Pages of shift notes in cramped handwriting. The last entry is in a different hand, pressed hard into the paper:',
          '"Guest moved to lower deck. Transfer by boat at first light. Keep him quiet."'
        ],
        apply: () => {
          setFlags({ gotLog: true });
          addInfo('Logbook: the guest was moved to the lower deck, with a transfer by boat planned for first light.');
        }
      },
      {
        id: 'toolbox',
        label: 'The open toolbox',
        text: [
          'Wrenches, a coil of wire, a flashlight with dead batteries. You take the longest wrench. It is heavier than it looks.'
        ],
        apply: () => {
          setFlags({ hasWrench: true });
          addInfo('Took a wrench from the engine room toolbox.');
        }
      }
    ];
    const order = shuffle(items);

    function render() {
      clearScreen();
      addText('THE ENGINE ROOM', 'location-tag');
      addParagraphs([
        'A cave of pipes and humming steel. There is more here than you have time to look at.',
        `You can look closely at ${remaining} thing${remaining === 1 ? '' : 's'} before someone comes.`
      ]);
      order.filter(i => !used.has(i.id)).forEach(item => {
        addButton(item.label, () => examine(item));
      });
    }

    function examine(item) {
      used.add(item.id);
      remaining--;
      item.apply();
      clearScreen();
      addParagraphs(item.text);
      if (remaining > 0) {
        addButton('Keep looking', render);
      } else {
        addButton('Move on', sceneKeypad);
      }
    }

    render();
  }

  // =====================================================================
  //  SCENE 2: Keypad (type the code)
  // =====================================================================
  function sceneKeypad() {
    let attempts = 0;
    const MAX_ATTEMPTS = 4;

    clearScreen();
    addText('THE KEYPAD', 'location-tag');
    addParagraphs([
      'The hatch in the far wall has a keypad behind a cracked plastic cover. Four digits. A tiny light waits, patient and green.',
      state.flags.gotTally ? 'The marks scratched near the floor: | || |' : null,
      state.flags.gotDeck ? 'The stenciled number on the hatch: 3.' : null
    ]);
    const feedback = addText('', 'p4-feedback');

    addInput('4 digits', (value) => {
      attempts++;
      if (value === KEYPAD_CODE) {
        addInfo('The keypad code was 1213.');
        showResult(
          ['The light flicks green. Something inside the hatch clunks and the door swings inward on a stairway that goes down into the dark.'],
          sceneKnock
        );
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        if (state.flags.hasWrench) {
          addHeat(1);
          showResult([
            'You jam the wrench behind the cover and lean on it until something snaps. The hatch groans open.',
            'It was not quiet.'
          ], sceneKnock);
        } else {
          addHeat(3);
          showResult([
            'The pad shrieks, a long rising wail. Somewhere above you a siren starts. The hatch pops open anyway, as if it was waiting for you to be loud.'
          ], sceneKnock);
        }
        return;
      }

      feedback.textContent = 'The pad blinks red.';
    }, { maxLength: 4, numeric: true, button: 'Enter code' });
  }

  // =====================================================================
  //  SCENE 3: The knocking door (rhythm: click once, twice, once)
  // =====================================================================
  function sceneKnock() {
    let fails = 0;
    let clicks = [];
    let idleTimer = null;
    let finished = false;

    clearScreen();
    addText('THE KNOCKING DOOR', 'location-tag');
    addParagraphs([
      'The stairway ends at a heavy steel door with no handle. In the middle is a brass plate worn smooth, as if it has been knocked on a thousand times.',
      state.flags.followedTapping
        ? 'You know the rhythm that belongs on this door. You heard it through the dark.'
        : 'From behind the door, very faintly, comes a sound you can almost place.',
      'Knock. Then wait for the door to answer.'
    ]);
    const dots = addText('', 'p4-dots');
    const feedback = addText('Pause briefly between knocks to start a new group.', 'p4-feedback');
    const knockBtn = addButton('KNOCK', onKnock);
    knockBtn.className = 'p4-knock-btn';

    function groups() {
      const result = [];
      clicks.forEach((t, i) => {
        if (i > 0 && t - clicks[i - 1] < KNOCK_GROUP_GAP_MS) {
          result[result.length - 1]++;
        } else {
          result.push(1);
        }
      });
      return result;
    }

    function renderDots() {
      dots.textContent = groups().map(g => '•'.repeat(g)).join('   ');
    }

    function onKnock() {
      if (finished) return;
      clicks.push(Date.now());
      renderDots();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(judge, KNOCK_IDLE_MS);
    }

    function judge() {
      if (finished) return;
      const g = groups();
      const ok = g.length === KNOCK_PATTERN.length && g.every((n, i) => n === KNOCK_PATTERN[i]);

      if (ok) {
        finished = true;
        showResult([
          'Silence. Then, from the other side, one soft knock answers. A bolt slides back.'
        ], sceneCabins);
        return;
      }

      fails++;
      addHeat(1);
      clicks = [];
      renderDots();

      if (fails >= 4) {
        finished = true;
        addHeat(1);
        showResult([
          'The door swings open on its own. Nobody is there. Somebody got tired of waiting for you to get it right.'
        ], sceneCabins);
        return;
      }

      feedback.textContent = 'Nothing. Then, very faintly, from inside, a single dry tap. Wrong.';
    }
  }

  // =====================================================================
  //  SCENE 4: Three doors (not a this-or-that)
  // =====================================================================
  function sceneCabins() {
    clearScreen();
    addText('THE LOWER DECK', 'location-tag');
    addParagraphs([
      'A narrow corridor with three doors, lit by a single caged bulb.',
      'Cabin 2: the door is ajar. The bunk inside is stripped and dusty.',
      'Cabin 3: the frame is smeared with a fleck of orange paint, as if someone brushed past with something wet.',
      'Cabin 5: locked. It smells of laundry soap and cigarette smoke.',
      state.flags.followedFlags
        ? 'That orange. You have seen that exact orange before, along a ridge, in the snow.'
        : 'Orange. It could be anything.'
    ]);

    addChoices([
      {
        label: 'Cabin 2',
        run: () => {
          addHeat(1);
          showResult([
            'Dust, a stripped mattress, a smell like nobody has breathed here in years. You back out into the corridor.',
            'The fleck of orange on the next door catches the light.'
          ], sceneMemo);
        }
      },
      {
        label: 'Cabin 3',
        run: () => {
          addHeat(-1);
          setFlags({ foundCabin: true });
          addInfo('Cabin 3: the blanket on the bunk was still warm. A memo is pinned to a corkboard.');
          showResult([
            'Inside: a bunk with the blanket thrown back, still warm. A tin cup on its side. A corkboard screwed to the wall, with one sheet of paper pinned to it.',
            'Josh was here. Not long ago.'
          ], sceneMemo);
        }
      },
      {
        label: 'Cabin 5',
        run: () => {
          addHeat(2);
          showResult([
            'You press your ear to the door. Voices. Someone laughs. A chair scrapes the floor. You back away before it scrapes again.',
            'Farther down the corridor, the orange fleck on cabin 3\'s frame catches your eye.'
          ], sceneMemo);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 5: The memo (an acrostic: read the first letters)
  // =====================================================================
  function sceneMemo() {
    let tries = 0;

    clearScreen();
    addText('THE CORKBOARD', 'location-tag');
    addText('One sheet of crew letterhead is pinned to the board. Someone has read it in a hurry. One corner has been torn off.');

    const memo = document.createElement('div');
    memo.className = 'p4-memo';
    [
      ['p4-memo-head', 'MEMO TO ALL WATCH'],
      [null, 'PREPARE the lifeboat for first light.'],
      [null, 'OWNER wants the guest moved quietly.'],
      [null, 'REMEMBER, no lights on deck until then.'],
      [null, 'TAKE the long way round. Avoid the bridge.'],
      ['p4-margin', 'Don\'t read it. Look at it.']
    ].forEach(([cls, text]) => {
      const line = document.createElement('div');
      if (cls) line.className = cls;
      line.textContent = text;
      memo.appendChild(line);
    });
    gameScreen.appendChild(memo);

    addText('Which side of the ship is the lifeboat on?');
    const feedback = addText('', 'p4-feedback');

    addInput('Which side?', (value) => {
      tries++;
      const answer = value.toLowerCase();
      if (answer.includes('port') && !answer.includes('starboard')) {
        setFlags({ knowsSide: true });
        addInfo('The memo hides a word in the first letter of each line: PORT.');
        showResult([
          'Four first letters. P. O. R. T.',
          'Josh hid it in plain sight, in a place nobody reads twice.'
        ], sceneCrewman);
        return;
      }

      if (tries >= 2) {
        addHeat(2);
        setFlags({ wrongSide: true });
        showResult([
          'You pick a side and hope. Then you remember that Josh never hid things where they could be read straight through.',
          'You have wasted precious minutes.'
        ], sceneCrewman);
        return;
      }

      feedback.textContent = 'That doesn\'t feel right. Josh wouldn\'t write it that plainly.';
    }, { button: 'Answer' });
  }

  // =====================================================================
  //  SCENE 6: The crewman (three options, and your earlier radio call matters)
  // =====================================================================
  function sceneCrewman() {
    clearScreen();
    addText('THE CREWMAN', 'location-tag');
    addParagraphs([
      'A young crewman steps out of the shadows, hands half raised. He is shaking.',
      '"Please," he whispers. "I didn\'t sign up for this. They said it was a research job."'
    ]);

    addChoices([
      {
        label: 'Ask him to help you.',
        run: () => {
          if (state.flags.broadcast) {
            addHeat(2);
            setFlags({ crewAlerted: true });
            showResult([
              '"Of course," he says, much too quickly. His hand slides to his belt, and a radio crackles a single word you can\'t make out.',
              'He was told to expect you. He smiles, apologetically, as you run.'
            ], sceneFuses);
            return;
          }
          addHeat(-1);
          setFlags({ helper: true });
          addInfo('A crewman helped you and drew attention away from the lifeboats.');
          showResult([
            'He swallows hard and nods. "Take the long way around the lifeboats. I\'ll draw them off."',
            'He hurries away in the other direction, loudly, on purpose.'
          ], sceneFuses);
        }
      },
      {
        label: 'Grab him and demand answers.',
        run: () => {
          addHeat(2);
          setFlags({ crewAlerted: true });
          showResult([
            'He gasps that he knows nothing, and you can tell he is telling the truth. You let go.',
            'He bolts down the corridor, shouting for help as he goes.'
          ], sceneFuses);
        }
      },
      {
        label: 'Wait until he turns away, then slip past.',
        run: () => {
          showResult([
            'You press into the shadows until he turns to look the other way, then slide past him without a sound.',
            'You never find out what he was about to say.'
          ], sceneFuses);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 7: The fuse panel (pick exactly two, and the memo's answer matters)
  // =====================================================================
  function sceneFuses() {
    clearScreen();
    addText('THE FUSE PANEL', 'location-tag');
    addParagraphs([
      'The way up to the lifeboats is covered by two cameras and a string of work lights. Beside you, a fuse panel with six switches, labeled in marker: GALLEY, CAM-PORT, NAV, CAM-STBD, HEATERS, DECK LIGHTS.',
      'You can pull exactly two before somebody notices.'
    ]);

    const names = shuffle(['GALLEY', 'CAM-PORT', 'NAV', 'CAM-STBD', 'HEATERS', 'DECK LIGHTS']);
    const boxes = [];
    names.forEach(name => {
      const label = document.createElement('label');
      label.className = 'p4-fuse';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = name;
      const span = document.createElement('span');
      span.textContent = name;
      label.appendChild(cb);
      label.appendChild(span);
      gameScreen.appendChild(label);
      boxes.push(cb);
    });

    const feedback = addText('', 'p4-feedback');
    addButton('Pull the switches', () => {
      const chosen = boxes.filter(b => b.checked).map(b => b.value);
      if (chosen.length !== 2) {
        feedback.textContent = 'Exactly two. No more, no fewer.';
        return;
      }
      resolveFuses(chosen);
    });
  }

  function resolveFuses(chosen) {
    const hasCam = chosen.includes('CAM-PORT');
    const hasLights = chosen.includes('DECK LIGHTS');
    const extra = {
      'CAM-STBD': { heat: 1, text: 'The starboard camera dies too, which does nothing for you.' },
      'GALLEY': { heat: 1, text: 'Pans crash in the galley, loud enough to wake the dead.' },
      'HEATERS': { heat: 1, text: 'The heaters die and the cold floods in like water.' },
      'NAV': { heat: 2, text: 'Somewhere above you an alarm chirps once, and is quickly silenced.' }
    };

    const lines = [];
    let penalty = 0;

    if (hasCam && hasLights) {
      penalty -= 1;
      lines.push('Click, click. The cameras on that side die and the deck falls into blue-black darkness. For the first time all night, the ship is on your side.');
    } else if (hasCam) {
      lines.push('The camera dies, but the work lights still blaze. You will have to move fast.');
    } else {
      penalty += 2;
      lines.push('A red light blinks on a camera dome, and it turns slowly toward you.');
    }

    chosen.forEach(name => {
      if (extra[name]) {
        penalty += extra[name].heat;
        lines.push(extra[name].text);
      }
    });

    addHeat(penalty);
    if (hasCam) setFlags({ camerasOff: true });
    showResult(lines, sceneDeck);
  }

  // =====================================================================
  //  SCENE 8: The deck (this or that: which marks do you follow?)
  // =====================================================================
  function sceneDeck() {
    clearScreen();
    addText('THE DECK', 'location-tag');
    addParagraphs([
      'Out on deck, the wind is a wall. The lifeboat cradle swings empty, creaking. Whoever launched it did it fast.',
      'Two sets of marks lead away from the gangway and out onto the ice. One is a pair of wide drag marks, like a sled. The other is a single line of boot prints, deep at the heel.',
      state.flags.trustPilot
        ? 'You remember what the pilot said about one of his passengers: that he walked like his boots were on the wrong feet.'
        : null
    ]);

    addChoices([
      {
        label: 'Follow the sled marks.',
        run: () => {
          addHeat(2);
          setFlags({ followedSled: true });
          showResult([
            'The marks end at an empty sled, lashed with crates of supplies. Nothing in them but food and fuel.',
            'When you look back, a figure stands at the ship\'s rail, watching you, patient as a clock.'
          ], sceneChaseIntro);
        }
      },
      {
        label: 'Follow the boot prints.',
        run: () => {
          addHeat(-1);
          setFlags({ followedPrints: true });
          addInfo('The boot prints on the ice are crooked, toes turned in, barely lifted from the snow.');
          showResult([
            'The prints are crooked and dragging, toes turned in, the steps of someone barely lifting their feet. Someone being walked, not someone walking.',
            'They lead straight out across the ice, toward a ridge of black rock.'
          ], sceneChaseIntro);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 9: The chase (click once to jump, twice to drop)
  // =====================================================================
  function chaseWindowMs() {
    return Math.max(MIN_WINDOW_MS, Math.min(BASE_WINDOW_MS, BASE_WINDOW_MS - state.heat * 140));
  }

  function chaseObstacleCount() {
    const f = state.flags;
    let n = 9;
    if (f.broadcast) n += 1;
    if (f.alerted) n += 1;
    if (f.crewAlerted) n += 2;
    if (f.helper) n -= 2;
    return Math.max(6, Math.min(14, n));
  }

  function buildSequence(n) {
    const seq = [];
    for (let i = 0; i < n; i++) {
      let t = Math.random() < 0.5 ? 'crack' : 'ledge';
      const l = seq.length;
      if (l >= 2 && seq[l - 1] === seq[l - 2] && seq[l - 1] === t) {
        t = t === 'crack' ? 'ledge' : 'crack';
      }
      seq.push(t);
    }
    return seq;
  }

  function sceneChaseIntro() {
    clearScreen();
    addText('THE ICE', 'location-tag');
    addParagraphs([
      'Behind you, a door slams. A shape peels away from the ship\'s shadow and starts to run.',
      'The ice ahead is cracked and uneven. You have only a few seconds for each obstacle.',
      'Click once to JUMP. Click twice to DROP. You can survive three slips. A fourth, and he has you.'
    ]);
    addButton('Run!', startChase);
  }

  function startChase() {
    clearScreen();

    const windowMs = chaseWindowMs();
    const seq = buildSequence(chaseObstacleCount());
    let index = 0;
    let slips = 0;
    let awaiting = false;
    let clickCount = 0;
    let clickTimer = null;
    let timeoutId = null;
    let deadline = 0;
    let current = null;
    let over = false;
    let lastFail = null; // 'crack' or 'ledge': the obstacle you failed most recently

    // ----- Build the stage -----
    const hud = document.createElement('div');
    hud.className = 'p4-hud';
    const slipsEl = document.createElement('span');
    const promptEl = document.createElement('span');
    promptEl.className = 'p4-prompt';
    hud.appendChild(slipsEl);
    hud.appendChild(promptEl);

    const stage = document.createElement('div');
    stage.className = 'p4-chase';
    stage.innerHTML = `
      <div class="p4-ground"></div>
      <div class="p4-figure p4-shadow-fig running" id="p4-chaser">${shadowSVG()}</div>
      <div class="p4-figure running" id="p4-runner">${playerSVG()}</div>
      <div class="p4-obstacle" id="p4-obstacle"></div>
    `;

    const timer = document.createElement('div');
    timer.className = 'p4-timer';
    const timerFill = document.createElement('div');
    timerFill.className = 'p4-timer-fill';
    timer.appendChild(timerFill);

    const hint = document.createElement('p');
    hint.className = 'p4-hint';
    hint.textContent = 'Click (or press Space) once to jump, twice to drop.';

    gameScreen.appendChild(hud);
    gameScreen.appendChild(stage);
    gameScreen.appendChild(timer);
    gameScreen.appendChild(hint);

    const runner = stage.querySelector('#p4-runner');
    const chaser = stage.querySelector('#p4-chaser');
    const obstacle = stage.querySelector('#p4-obstacle');

    function renderSlips() {
      slipsEl.textContent = `Slips: ${slips}/${MAX_MISTAKES}`;
    }

    function pulseClass(el, cls, ms) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    }

    // ----- Input: one click = jump, two clicks = drop -----
    function onInput() {
      if (over || !awaiting) return;
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => resolve(1), DOUBLE_CLICK_MS);
      } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        resolve(2);
      }
    }

    function onPointer(e) {
      // Opening the info panel should not count as a jump
      if (e.target && e.target.closest && e.target.closest('#info-button, #info-panel')) return;
      onInput();
    }
    function onKey(e) {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onInput();
      }
    }

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);

    function stopListening() {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    }

    // ----- Obstacles -----
    function nextObstacle() {
      if (over) return;
      if (slips > MAX_MISTAKES) return caught();
      if (index >= seq.length) return finish();

      const type = seq[index++];
      current = { type, need: type === 'crack' ? 1 : 2 };

      obstacle.className = 'p4-obstacle ' + type;
      obstacle.style.transition = 'none';
      obstacle.style.left = '105%';
      void obstacle.offsetWidth;
      obstacle.style.transition = `left ${windowMs}ms linear`;
      obstacle.style.left = '20%';

      timerFill.style.transition = 'none';
      timerFill.style.width = '100%';
      void timerFill.offsetWidth;
      timerFill.style.transition = `width ${windowMs}ms linear`;
      timerFill.style.width = '0%';

      promptEl.textContent = type === 'crack' ? 'JUMP!  (click once)' : 'DROP!  (click twice)';
      promptEl.classList.remove('warn');

      clickCount = 0;
      awaiting = true;
      deadline = performance.now() + windowMs;
      timeoutId = setTimeout(() => resolve('late'), windowMs);
    }

    function resolve(action) {
      if (!awaiting) return;
      awaiting = false;
      clearTimeout(timeoutId);
      clearTimeout(clickTimer);

      const ok = action === current.need;
      const remaining = Math.max(0, deadline - performance.now());
      const wait = action === 'late' ? 0 : Math.max(0, remaining - 250);

      setTimeout(() => {
        if (over) return;
        if (ok) {
          pulseClass(runner, current.type === 'crack' ? 'p4-jump' : 'p4-drop', 640);
        } else {
          slips++;
          lastFail = current.type;
          renderSlips();
          pulseClass(runner, 'p4-stumble', 620);
          promptEl.textContent = action === 'late' ? 'TOO SLOW!' : 'WRONG MOVE!';
          promptEl.classList.add('warn');
          // He closes in a little with every slip
          chaser.style.left = (4 + slips * 5) + '%';
        }
        setTimeout(nextObstacle, 700);
      }, wait);
    }

    function caught() {
      over = true;
      stopListening();
      promptEl.textContent = 'HE HAS YOU.';
      promptEl.classList.add('warn');
      chaser.style.left = '19%';
      saveProgress({ chaseFailed: true, slips, failedObstacle: lastFail });
      setTimeout(() => fadeAndGo(ENDING_URL), 800);
    }

    function finish() {
      over = true;
      stopListening();
      promptEl.textContent = '';
      saveProgress({ chaseCompleted: true, slips });
      setTimeout(runCutscene, 600);
    }

    renderSlips();
    setTimeout(nextObstacle, 900);
  }

  // =====================================================================
  //  CUTSCENE: you trip, hit a rock, and everything goes dark
  // =====================================================================
  function runCutscene() {
    if (prefersReducedMotion()) {
      fadeAndGo(NEXT_PART_URL);
      return;
    }

    const cut = document.createElement('div');
    cut.className = 'p4-cut';
    cut.innerHTML = `
      <div class="p4-cut-ground"></div>
      <div class="p4-rock"></div>
      <div class="p4-figure p4-shadow-fig p4-cut-shadow running">${shadowSVG()}</div>
      <div class="p4-figure p4-cut-player">${playerSVG()}</div>
      <div class="p4-cut-flash"></div>
      <div class="p4-cut-black"></div>
    `;
    document.body.appendChild(cut);

    const player = cut.querySelector('.p4-cut-player');
    const rock = cut.querySelector('.p4-rock');
    const shadow = cut.querySelector('.p4-cut-shadow');
    const flash = cut.querySelector('.p4-cut-flash');
    const black = cut.querySelector('.p4-cut-black');

    function at(ms, fn) { setTimeout(fn, ms); }

    requestAnimationFrame(() => cut.classList.add('visible'));

    // Start running toward a big rock lying across the ice
    at(700, () => {
      const targetLeft = window.innerWidth * 0.34;
      const pr = player.getBoundingClientRect();
      // Place the rock where the character's head will land when he falls forward
      rock.style.left = (targetLeft + pr.width / 2 + pr.height * 0.88) + 'px';
      player.classList.add('running');
      player.style.left = targetLeft + 'px';
    });

    // Foot catches, he drops to the floor
    at(3150, () => {
      player.classList.remove('running');
      player.classList.add('trip');
    });

    // Face meets rock
    at(3750, () => {
      flash.classList.add('go');
      cut.classList.add('shake');
      player.classList.add('knocked');
      player.classList.add('rebound');
    });

    // The shadow closes in while he lies there
    at(5000, () => {
      shadow.classList.add('show');
    });

    // Fade to black, then the next part begins
    at(6300, () => {
      black.classList.add('on');
    });

    at(9200, () => {
      window.location.href = NEXT_PART_URL;
    });
  }

  // ---------- Go ----------
  startChapter();
})();
