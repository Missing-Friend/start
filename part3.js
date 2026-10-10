(() => {
  const gameScreen = document.getElementById('game-screen');
  const currentCharacter = document.getElementById('current-character');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Config ----------
  const START_DISTANCE = 3;          // how far from Josh you begin
  const MAX_DISTANCE = 6;            // reach this and the trail is lost for good
  const ENDING_URL = 'ending1.html'; // sent here if you get too far from Josh
  const NEXT_PART_URL = 'part4.html';// sent here after the last question
  const SHOW_TRAIL = false;          // true shows a "Trail:" hint under the title (much easier)
  const SAVE_KEY = 'missing_part3';  // localStorage key so part 4 can read your result

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

  // Choices appear in a random order so the answer is never in the same spot
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
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
    shuffle(scene.choices).forEach(choice => {
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
      addText('Somewhere along the way, the trail stopped being a trail. You can feel it. There is nothing left to follow, and you are not alone out here.');
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

    // 1. The flight
    pilot: {
      tag: 'THE FLIGHT SOUTH',
      text: () => [
        'The only pilot willing to fly to those coordinates this late in the season is a tired man in a patched jacket. Somewhere over the ice, he asks without looking at you: "Family? Or business?"'
      ],
      choices: [
        {
          label: 'Tell him about Josh.',
          resolve: () => ({
            distance: -1,
            flags: { trustPilot: true },
            text: [
              'He doesn\'t answer right away. When he does, he talks to the windshield.',
              '"Two passengers, three days back. One of them walked like his boots were on the wrong feet. The other never looked at him once." He adjusts a dial that doesn\'t need adjusting. "There\'s a vessel out in the bay that hasn\'t gone dark since."'
            ],
            info: [
              'The pilot flew two passengers to the coast three days ago. One walked strangely.',
              'A vessel in the bay has had its lights on ever since.'
            ],
            next: 'drop'
          })
        },
        {
          label: 'Say you\'re meeting colleagues.',
          resolve: () => ({
            distance: 1,
            flags: { lied: true },
            text: [
              '"Colleagues," he repeats, like he\'s tasting the word. He says nothing else until the landing strip appears.'
            ],
            next: 'drop'
          })
        }
      ]
    },

    // 2. The drop point
    drop: {
      tag: 'THE DROP POINT',
      text: (s) => [
        'The plane is gone within minutes. Wind. White. You check the coordinates twice, then a third time.',
        'A line of snowmobile tracks cuts toward a dark shape on the cliffs, deep and recent. To the south, a row of orange markers pokes out of the snow along the ridge, spaced too evenly to be weather. Around one of the stakes, a strip of cloth is knotted. It could be anything.',
        s.flags.trustPilot ? 'You think about the two passengers, and about whether one of them might have wanted to leave something behind.' : null
      ],
      choices: [
        {
          label: 'Follow the markers along the ridge.',
          resolve: () => ({
            distance: -1,
            flags: { followedFlags: true },
            text: [
              'The cloth is knotted again at the next stake. And the next. Always the same clumsy double knot, as if whoever tied them was in a hurry and didn\'t trust a single loop.',
              'After an hour, a hut appears out of the white.'
            ],
            info: 'Orange markers run along the ridge, each with a strip of knotted cloth.',
            next: 'hut'
          })
        },
        {
          label: 'Follow the tracks toward the dark shape on the cliffs.',
          resolve: () => ({
            distance: 1,
            flags: { lostTime: true },
            text: [
              'The shape on the cliffs is an abandoned supply depot, half buried in drift. The tracks end at a snowmobile with an empty tank.',
              'No one has been here for a while.'
            ],
            next: 'detourTracks'
          })
        }
      ]
    },

    // Detour: wrong choice at the drop point
    detourTracks: {
      tag: 'THE DEPOT',
      text: () => [
        'Inside: empty shelves, a dead stove, a calendar from two winters ago. Through a cracked window you can see the ridge, a long way off, and a thin orange line along it that you passed on the way here.',
        'The light is already starting to go.'
      ],
      choices: [
        {
          label: 'Search the rest of the depot.',
          resolve: () => ({
            distance: 2,
            text: [
              'Under the floorboards: rust and a mouse nest. By the time you come out, the light is gone and the wind has erased your own footprints.',
              'You find the ridge again by luck, and a hut by accident.'
            ],
            next: 'hut'
          })
        },
        {
          label: 'Head back toward the ridge while there is still light.',
          resolve: () => ({
            distance: -1,
            flags: { followedFlags: true },
            text: [
              'You retrace your steps in the fading light. The orange line is where you left it, knotted cloth and all.',
              'A hut takes shape in the white.'
            ],
            info: 'Orange markers run along the ridge, each with a strip of knotted cloth.',
            next: 'hut'
          })
        }
      ]
    },

    // 3. The hut
    hut: {
      tag: 'THE SURVEY HUT',
      text: () => [
        'The hut is cold, and the cold is wrong somehow. Not old cold. A kettle on the stove is still faintly warm.',
        'A handheld radio sits on the desk, its dial set to 1. A laminated card beside it reads EMERGENCY, CH. 1. On the back of the casing, scratched with a key, is the number 7. Under the radio, a scrap of paper in handwriting you know: "Listen first."'
      ],
      choices: [
        {
          label: 'Use the emergency channel.',
          resolve: () => ({
            distance: 2,
            flags: { broadcast: true },
            text: [
              'Static, then a click. Someone on the other end picks up. They don\'t speak. You can hear breathing, calm and unhurried, and then the line goes dead.',
              'You tell yourself it was nothing.'
            ],
            info: 'Someone answered the emergency channel and said nothing.',
            next: 'map'
          })
        },
        {
          label: 'Use the channel scratched into the casing.',
          resolve: () => ({
            distance: -1,
            flags: { radioClue: true },
            text: [
              'Channel 7 hisses, then a recording starts. Josh, low and fast: "Two places on the map. Only one is real. Go where the light doesn\'t blink."',
              'It loops once and stops.'
            ],
            info: 'Josh\'s recording: "Two places on the map. Only one is real. Go where the light doesn\'t blink."',
            next: 'map'
          })
        }
      ]
    },

    // 4. The map
    map: {
      tag: 'THE MAP ON THE WALL',
      text: (s) => {
        const lines = [
          'A coastline map is pinned over the desk. Two places are marked in red. North Cove has a small lighthouse symbol beside it, circled neatly. A spot out in the bay, labeled "vessel", has an X through it and a question mark.'
        ];
        if (s.flags.radioClue) lines.push('"Go where the light doesn\'t blink."');
        if (s.flags.trustPilot) lines.push('"A vessel out in the bay that hasn\'t gone dark since."');
        if (!s.flags.radioClue && !s.flags.trustPilot) lines.push('That is all the map gives you.');
        return lines;
      },
      choices: [
        {
          label: 'The vessel in the bay.',
          resolve: (s) => {
            const sure = s.flags.radioClue && s.flags.trustPilot;
            return {
              distance: sure ? -2 : -1,
              text: sure
                ? ['Two different people, two different warnings, one light. You stop doubting.']
                : ['You are not sure. You go anyway.'],
              info: 'The map marks a vessel in the bay with an X and a question mark.',
              next: 'coast'
            };
          }
        },
        {
          label: 'North Cove.',
          resolve: () => ({
            distance: 1,
            text: [
              'North Cove is hours down the coast. A beacon on its tower blinks, patient and steady, every few seconds.'
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
        'The old whaling station is a rusted shell. At its edge a beacon tower blinks on and off, on and off. Past the breakwater, far out in the bay, there is another light. It does not blink at all.'
      ],
      choices: [
        {
          label: 'Climb the beacon tower for a better look.',
          resolve: () => ({
            distance: -1,
            text: [
              'From the top you can see everything: the coast, the bay, and a vessel with every deck lit, steady as a held breath.'
            ],
            info: 'From the beacon tower: a vessel in the bay with unblinking lights.',
            next: 'coast'
          })
        },
        {
          label: 'Search the station buildings.',
          resolve: () => ({
            distance: 2,
            flags: { lostTime: true },
            text: [
              'Frozen rooms, collapsed beams, a fish-processing floor. You find nothing, and the hours go like they were never yours.',
              'When you step outside, the far-off light is the only thing you can think about.'
            ],
            next: 'coast'
          })
        }
      ]
    },

    // 5. The coast
    coast: {
      tag: 'THE COAST',
      text: (s) => [
        'Between you and the shore is a long stretch of headland. A packed trail winds along it. Across the frozen inlet, a straight line leads almost to the water, shorter by half.',
        s.flags.followedFlags
          ? 'At the edge of the trail, half buried, there is another orange marker. You scan the ice. There are none out there.'
          : 'Nothing here tells you which way is safe.'
      ],
      choices: [
        {
          label: 'Take the trail along the headland.',
          resolve: () => ({
            distance: -1,
            text: [
              'It is a long walk and your legs know it. The shore comes up slowly, and then all at once.'
            ],
            next: 'shore'
          })
        },
        {
          label: 'Cross the frozen inlet.',
          resolve: () => ({
            distance: 2,
            flags: { lostTime: true },
            text: [
              'The ice talks under you, a low groan that you feel in your teeth. You make it across, but not before a section gives way and you drag yourself out soaked.',
              'You lose hours to a fire you should never have needed.'
            ],
            next: 'shore'
          })
        }
      ]
    },

    // 6. The shoreline
    shore: {
      tag: 'THE SHORELINE',
      text: (s) => [
        'A small inflatable is tied to a rotting dock. A ship sits a few hundred meters out, every deck lit. The oars are cracked. The outboard has fuel.',
        s.flags.broadcast ? 'A spotlight sweeps the water in slow arcs, as if it knows someone is out here.' : null
      ],
      choices: [
        {
          label: 'Take the oars.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 0 : -1,
            text: s.flags.broadcast
              ? ['You duck behind every ice floe the spotlight slides toward. It takes forever, and your arms are on fire, but the light never finds you.']
              : ['The water is black and nothing on the ship stirs. The only sound is the creak of the oars.'],
            next: 'ship'
          })
        },
        {
          label: 'Take the outboard.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 3 : 2,
            flags: { alerted: true },
            text: s.flags.broadcast
              ? [
                  'A shout carries over the water. The spotlight locks onto you and the ship\'s engines grumble to life.',
                  'By the time you reach the hull, someone is already waiting.'
                ]
              : [
                  'The motor echoes across the bay like a drumroll. Nobody shouts, but lights come on one by one along the deck.'
                ],
            next: 'ship'
          })
        }
      ]
    },

    // 7. The ship
    ship: {
      tag: 'THE SHIP',
      text: () => [
        'Up close, the ship is a cliff of rust. A rope ladder hangs from the stern, in the eye of a camera dome. Lower down, near the waterline, a cargo hatch sits slightly ajar. Something pale is caught on the latch. It could be anything.'
      ],
      choices: [
        {
          label: 'The rope ladder.',
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
          label: 'The cargo hatch.',
          resolve: () => ({
            distance: -1,
            text: [
              'The pale thing is a strip of cloth, tied in a clumsy double knot. The latch has been left unlocked.',
              'Inside, the air smells of oil and cold metal. You pull the hatch shut behind you.'
            ],
            info: 'A knotted strip of cloth marked the unlocked cargo hatch.',
            next: 'hold'
          })
        }
      ]
    },

    // 8. Below deck
    hold: {
      tag: 'BELOW DECK',
      text: (s) => [
        'The hold is a maze of crates and dim emergency lights. To your left, two voices murmur over the clink of a mug. "Check on him again." "He\'s not going anywhere." To your right, from far off, there is a faint tapping against metal. Tap, tap-tap, tap.',
        s.flags.seenOnDeck ? 'Boots overhead, moving fast.' : null
      ],
      choices: [
        {
          label: 'Follow the voices.',
          resolve: () => ({
            distance: 2,
            flags: { spotted: true },
            text: [
              'You get close enough to see a doorway, a lamp, the back of a man\'s head. Then someone sees you.',
              'You run, and keep running, and when you finally stop you have no idea where you are.'
            ],
            next: 'corridor'
          })
        },
        {
          label: 'Follow the tapping.',
          resolve: () => ({
            distance: -1,
            flags: { followedTapping: true },
            text: [
              'The tapping stops when you get close and starts again when you turn away. Whoever is making it is listening for you.'
            ],
            info: 'Tapping from below deck in a pattern: tap, tap-tap, tap.',
            next: 'corridor'
          })
        }
      ]
    },

    // 9. The corridor
    corridor: {
      tag: 'THE CORRIDOR',
      text: (s) => [
        'Footsteps. A crewman, walking slowly, checking each door in turn. Beside you is a supply locker with a latch on the inside, deep enough to stand in. A little farther along is a gap behind a bundle of scalding pipes, barely wide enough for a person.',
        s.flags.broadcast ? 'He doesn\'t walk like it\'s routine. He walks like someone who was told to expect company.' : null
      ],
      choices: [
        {
          label: 'The locker.',
          resolve: () => ({
            distance: 2,
            text: [
              'The latch is on the inside, but that doesn\'t matter when he opens the door himself. You shove past him and run, and you hear him shout.'
            ],
            next: 'door'
          })
        },
        {
          label: 'Behind the pipes.',
          resolve: (s) => ({
            distance: s.flags.broadcast ? 0 : -1,
            text: s.flags.broadcast
              ? ['The metal burns through your sleeves. He stops inches away, runs his light up and down the wall, and finally moves on.']
              : ['The metal burns through your sleeves. He walks right past, humming, and never looks your way.'],
            next: 'door'
          })
        }
      ]
    },

    // 10. The door
    door: {
      tag: 'THE LOCKED DOOR',
      text: (s) => [
        'A steel door with a blacked-out window. The frame is old and rotted around the lock. You have a hairpin in your pocket, and a fire axe hangs on the wall behind you.',
        s.flags.lostTime ? 'All those lost hours press on you.' : null
      ],
      choices: [
        {
          label: 'Work the lock.',
          resolve: (s) => ({
            distance: s.flags.lostTime ? 0 : -1,
            text: s.flags.lostTime
              ? ['Your hands shake from the cold and it takes far too long, but the lock finally clicks. You get the door open with seconds to spare.']
              : ['The lock gives with a soft click. Slowly, carefully, you ease the door open.'],
            next: 'note'
          })
        },
        {
          label: 'Use the axe.',
          resolve: () => ({
            distance: 2,
            flags: { alerted: true },
            text: [
              'The sound is like a gunshot. The door gives, but so does the silence, and lights start coming on up and down the ship.'
            ],
            next: 'note'
          })
        }
      ]
    },

    // 11. Final question of part 3
    note: {
      tag: 'THE EMPTY ROOM',
      text: (s) => [
        'The room is empty. A chair, a bucket, a blanket that is still warm. Josh has been moved, and not long ago.',
        'Scratched into the paint at knee height, two arrows and two words. Up: "helipad". Down: "engine room". Beneath them, smaller: "He needs me alive. For now."',
        'Overhead, rotors begin to turn.',
        s.flags.followedTapping ? 'And from somewhere far below your feet, faint, a rhythm: tap, tap-tap, tap.' : null,
        s.flags.alerted ? 'Boots thunder in the corridor behind you. You have seconds.' : null
      ],
      choices: [
        {
          label: 'Go up to the helipad.',
          resolve: () => ({
            distance: 2,
            flags: { chasedHelicopter: true },
            text: [
              'You burst onto the deck as the helicopter lifts into the dark. Josh is not on it. You can see that now, when it is too late.',
              'Behind you, the crew spills out onto the deck.'
            ],
            next: 'END'
          })
        },
        {
          label: 'Go down to the engine room.',
          resolve: () => ({
            distance: -1,
            flags: { foundEngineRoomPath: true },
            text: [
              'Down. The air gets warmer, then hotter, and something heavy hums up through the floor. Whatever is down here, it is close.'
            ],
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
    addText('Josh\'s video is still open on your screen. Your name for a title, a set of coordinates for a message, and nothing else. He knew the man who followed him home was not going to stop.');
    addText('Josh never could sit still. Tabletops, steering wheels, your shoulder. Always drumming, always the same patterns.');
    addText('Choose carefully. Not every wrong turn announces itself.');
    addInfo('Josh\'s GoTube video, titled "Philip", gave the coordinates 72°00\'36.0"S 168°34\'40.0"E.');
    addButton('Head south', () => showScene('pilot'));
  }

  startChapter();
})();
