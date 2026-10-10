(() => {
  const gameScreen = document.getElementById('game-screen');
  const currentCharacter = document.getElementById('current-character');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Config ----------
  const START_DISTANCE = 2;          // how far from Josh you begin
  const MAX_DISTANCE = 6;            // reach this and the trail is lost for good
  const ENDING_URL = 'ending1.html'; // sent here if you get too far from Josh
  const NEXT_PART_URL = 'part4.html';// sent here after the last question
  const SHOW_TRAIL = true;           // set to false to hide the "Trail:" status
  const SAVE_KEY = 'missing_part3';  // localStorage key so part 4 can read your results

  // ---------- Game state ----------
  const state = {
    distance: START_DISTANCE,
    flags: {}
  };
  const gatheredInfo = [];

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

  function trailLabel() {
    const labels = ['Right behind him', 'Close', 'Warm', 'Cooling', 'Cold', 'Almost lost'];
    return labels[Math.min(state.distance, labels.length - 1)];
  }

  function renderTrail() {
    currentCharacter.innerHTML = '';
    if (!SHOW_TRAIL) return;
    const span = document.createElement('span');
    span.className = 'trail-status';
    span.textContent = `Trail: ${trailLabel()}`;
    currentCharacter.appendChild(span);
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        distance: state.distance,
        flags: state.flags,
        info: gatheredInfo
      }));
    } catch (e) {
      // Storage can be blocked (private mode, etc). The game still works without it.
    }
  }

  function fadeAndGo(url) {
    saveProgress();
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: black; opacity: 0; transition: opacity 2s;
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 50);
    setTimeout(() => { window.location.href = url; }, 2050);
  }

  // ---------- Scene engine ----------
  // Each scene has: tag, text(state) -> string or array, choices[].
  // Each choice has: label, resolve(state) -> { distance, text, flags, info, next }.
  // distance: negative = closer to Josh, positive = further away.
  // next: id of the next scene, or 'END' after the last question of this part.

  function showScene(id) {
    const scene = scenes[id];
    clearScreen();
    renderTrail();
    if (scene.tag) addText(scene.tag, 'location-tag');
    addParagraphs(scene.text(state));
    addText('What do you do?');
    scene.choices.forEach(choice => {
      addButton(choice.label, () => resolveChoice(choice));
    });
  }

  function resolveChoice(choice) {
    const result = choice.resolve(state);

    state.distance = Math.max(0, Math.min(MAX_DISTANCE, state.distance + (result.distance || 0)));
    if (result.flags) Object.assign(state.flags, result.flags);
    if (result.info) addInfo(result.info);
    saveProgress();

    clearScreen();
    renderTrail();
    addParagraphs(result.text);

    // Too far from Josh: the trail is lost
    if (state.distance >= MAX_DISTANCE) {
      addText('You have gone too far in the wrong direction. The trail is gone, and so is any chance of reaching Josh in time.');
      addButton('Continue', () => fadeAndGo(ENDING_URL));
      return;
    }

    if (result.next === 'END') {
      addButton('Continue', () => fadeAndGo(NEXT_PART_URL));
    } else {
      addButton('Continue', () => showScene(result.next));
    }
  }

  // ---------- The story ----------
  const scenes = {

    // 1. The flight: trusting the pilot gives you clues for later
    pilot: {
      tag: 'THE FLIGHT SOUTH',
      text: () => [
        'The only pilot willing to fly to those coordinates this time of year is a tired man in a patched jacket. Halfway across the ice, he finally asks the question you knew was coming: "What\'s out there for you?"'
      ],
      choices: [
        {
          label: 'Tell him the truth: your friend is missing and this is where he pointed you.',
          resolve: () => ({
            distance: -1,
            flags: { trustPilot: true },
            text: [
              'He is quiet for a long moment. Then he tells you he flew two men to the old survey camp two days ago.',
              '"The younger one kept stumbling," he says. "He dropped little orange flags in the snow when he thought nobody was watching. And there\'s a ship in the bay with a red stripe on the hull, lit up like Christmas. Nobody has any business being out here right now."'
            ],
            info: [
              'The pilot flew two men to the survey camp two days ago. One could barely walk.',
              'Josh dropped orange flags in the snow along the way.',
              'A ship with a red stripe on its hull is anchored in the bay, with every light on.'
            ],
            next: 'drop'
          })
        },
        {
          label: 'Tell him you\'re a researcher and leave it at that.',
          resolve: () => ({
            distance: 1,
            flags: { lied: true },
            text: [
              '"Sure you are," he says, and doesn\'t say another word for the rest of the flight.',
              'He knows something. You can feel it. But you\'ve given him no reason to share it.'
            ],
            info: 'The pilot seemed to know something, but you did not earn his trust.',
            next: 'drop'
          })
        }
      ]
    },

    // 2. The drop point: orange flags vs. snowmobile tracks
    drop: {
      tag: 'THE DROP POINT',
      text: (s) => [
        'The plane is gone within minutes. The wind is brutal and the ice goes on forever. You check the coordinates twice. This is the spot.',
        'Two trails lead away from the landing strip. One is a set of fresh snowmobile tracks, clean and deep, heading toward the cliffs. The other is a faint line of small orange flags half buried in the snow, running along the ridge. Around the nearest flag, someone has tied a strip of cloth with a ridiculous double knot, the way Josh ties everything.',
        s.flags.trustPilot ? 'The pilot\'s words come back to you. Orange flags, dropped when nobody was watching.' : 'You have nothing to go on except what you can see.'
      ],
      choices: [
        {
          label: 'Follow the orange flags along the ridge.',
          resolve: () => ({
            distance: -1,
            flags: { followedFlags: true },
            text: [
              'You find the next flag, then the next. Every one is knotted with the same double knot. Josh is leading you somewhere.',
              'After an hour of walking into the wind, a small hut appears out of the white.'
            ],
            info: 'Josh marked the way with orange flags, each one tied with his double knot.',
            next: 'hut'
          })
        },
        {
          label: 'Follow the fresh snowmobile tracks toward the cliffs.',
          resolve: () => ({
            distance: 1,
            flags: { lostTime: true },
            text: [
              'The tracks are clean and easy to follow, and that should have been your first warning.',
              'They end at an abandoned snowmobile with an empty tank, parked at the edge of the cliffs. No one is here. No one has been here for a while.'
            ],
            next: 'detourTracks'
          })
        }
      ]
    },

    // Detour: wrong choice at the drop point
    detourTracks: {
      tag: 'THE DEAD END',
      text: () => [
        'You are cold, you are tired, and you have wasted hours. When you look back the way you came, you catch a glint of orange far along the ridge. The flags. You walked right past them.'
      ],
      choices: [
        {
          label: 'Go back and pick up the orange flags.',
          resolve: () => ({
            distance: -1,
            flags: { followedFlags: true },
            text: [
              'It costs you time you don\'t have, but you find the flags again. The double knots are there, one after another. Josh was here.',
              'A small hut appears out of the white, and you push toward it.'
            ],
            info: 'Josh marked the way with orange flags, each one tied with his double knot.',
            next: 'hut'
          })
        },
        {
          label: 'Search the snowmobile and keep going past the cliffs.',
          resolve: () => ({
            distance: 2,
            text: [
              'The snowmobile is stripped of anything useful. You push on past the cliffs for hours until the ice stops making sense.',
              'You turn back too late. Eventually you stumble onto the ridge, and the flags, and a small hut, but your phone is nearly dead and your hands are numb.'
            ],
            next: 'hut'
          })
        }
      ]
    },

    // 3. The hut: using the radio the wrong way tips off the man
    hut: {
      tag: 'THE SURVEY HUT',
      text: () => [
        'The hut is cold and dark, but someone has been here recently. A handheld radio sits on the desk. Taped to its back is a scrap of paper in Josh\'s handwriting: "Philip. Don\'t use the main channel. He listens."',
        'Below the note, scratched into the casing with a key, is the number 7.'
      ],
      choices: [
        {
          label: 'Call out on the main emergency channel and hope someone answers.',
          resolve: () => ({
            distance: 2,
            flags: { broadcast: true },
            text: [
              'Static. Then, very faintly, a click: someone on the other end picking up. They don\'t answer. They just listen.',
              'You switch the radio off, but it\'s too late. Somebody knows you are here.'
            ],
            info: 'You used the main radio channel. Someone heard you.',
            next: 'map'
          })
        },
        {
          label: 'Tune the radio to the channel Josh scratched into the casing.',
          resolve: () => ({
            distance: -1,
            flags: { radioClue: true },
            text: [
              'Channel 7 is silent for a moment. Then a recording crackles through. It is Josh, rushed and low.',
              '"If you\'re hearing this, you listened. Good. There are two places on the map, but only one is real. I\'m going where the light doesn\'t turn off."',
              'The message loops once and goes quiet.'
            ],
            info: 'Josh\'s radio message: "Two places on the map. Only one is real. I\'m going where the light doesn\'t turn off."',
            next: 'map'
          })
        }
      ]
    },

    // 4. The map: the right pick depends on what you learned earlier
    map: {
      tag: 'THE MAP ON THE WALL',
      text: (s) => {
        const lines = [
          'A map of the coast is pinned above the desk, with two places circled in red marker. North Cove, the ruins of an old whaling station, is circled once with a question mark beside it. A spot out in the bay marked "vessel" is circled twice, so hard the pen tore the paper.'
        ];
        if (s.flags.radioClue) lines.push('"Where the light doesn\'t turn off." Josh\'s words echo in your head.');
        if (s.flags.trustPilot) lines.push('You remember the pilot talking about a ship in the bay, lit up all night.');
        if (!s.flags.radioClue && !s.flags.trustPilot) lines.push('You have nothing but the map to go on.');
        return lines;
      },
      choices: [
        {
          label: 'Head for the vessel out in the bay.',
          resolve: (s) => {
            const certain = s.flags.radioClue && s.flags.trustPilot;
            return {
              distance: certain ? -2 : -1,
              text: certain
                ? [
                    'Everything lines up: the pilot\'s warning, Josh\'s message, the twice-torn circle. You are certain.',
                    'You pull on your gloves and head for the shore with purpose.'
                  ]
                : [
                    'It is a guess, but the pen tearing through the paper feels like Josh shouting.',
                    'You head down toward the shore.'
                  ],
              info: 'Josh circled the vessel in the bay twice.',
              next: 'shore'
            };
          }
        },
        {
          label: 'Head for North Cove and the old whaling station.',
          resolve: () => ({
            distance: 1,
            text: [
              'The ruins are hours away along the coast. When you arrive, the station is a shell of rusted iron and drifted snow.'
            ],
            next: 'detourCove'
          })
        }
      ]
    },

    // Detour: wrong choice at the map
    detourCove: {
      tag: 'NORTH COVE',
      text: () => [
        'Frost has eaten the walls. The only sign anyone has been here is a pair of boot prints leading to the water\'s edge, where they stop, as if whoever made them stepped onto a boat.',
        'Far out in the bay, lights burn that never flicker off. At the back of the station is a locked storeroom.'
      ],
      choices: [
        {
          label: 'Walk to the water\'s edge and watch the lights across the bay.',
          resolve: () => ({
            distance: -1,
            text: [
              'A ship sits at anchor with a red stripe along its hull and every deck lit. Josh\'s words come back to you: where the light doesn\'t turn off.',
              'You were wrong about North Cove, but there is still time.'
            ],
            info: 'The ship in the bay has a red stripe and every light on.',
            next: 'shore'
          })
        },
        {
          label: 'Break into the locked storeroom at the back of the station.',
          resolve: () => ({
            distance: 2,
            flags: { lostTime: true },
            text: [
              'It takes hours with a rusted bar. When the door finally gives, there is nothing inside but empty crates and frozen rope.',
              'By the time you step outside, you spot the lights across the bay and curse yourself for not looking sooner.'
            ],
            next: 'shore'
          })
        }
      ]
    },

    // 5. The shoreline: your earlier radio call comes back to haunt you
    shore: {
      tag: 'THE SHORELINE',
      text: (s) => [
        'At the water\'s edge, a small inflatable boat is tied to a rotting dock. A ship with a red stripe sits at anchor a few hundred meters out.',
        s.flags.broadcast
          ? 'A spotlight on the ship\'s deck sweeps the water in slow arcs. Whoever heard your radio call is watching for you.'
          : 'The ship is lit up from bow to stern, but nobody seems to be on deck.',
        'You can paddle across in the dark with the oars, silent but slow, or start the outboard and be there in minutes.'
      ],
      choices: [
        {
          label: 'Paddle across with the oars.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 0 : -1,
            flags: { quiet: true },
            text: s.flags.broadcast
              ? [
                  'You duck behind an ice floe every time the spotlight sweeps near. It is slow and your arms burn, but the light never finds you.'
                ]
              : [
                  'The water is black and silent. Nobody on the ship notices a thing.'
                ],
            next: 'ship'
          })
        },
        {
          label: 'Start the outboard and race across.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 3 : 2,
            flags: { alerted: true },
            text: s.flags.broadcast
              ? [
                  'A shout carries over the water. The spotlight locks onto you and the ship\'s engines rumble to life.',
                  'By the time you scramble up its side, the entire crew is awake and waiting.'
                ]
              : [
                  'The engine echoes across the bay. Nobody shouts, but lights come on one by one along the deck.',
                  'Whoever is aboard knows someone is coming.'
                ],
            next: 'ship'
          })
        }
      ]
    },

    // 6. Boarding the ship: look for Josh's marker
    ship: {
      tag: 'THE SHIP',
      text: () => [
        'Up close, the ship is enormous and streaked with rust. There are two ways aboard. A rope ladder hangs off the stern, in plain view of a camera dome. Lower down, near the waterline, is a cargo hatch, and a strip of cloth tied with a double knot hangs from its latch.'
      ],
      choices: [
        {
          label: 'Climb the rope ladder at the stern.',
          resolve: () => ({
            distance: 1,
            flags: { seenOnDeck: true },
            text: [
              'The camera dome swings toward you. You make it over the rail before anyone comes, but you leave wet footprints across the deck.',
              'Somewhere below, a quiet alarm clicks on.'
            ],
            next: 'hold'
          })
        },
        {
          label: 'Slip through the cargo hatch with the knotted cloth.',
          resolve: () => ({
            distance: -1,
            flags: { hatch: true },
            text: [
              'The latch gives easily, as if someone unlocked it for you.',
              'Inside, the air smells of oil and cold metal. You pull the hatch shut behind you. Nobody saw you come aboard.'
            ],
            info: 'Josh unlocked the cargo hatch and left a knotted cloth as a marker.',
            next: 'hold'
          })
        }
      ]
    },

    // 7. Below deck: listen for Josh
    hold: {
      tag: 'BELOW DECK',
      text: (s) => [
        'The hold is a maze of crates and dim emergency lights. Two corridors split off ahead. From the left comes the murmur of voices and the smell of cigarette smoke. From the right comes a faint, irregular tapping against metal. Tap, tap-tap, tap.',
        'You know that rhythm. It is the beat Josh drums on every table he sits at.',
        s.flags.seenOnDeck ? 'Somewhere above you, boots are moving fast.' : null
      ],
      choices: [
        {
          label: 'Follow the tapping.',
          resolve: () => ({
            distance: -1,
            flags: { followedTapping: true },
            text: [
              'The tapping guides you through the dark. Whoever is making it does not give up. Every few seconds it starts again, patient and deliberate.'
            ],
            info: 'Someone is tapping Josh\'s drumming rhythm on the metal below deck.',
            next: 'corridor'
          })
        },
        {
          label: 'Follow the voices. Someone there must know something.',
          resolve: () => ({
            distance: 2,
            flags: { spotted: true },
            text: [
              'You creep close enough to hear two men arguing about a schedule and "the package". Then one of them turns and sees you in the gap between the crates.',
              'You run. You lose them eventually, but you lose a lot of ground doing it.'
            ],
            next: 'corridor'
          })
        }
      ]
    },

    // 8. The corridor: hiding spots
    corridor: {
      tag: 'THE CORRIDOR',
      text: (s) => [
        'Footsteps are coming down the corridor. A crewman is walking slowly, checking every door. You have a few seconds. Next to you is a supply locker with its door hanging open. A little farther on is a narrow gap behind a cluster of pipes.',
        s.flags.broadcast ? 'He does not walk like a man on routine patrol. He walks like a man who was told to expect someone.' : null
      ],
      choices: [
        {
          label: 'Hide in the supply locker.',
          resolve: () => ({
            distance: 2,
            text: [
              'It is the first place he looks. The door swings open and you shove past him and run.',
              'You get away, but now he is shouting for backup, and Josh is getting further away.'
            ],
            next: 'door'
          })
        },
        {
          label: 'Squeeze into the gap behind the pipes.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 0 : -1,
            text: s.flags.broadcast
              ? [
                  'You hold your breath until your lungs ache. He stops inches away, runs his light up and down the wall, and finally, finally moves on.'
                ]
              : [
                  'You press yourself against the cold metal. He walks right past, humming, and never looks your way.'
                ],
            next: 'door'
          })
        }
      ]
    },

    // 9. The locked door: lost time makes this harder
    door: {
      tag: 'THE LOCKED DOOR',
      text: (s) => [
        'At the end of the corridor is a steel door with a blacked-out window. The tapping is coming from somewhere nearby. The door is locked. You have a hairpin in your pocket, and a fire axe hangs on the wall behind you.',
        s.flags.lostTime ? 'You cannot stop thinking about the hours you wasted. Every second counts now.' : null
      ],
      choices: [
        {
          label: 'Pick the lock with the hairpin.',
          resolve: (s) => ({
            distance: s.flags.lostTime ? 0 : -1,
            text: s.flags.lostTime
              ? [
                  'Your hands shake from the cold and it takes far too long, but the lock finally clicks. You get the door open with only seconds to spare.'
                ]
              : [
                  'The lock gives with a soft click. Slowly and carefully, you ease the door open.'
                ],
            next: 'note'
          })
        },
        {
          label: 'Smash the door open with the axe.',
          resolve: () => ({
            distance: 2,
            flags: { alerted: true },
            text: [
              'The sound is like a gunshot. The door gives, but the whole ship hears it, and lights start coming on.'
            ],
            next: 'note'
          })
        }
      ]
    },

    // 10. Final question of part 3: the tapping is the clue
    note: {
      tag: 'THE EMPTY ROOM',
      text: (s) => [
        'The room is empty. A chair, a bucket, and a blanket that is still warm. Josh has been moved, and recently.',
        'Scratched into the paint with something small and sharp are two arrows and two words in his handwriting. Up: "helipad". Down: "engine room". Below them: "He needs me alive. For now."',
        'Through the ceiling you hear a heavy thump-thump-thump, rotors spinning up. And then, faint and far below your feet, the tapping starts again.',
        s.flags.alerted ? 'Boots thunder in the corridor behind you. You have seconds.' : null
      ],
      choices: [
        {
          label: 'Race up to the helipad before the helicopter takes off.',
          resolve: () => ({
            distance: 2,
            flags: { chasedHelicopter: true },
            text: [
              'You burst onto the deck into the freezing wind as the helicopter lifts off into the dark. Josh is not on it. You can see that now, when it is too late.',
              'Behind you, the ship\'s crew spills onto the deck.'
            ],
            next: 'END'
          })
        },
        {
          label: 'Follow the tapping down toward the engine room.',
          resolve: () => ({
            distance: -1,
            flags: { foundEngineRoomPath: true },
            text: [
              'The tapping gets louder as you descend. For the first time, you can almost hear what Josh is trying to tell you.',
              'The helicopter was a decoy. This is where he is.'
            ],
            info: 'The helicopter was a decoy. Josh is being kept below, near the engine room.',
            next: 'END'
          })
        }
      ]
    }
  };

  // ---------- Start ----------
  function startChapter() {
    renderInfo();
    renderTrail();
    clearScreen();
    addText('PART 3: THE TRAIL SOUTH', 'location-tag');
    addText('Josh\'s video is still open on your screen. Your name is the title, and a set of coordinates is the message. He knew the man who followed him home was not going to stop, so he made sure you would know where to start.');
    addText('From here on, every choice either brings you closer to Josh or carries you further away from him. Go too far in the wrong direction and the trail goes cold for good.');
    addInfo('Josh\'s GoTube video, titled "Philip", gave the coordinates 72°00\'36.0"S 168°34\'40.0"E.');
    addButton('Head south', () => showScene('pilot'));
  }

  startChapter();
})();
