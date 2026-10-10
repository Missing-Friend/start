(() => {
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Config ----------
  const P5_KEY = 'missing_part5';       // read: results saved by part 5
  const SAVE_KEY = 'missing_part6';     // write: results for the endings and credits
  const GOOD_URL = 'goodending.html';   // the lever
  const BAD_URL = 'badending.html';     // you trusted Josh

  const SAFE_CODE = '714';              // CHARTER 714
  const RADIO_TARGET = 71.4;            // where the dial has to be

  // ---------- Load part 5 results ----------
  function loadPart5() {
    try {
      const raw = localStorage.getItem(P5_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Storage can be blocked or empty. Fall back to defaults below.
    }
    return null;
  }

  const p5 = loadPart5() || { flags: {}, info: [] };

  const state = {
    flags: Object.assign({}, p5.flags || {}),
    clues: new Set() // every clue you find that points at the truth
  };
  const gatheredInfo = Array.isArray(p5.info) ? p5.info.slice() : [];

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

  // A clue goes in the info panel and counts toward how much you suspect
  function addClue(id, text) {
    state.clues.add(id);
    addInfo(text);
  }

  // ---------- Helpers ----------
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

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

  // Choices appear in a random order: [{ label, run }]
  function addChoices(list) {
    shuffle(list).forEach(c => addButton(c.label, c.run));
  }

  function showResult(text, next, label) {
    clearScreen();
    addParagraphs(text);
    addButton(label || 'Continue', next);
  }

  function addInput(placeholder, onSubmit, opts) {
    const options = opts || {};
    const row = document.createElement('div');
    row.className = 'p6-input-row';
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
        flags: state.flags,
        clues: Array.from(state.clues),
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

  // Look at a few things from a list. You cannot look at all of them.
  // cfg: { tag, intro, budget, prompt(remaining), items, onDone, moreLabel, doneLabel }
  // item: { id, label, text, apply() }  or  { id, label, run(after) } for a mini-game
  function pickSome(cfg) {
    let remaining = cfg.budget;
    const used = new Set();
    const order = shuffle(cfg.items);

    function render() {
      clearScreen();
      if (cfg.tag) addText(cfg.tag, 'location-tag');
      addParagraphs(cfg.intro);
      addText(cfg.prompt(remaining));
      order.filter(i => !used.has(i.id)).forEach(item => {
        addButton(item.label, () => choose(item));
      });
    }

    function choose(item) {
      used.add(item.id);
      remaining--;
      const after = () => {
        if (remaining > 0 && order.some(i => !used.has(i.id))) render();
        else cfg.onDone();
      };
      if (item.apply) item.apply();
      if (item.run) {
        item.run(after);
        return;
      }
      clearScreen();
      addParagraphs(item.text);
      addButton(
        remaining > 0 ? (cfg.moreLabel || 'Keep looking') : (cfg.doneLabel || 'Move on'),
        after
      );
    }

    render();
  }

  // =====================================================================
  //  SCENE 1: Out of the vent (changes with how part 5 ended)
  // =====================================================================
  function startChapter() {
    renderInfo();
    clearScreen();
    const f = state.flags;

    addText('PART 6: THE LAST HOUR', 'location-tag');

    if (f.decoy) {
      addParagraphs([
        'You wait in the dark with your back to the wall, counting your own heartbeats, until the bolt slides back.',
        'It is not the man. It is the young crewman, cap pulled low, a finger pressed to his lips.',
        f.helper
          ? '"I told you I would draw them off," he whispers. "Josh is out. He\'s waiting. Come on, quick."'
          : '"Josh is out," he whispers. "He\'s waiting for you. Come on, quick."',
        'He leads you through a maintenance corridor to a steel door. Behind it, Josh is waiting, and when he sees you, his whole face breaks.'
      ]);
    } else if (f.ambushed) {
      addParagraphs([
        'The man lies where he fell: a dark coat, a hood pulled down over his face, one arm flung out. He is breathing.',
        'Josh crouches over him and binds his wrists with a zip tie, fast and neat, like he has done it before. "He\'ll be out for hours," Josh says. "Come on."',
        'You do not pull the hood back. There is not time.'
      ]);
    } else {
      addParagraphs([
        'You and Josh come out of the vent into a maintenance shaft barely wider than a coffin. He does not hesitate at the first turn, or the second.',
        '"This way," he whispers. "Stay close."'
      ]);
    }

    addParagraphs([
      'He turns and hugs you hard, and you hold on just as hard. "You came," he says into your shoulder. "I told them you would."'
    ]);

    addChoices([
      {
        label: 'Look at Josh\'s wrists.',
        run: () => {
          addClue('wrists', 'Josh\'s wrists had only a thin red line from the ties, as neat as a bracelet.');
          showResult([
            'A thin red line circles each wrist, neat as a bracelet. If someone had hung from a pipe for days, it would be so much worse.',
            'Josh tugs his sleeves down. "It\'s nothing," he says, and smiles.'
          ], sceneHall);
        }
      },
      {
        label: 'Keep moving.',
        run: () => {
          showResult([
            'You do not look. You do not ask. Josh nods, like that was exactly the right answer.'
          ], sceneHall);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 2: The lower hall (look at three of five doors)
  // =====================================================================
  function sceneHall() {
    pickSome({
      tag: 'THE LOWER HALL',
      intro: [
        'A lower hall with five doors, each stenciled in white: LOCKERS. RADIO. COLD ROOM. LAUNDRY. MESS.',
        '"We can\'t stay here," Josh whispers. "The lifeboat is two decks up. Look if you must, but be quick."'
      ],
      budget: 3,
      prompt: (n) => `You have time to look through ${n} more door${n === 1 ? '' : 's'}.`,
      items: [
        {
          id: 'lockers',
          label: 'LOCKERS',
          text: [
            'Rows of grey lockers. One door hangs open. Inside: a canvas flight jacket with a patched elbow, a pilot\'s cap, and a headset with a tag that reads CHARTER 714.',
            'It is not a crew coat. It belongs to someone who flies.'
          ],
          apply: () => {
            setFlags({ code714: true });
            addClue('jacket', 'Lockers: a patched canvas flight jacket and a pilot\'s headset tagged CHARTER 714.');
          }
        },
        {
          id: 'radio',
          label: 'RADIO',
          run: (after) => sceneTune(after)
        },
        {
          id: 'cold',
          label: 'COLD ROOM',
          text: [
            'A heavy insulated door with a padlock, frost furring the handle. The compressor behind it strains like a held breath.',
            'Someone has turned the dial far colder than any food would need: minus thirty. Around the padlock\'s shackle is a scrap of cord, tied in a clumsy double knot.',
            'You know that knot.'
          ],
          apply: () => {
            addClue('cold', 'Cold room: a padlocked freezer set far colder than food needs, with a double knot on the lock.');
          }
        },
        {
          id: 'laundry',
          label: 'LAUNDRY',
          text: [
            'A canvas bag stamped INCINERATE. Inside, folded neatly, like they belong to people who are not coming back: a black T-shirt, a pink cardigan, a pair of jeans, and two pairs of glasses. One case is pink.'
          ],
          apply: () => {
            addClue('belongings', 'Laundry: a black T-shirt, a pink cardigan, jeans and two pairs of glasses were bagged to be burned.');
          }
        },
        {
          id: 'mess',
          label: 'MESS',
          text: [
            'A whiteboard duty roster. Under FLIGHT, in blue marker: "CHARTER 714. Back by dusk. Takes the visitor."',
            'Someone has underlined "the visitor" twice.'
          ],
          apply: () => {
            setFlags({ code714: true });
            addClue('roster', 'Mess hall roster: CHARTER 714 would take "the visitor". Underlined twice.');
          }
        }
      ],
      onDone: sceneSafe
    });
  }

  // The radio: tune the dial until the static clears
  function sceneTune(done) {
    clearScreen();
    addText('THE RADIO ROOM', 'location-tag');
    addParagraphs([
      'A cramped room of dials and cold coffee. A recorder light blinks red. Somebody left it running.',
      'Turn the dial until the static clears.'
    ]);

    const message =
      'CHARTER SEVEN-ONE-FOUR TO BASE. THE PACKAGE IS ABOARD.\n' +
      '- DOES HE SUSPECT?\n' +
      '- HE BELIEVES EVERY WORD. HE CAME STRAIGHT TO US.';

    const display = document.createElement('div');
    display.className = 'p6-static';
    const signal = document.createElement('div');
    signal.className = 'p6-signal';
    const fill = document.createElement('div');
    fill.className = 'p6-signal-fill';
    signal.appendChild(fill);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.step = '0.1';
    slider.value = '18';
    slider.className = 'p6-tuner';

    gameScreen.appendChild(display);
    gameScreen.appendChild(signal);
    gameScreen.appendChild(slider);

    const junk = '#%&*?/\\xX!+';
    function garble(str, noise) {
      return str.split('').map(ch => {
        if (ch === ' ' || ch === '\n' || Math.random() > noise) return ch;
        return junk[Math.floor(Math.random() * junk.length)];
      }).join('');
    }

    let locked = false;
    const timer = setInterval(() => {
      if (locked) return;
      const dist = Math.abs(parseFloat(slider.value) - RADIO_TARGET);
      const noise = Math.min(1, dist / 18);
      fill.style.width = ((1 - noise) * 100) + '%';

      if (dist <= 1.2) {
        locked = true;
        clearInterval(timer);
        slider.disabled = true;
        fill.style.width = '100%';
        display.textContent = message;
        setFlags({ code714: true });
        addClue('radio', 'Radio recording: CHARTER 714 said "the package is aboard". "He believes every word. He came straight to us."');
        addButton('Switch it off', done);
        return;
      }

      display.textContent = garble(message, noise);
    }, 130);
  }

  // =====================================================================
  //  SCENE 3: The manifest safe (type the code)
  // =====================================================================
  function sceneSafe() {
    let attempts = 0;

    clearScreen();
    addText('THE MANIFEST SAFE', 'location-tag');
    addParagraphs([
      'At the end of the hall, a steel safe is bolted to the wall: the ship\'s manifest cabinet. Three digits.',
      state.flags.code714 ? 'You remember the call sign: CHARTER 714.' : 'You have no idea what the code could be.',
      '"Try anything," Josh says, much too quickly. "Birthdays. Whatever."'
    ]);
    const feedback = addText('', 'p6-feedback');

    addInput('3 digits', (value) => {
      attempts++;
      if (value === SAFE_CODE) {
        openSafe(false);
        return;
      }
      if (attempts >= 3) {
        openSafe(true);
        return;
      }
      feedback.textContent = 'The lock does not move.';
    }, { maxLength: 3, numeric: true, button: 'Try it' });
  }

  function openSafe(joshDidIt) {
    const lines = [];

    if (joshDidIt) {
      addClue('knewcode', 'Josh typed the safe code without hesitating: 714.');
      lines.push(
        'Josh steps past you, types three digits without looking at the keypad, and the door clunks open. Seven. One. Four.',
        'He catches your look and shrugs. "I heard them say it. When they brought me in."'
      );
    } else {
      lines.push('The lock clunks and the door swings open. Josh does not look surprised. He looks relieved.');
    }

    lines.push(
      'Inside: a ship\'s manifest, and beneath it, a black notebook.',
      'The manifest has one name not yet crossed out: "J." The booking was made thirty days ago. The return trip is booked for the day after he "disappeared".'
    );
    addClue('manifest', 'Manifest: Josh booked passage on this ship thirty days before he disappeared.');

    showResult(lines, sceneNotebook, 'Open the notebook');
  }

  // =====================================================================
  //  SCENE 4: The notebook (decode two names, then put a plan in order)
  // =====================================================================
  function sceneNotebook() {
    clearScreen();
    addText('THE NOTEBOOK', 'location-tag');
    addParagraphs([
      'The handwriting is small and slanted. You have seen that slant before, on a scrap of paper that said "Listen first."',
      'Most of the page is in words. Two lines are in numbers, with a code key printed in the margin.'
    ]);

    const nb = document.createElement('div');
    nb.className = 'p6-notebook';
    [
      ['p6-nb-head', 'NOTEBOOK'],
      [null, 'ship booked'],
      [null, 'the night before:  14 1 20 5  /  1 12 9 25 1 8   DONE'],
      [null, 'the park. the walk. he has to see it.'],
      [null, 'that night: the video. use his name.'],
      [null, 'two days on: the pilot flies him south']
    ].forEach(([cls, text]) => {
      const line = document.createElement('div');
      if (cls) line.className = cls;
      line.textContent = text;
      nb.appendChild(line);
    });
    gameScreen.appendChild(nb);

    const key = document.createElement('div');
    key.className = 'p6-keystrip';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = `${ch}=${i + 1}`;
      key.appendChild(s);
    });
    gameScreen.appendChild(key);

    const words = [
      { nums: '14  1  20  5', answer: 'NATE' },
      { nums: '1  12  9  25  1  8', answer: 'ALIYAH' }
    ];
    let idx = 0;

    const prompt = addText(`First name: ${words[0].nums}`);
    const feedback = addText('', 'p6-feedback');

    addInput('Who is it?', (value, input) => {
      const answer = value.toUpperCase().replace(/[^A-Z]/g, '');
      if (answer !== words[idx].answer) {
        feedback.textContent = 'That is not it. Match each number to a letter.';
        return;
      }

      idx++;
      input.value = '';
      feedback.textContent = '';

      if (idx < words.length) {
        prompt.textContent = `Second name: ${words[idx].nums}`;
        return;
      }

      addClue('names', 'Notebook: the names NATE and ALIYAH are written beside the word DONE.');
      showResult([
        'Nate. Aliyah.',
        'The two friends who told you Josh had been acting strange. The two who said he was talking about a secret place. You never saw them again after that.',
        'DONE.'
      ], sceneTimeline, 'Look at the rest of the page');
    }, { maxLength: 14, button: 'Decode' });
  }

  function sceneTimeline() {
    const events = [
      'The ship is booked.',
      'Two names are marked done.',
      'The walk in the park.',
      'The video is posted.',
      'A pilot flies someone south.'
    ];
    let picked = [];

    clearScreen();
    addText('THE PLAN', 'location-tag');
    addParagraphs([
      'The rest of the notebook is a schedule, but the day numbers are smudged and the lines are jumbled.',
      'Put the plan in the order it happened. Click each step in turn.'
    ]);

    const list = document.createElement('ol');
    list.className = 'p6-order';
    gameScreen.appendChild(list);
    const feedback = addText('', 'p6-feedback');

    const buttons = [];
    shuffle(events.map((text, i) => ({ text, i }))).forEach(card => {
      const btn = addButton(card.text, () => {
        if (picked.includes(card.i)) return;
        picked.push(card.i);
        btn.disabled = true;
        const li = document.createElement('li');
        li.textContent = card.text;
        list.appendChild(li);

        if (picked.length === events.length) check();
      });
      buttons.push(btn);
    });

    function check() {
      const ok = picked.every((v, i) => v === i);
      if (ok) {
        addClue('plan', 'Notebook plan: ship booked a month out, two names marked done the night before the park walk, a video that night, a pilot flying "him" south two days later.');
        showResult([
          'You lay the pieces end to end, and they make a shape you do not want to look at.',
          'A plan. Thirty days long. And every piece of it falls on someone who was there.'
        ], scenePhone);
        return;
      }
      feedback.textContent = 'That is not how it happened. Something doesn\'t fit. Start again.';
      picked = [];
      list.innerHTML = '';
      buttons.forEach(b => { b.disabled = false; });
    }
  }

  // =====================================================================
  //  SCENE 5: Josh's phone (take it or wave it off)
  // =====================================================================
  function scenePhone() {
    clearScreen();
    addText('THE PHONE', 'location-tag');
    addParagraphs([
      'Josh has been watching you read. When you close the notebook, he holds out his phone with a shaky smile.',
      '"No signal," he says. "But the photos still work. If you want to remember what we\'re going home to."',
      'His hand is trembling. You cannot tell whether it is fear or something else.'
    ]);

    addChoices([
      {
        label: 'Take the phone.',
        run: () => {
          setFlags({ tookPhone: true });
          addClue('phone', 'Josh still has his phone, with every message on it. Captives do not keep their phones.');
          showResult([
            'It is warm from his pocket. A phone he was allowed to keep. A phone that still has a full battery after days in a cell.',
            'You open the messages.'
          ], phoneMessages);
        }
      },
      {
        label: 'Wave it off.',
        run: () => {
          setFlags({ wavedPhone: true });
          showResult([
            'You shake your head and he lets out a breath he did not know he was holding. Something in his shoulders unclenches as he slides the phone away.',
            'You tell yourself it was just relief.'
          ], sceneRoute);
        }
      }
    ]);
  }

  function phoneMessages() {
    pickSome({
      tag: 'THE PHONE',
      intro: [
        'A group chat of three names, and a lot of unread messages. You can only read a few before Josh will notice.'
      ],
      budget: 3,
      prompt: (n) => `You have time to read ${n} more.`,
      moreLabel: 'Read another',
      doneLabel: 'Hand it back',
      items: [
        {
          id: 'photo',
          label: 'The lock screen photo',
          text: [
            'Three people crammed into a selfie in the park: Josh in the middle, a guy in a black T-shirt and glasses on one side, a girl in a pink shirt and glasses on the other.',
            'You know them. Nate and Aliyah, the two who told you Josh had been acting strange.'
          ],
          apply: () => addClue('friends', 'Nate and Aliyah, Josh\'s two friends, are the ones who told you he was acting strange.')
        },
        {
          id: 'aliyah1',
          label: 'Aliyah, three days before',
          text: ['"Josh, why is there a ship booking on your laptop? What are you planning?"'],
          apply: () => addClue('aliyah1', 'Aliyah to Josh: "Why is there a ship booking on your laptop? What are you planning?"')
        },
        {
          id: 'nate1',
          label: 'Nate, two days before',
          text: ['"We found the notebook. We\'re telling someone tomorrow. Please don\'t make us."'],
          apply: () => addClue('nate1', 'Nate to Josh: "We found the notebook. We\'re telling someone tomorrow."')
        },
        {
          id: 'josh1',
          label: 'Josh\'s reply',
          text: ['"Wait. Let me explain first. The dock, tomorrow night. Just us."'],
          apply: () => addClue('josh1', 'Josh to Nate and Aliyah: "Let me explain first. The dock, tomorrow night. Just us."')
        },
        {
          id: 'aliyah2',
          label: 'Aliyah, the night before the park',
          text: ['"We\'re at the dock. Where are you?"'],
          apply: () => addClue('aliyah2', 'Aliyah, that night: "We\'re at the dock. Where are you?"')
        },
        {
          id: 'calls',
          label: 'The missed calls',
          text: [
            'Fourteen missed calls from Aliyah. The last is at 11:58 p.m., the night before the walk in the park.',
            'Then nothing. Not one more call, from either of them, ever again.'
          ],
          apply: () => addClue('calls', 'Fourteen missed calls from Aliyah, the last one the night before the park. Then nothing.')
        }
      ],
      onDone: () => {
        showResult([
          'A hand closes over yours and takes the phone away. "That\'s enough," Josh says gently.',
          'He is smiling. The smile has a seam in it.'
        ], sceneRoute);
      }
    });
  }

  // =====================================================================
  //  SCENE 6: The way up (loud and quick or slow and quiet)
  // =====================================================================
  function sceneRoute() {
    clearScreen();
    addText('THE WAY UP', 'location-tag');
    addParagraphs([
      'There are two ways up to the lifeboat deck. The cargo lift at the end of the hall, fast and loud. Or the service stairs behind it, slow and quiet.',
      '"Decide," Josh says. "Please."'
    ]);

    addChoices([
      {
        label: 'The cargo lift.',
        run: () => {
          setFlags({ tookLift: true });
          showResult([
            'The lift groans like a dying animal the whole way up. Josh winces.',
            '"Quiet," he mutters, and for the first time, he sounds annoyed instead of afraid.'
          ], sceneCrewman);
        }
      },
      {
        label: 'The service stairs.',
        run: () => {
          showResult([
            'Four flights of cold iron, slow and silent. Josh sighs. "We don\'t have time for this," he whispers, but he follows.',
            'You get to the top with your breathing steady and your hands very still.'
          ], sceneCrewman);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 7: The crewman (he can only be questioned a little)
  // =====================================================================
  function sceneCrewman() {
    const f = state.flags;
    let budget = 2;
    if (f.helper) budget += 1;
    if (f.tookLift) budget -= 1;
    if (f.crewAlerted) budget -= 1;
    budget = Math.max(1, Math.min(3, budget));

    const items = [
      {
        id: 'voice',
        label: 'Who are you, really?',
        text: [
          '"Just crew," he says. "Nobody special."',
          f.trustPilot
            ? 'Then, almost to himself: "Nobody has any business out here right now, you know."'
            : 'Then, almost to himself: "Colleagues. Funny word, isn\'t it?"',
          'You have heard those words before. Over the engine noise of a small plane, with the ice sliding by beneath you.'
        ],
        apply: () => addClue('voice', 'The crewman repeated a line only the pilot who flew you south could have known.')
      },
      state.clues.has('jacket')
        ? {
            id: 'jacket',
            label: 'Whose flight jacket is in the locker?',
            text: [
              '"Mine," he says. "I get cold."',
              'He tugs his sleeve down over his elbow, but not fast enough. You catch the edge of a stitched patch under the crew coat.'
            ],
            apply: () => addClue('patch', 'The crewman has a patch stitched on his elbow, the same as the flight jacket in the locker.')
          }
        : {
            id: 'hands',
            label: 'What did you do before this job?',
            text: [
              '"Odd jobs," he says. "Nothing worth telling."',
              'But his thumbs are callused the way hands get from yokes and throttles, and there is a pale band on his wrist where a pilot\'s watch would sit.'
            ],
            apply: () => addClue('hands', 'The crewman\'s hands are calloused like a pilot\'s, with a pale watch band mark on his wrist.')
          },
      {
        id: 'why',
        label: 'Why are you helping us?',
        text: [
          '"Because he asked me to," the crewman says, and then, a beat too late, "I mean, because it\'s the right thing."',
          f.helper ? 'He glances at you almost warmly. "I told you I\'d draw them off, didn\'t I?"' : null,
          'His eyes flick to Josh. Josh does not look back.'
        ],
        apply: () => addClue('why', 'The crewman said "Because he asked me to" about helping, then corrected himself.')
      },
      {
        id: 'where',
        label: 'Where is the man who took Josh?',
        text: [
          '"Ashore," the crewman says. "Hours ago."',
          'But you heard the men through the cell door. He checks on Josh at the horn. He was here, on this ship, minutes ago.',
          'The crewman\'s eyes flick to Josh for half a second before he answers.'
        ],
        apply: () => addClue('where', 'The crewman said the kidnapper left the ship hours ago, but he was heard on board minutes before. He glanced at Josh before answering.')
      }
    ];

    pickSome({
      tag: 'THE CREWMAN',
      intro: [
        'The young crewman is waiting at the top, cap pulled low.',
        f.ambushed ? 'A fresh bandage is taped over his temple. You tell yourself it\'s from something else.' : null,
        '"There you are," he says. "I was looking everywhere. We have to hurry."',
        'You have time to ask him a little. Not everything.'
      ],
      budget,
      prompt: (n) => `You can ask ${n} more question${n === 1 ? '' : 's'}.`,
      moreLabel: 'Ask something else',
      doneLabel: 'Follow them',
      items,
      onDone: sceneEavesdrop
    });
  }

  // =====================================================================
  //  SCENE 8: Eavesdropping (where you hide changes what you hear)
  // =====================================================================
  function sceneEavesdrop() {
    clearScreen();
    addText('THE HOLD DOOR', 'location-tag');
    addParagraphs([
      '"Wait here," Josh whispers. "I\'ll check the lifeboat." The crewman nods. "I\'ll watch the stairs."',
      'They head into the hold together, and the door swings almost closed behind them. Their voices drop to a murmur.',
      'You creep to the doorway. Inside, beyond the crack, is a cavern of crates and cold. You need somewhere to hide before you can hear anything.'
    ]);

    addChoices([
      {
        label: 'Behind the stacked crates.',
        run: () => {
          addClue('eaves', 'Overheard in the hold: "He believes every word." "And the other two?" "Cold. They\'ll keep." "He has to tell the story. Cops believe tears."');
          showResult([
            'You slip between two crates, close enough to smell the oil on the chains. Josh\'s voice comes clear.',
            '"He\'s following every step like a good boy."',
            '"And the other two?" the crewman asks.',
            '"Quiet. Cold. They\'ll keep until we are gone."',
            '"Tell me again why not just--"',
            '"Because he has to tell the story," Josh says. "A man took me. He\'ll swear to it, with tears. Cops believe tears."'
          ], sceneHold);
        }
      },
      {
        label: 'Inside the empty lifeboat locker.',
        run: () => {
          addClue('eavesPart', 'Overheard through a locker door: "...cold. They\'ll keep..." and "...he\'ll swear to it, with tears."');
          showResult([
            'The locker smells of rubber and rust. You pull the door nearly shut. The voices come muffled, in pieces.',
            '"...cold. They\'ll keep..."',
            '"...he\'ll swear to it. With tears..."',
            'It is not enough to know what it means. It is more than enough to know it is bad.'
          ], sceneHold);
        }
      },
      {
        label: 'Behind the door itself.',
        run: () => {
          showResult([
            'You press yourself flat behind the swinging door. The voices are a low murmur, and you catch almost nothing.',
            'But you catch one sound clearly: Josh laughing. Not the laugh you have heard in the park a hundred times. A different one, easy and light.',
            'It does not match the fear on his face when you see him again.'
          ], sceneHold);
        }
      }
    ]);
  }

  // =====================================================================
  //  SCENE 9: The hold (look at two of three things)
  // =====================================================================
  function sceneHold() {
    pickSome({
      tag: 'THE HOLD',
      intro: [
        'The hold is a cavern of steel and crates, lit by a few swinging caged bulbs. In the center stands a heavy steel table, and above it, on a chain, hangs an enormous wooden crate, as big as a car, swaying slightly with the ship.',
        'On the wall to your left is a rusted lever, stenciled CARGO RELEASE. Josh and the crewman are out of sight for a moment, behind the crates at the far end.',
        'You have a few seconds to look at something.'
      ],
      budget: 2,
      prompt: (n) => `You have time to look at ${n} more thing${n === 1 ? '' : 's'}.`,
      moreLabel: 'Look at something else',
      doneLabel: 'They are coming back',
      items: [
        {
          id: 'lever',
          label: 'The rusted lever',
          text: [
            'A rusted lever on the wall, stenciled CARGO RELEASE. A chain runs from it, through a pulley, and across the ceiling to the crate hanging over the table.',
            'The paint around the lever is scratched, like it has been tested recently. It is a very heavy crate.'
          ],
          apply: () => {
            setFlags({ noticedLever: true });
            addClue('lever', 'Hold: a lever marked CARGO RELEASE is chained to the huge crate hanging over the table.');
          }
        },
        {
          id: 'crate',
          label: 'The hanging crate',
          text: [
            'The crate hangs from the ceiling directly over the table. The chain creaks every time the ship rolls. It must weigh as much as a small car.',
            'Anyone who stood under it would not be standing for long if the chain let go.'
          ],
          apply: () => {
            setFlags({ noticedCrate: true });
            addInfo('Hold: a car-sized crate hangs on a chain directly over the steel table.');
          }
        },
        {
          id: 'table',
          label: 'The steel table',
          text: [
            'Laid out on the table, folded neatly like a costume: a long black coat, a hood, and a pair of black gloves.',
            'You have seen that coat. You have seen the shape that wore it, in the dark, behind you, every time you ran.',
            'It is not a man\'s size. It is Josh\'s.'
          ],
          apply: () => addClue('coat', 'On the table: the long black coat and hood worn by the shape that chased you. It is Josh\'s size.')
        }
      ],
      onDone: sceneFinal
    });
  }

  // =====================================================================
  //  SCENE 10: The truth, and the last choice
  // =====================================================================
  function sceneFinal() {
    const f = state.flags;
    const sus = state.clues.size;

    const reaction =
      sus >= 9
        ? 'You are not surprised. The pieces have been falling into place for an hour, and now the last one clicks, and you only feel tired.'
        : sus >= 5
          ? 'Part of you has been bracing for this since the cold room door. It does not hurt any less.'
          : 'It lands like a punch. Your mouth opens, and nothing comes out.';

    const lines = [
      'Josh and the crewman are waiting beside the table, under the enormous crate. Josh\'s face does the thing it does when he is trying not to cry.',
      '"There you are," he says.',
      'The crewman pulls off his cap, then the crew coat. Underneath is a canvas jacket with a patched elbow. He rubs his jaw, and the tired, patient face of the pilot comes back into focus.',
      f.trustPilot
        ? '"Nobody has any business being out here right now," he says, in the voice from the cockpit. "I told you that, didn\'t I? I told you exactly where to look."'
        : '"Colleagues," he says, in the voice from the cockpit. "That\'s what you told me. I almost laughed."',
      f.helper ? 'He looks at you with something that is almost regret. "I did say I would help you. I just never said who."' : null,
      f.ambushed ? 'A dark bruise is spreading across his temple where your wrench landed. He touches it, wry. "You hit hard."' : null,
      reaction,
      '"There was never a man who followed me home, Philip," Josh says quietly. "There was only me. I needed someone to tell the story. Someone who loved me enough to cross the world and swear he saw a stranger take me."',
      f.wavedPhone ? 'His voice is soft, warm, almost the voice from the park. "You trusted me before. You trusted me all the way here."' : null,
      f.tookPhone ? 'His smile has finally slipped, and what is under it is flat and tired. "You looked. Of course you looked."' : null,
      f.noticedLever
        ? 'Behind you, against the wall, is the rusted lever you noticed, and above Josh\'s head, the crate on its chain.'
        : 'Behind you, the wall is only a stride away.',
      'Josh holds out his arms. "It is not too late. Come here, Philip. Trust me. One last time."'
    ];

    clearScreen();
    addText('THE LAST CHOICE', 'location-tag');
    addParagraphs(lines);

    addChoices([
      {
        label: 'Step toward Josh.',
        run: () => {
          saveProgress({ finalChoice: 'josh', suspicion: sus });
          showResult([
            'You take a step toward him. He smiles, so grateful it almost looks real.',
            '"Thank you," Josh says, and opens his arms wider.'
          ], () => fadeAndGo(BAD_URL));
        }
      },
      {
        label: 'Step toward the wall.',
        run: () => {
          saveProgress({ finalChoice: 'wall', suspicion: sus });
          showResult([
            'You do not decide. Your legs decide for you.',
            'You run.'
          ], () => fadeAndGo(GOOD_URL));
        }
      }
    ]);
  }

  // ---------- Go ----------
  startChapter();
})();
