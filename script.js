(() => {
  // === DOM References ===
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');
  const mapButton = document.getElementById('map-button');

  // === Game State ===
  let currentSceneKey = null;
  let historyStack = [];
  let placesUnlocked = new Set(['Your House']);
  let currentLocation = 'Your House';
  let introducedCharacters = new Set();
  let gatheredInfo = { clues: [], suspects: [], notes: [] };
  let peopleMet = new Set(['Philip']);

  // === Single source of truth: place to scene key mapping ===
  const placeToSceneKey = {
    "Your House": "start",
    "Josh's House": "joshsHouse",
    "Park": "park",
    "Local Police Station": "localpolicestation",
    "Cafe He Visits": "cafehevisits"
  };

  // === Character info (for intros) ===
  const characterInfoMap = {
    'Philip': 'You - The worried friend searching for Josh.',
    'Josh': 'Josh - The missing friend.',
    "Josh's Brother": 'Josh\'s Brother - Knows Josh\'s recent whereabouts.',
    'Nate': 'Nate - Your other friend, seems casual but could know more.',
    'Aliya': 'Aliya - Josh\'s girlfriend, emotional and possibly conflicted.',
    'Homeless Man': 'Homeless Man - Seen near the park, mysterious figure.',
    'David': 'David - Josh\'s online best friend.',
    'Amber': 'Amber - Another online friend of Josh.',
    'Kaylee': 'Kaylee - Josh\'s mother.',
    'Nicholas': 'Nicholas - Josh\'s father.',
    'Lily': 'Lily - Josh\'s sister.',
    'Bri': 'Bri - Josh\'s other sister.'
  };

  // === Scenes Object ===
  const scenes = {
    start: {
      character: 'Philip',
      location: 'Your House',
      text: `It’s a foggy, rainy evening in Arlington. You and your friend Josh just left the park. You ask him to text you when he gets home, but hours pass with no message.`,
      choices: [
        { text: "Check your phone for messages", next: "checkPhone" },
        { text: "Go to Josh's House", next: "joshsHouse" },
        { text: "Go to the Park", next: "park" }
      ],
      onEnter: () => {
        addPlace('Your House');
        addPersonMet('Philip');
      }
    },
    checkPhone: {
      character: 'Philip',
      location: 'Your House',
      text: `Your phone shows no new messages from Josh. You feel uneasy.`,
      choices: [
        { text: "Go to Josh's House", next: "joshsHouse" },
        { text: "Wait a little longer", next: "waitLonger" }
      ]
    },
    waitLonger: {
      character: 'Philip',
      location: 'Your House',
      text: `You wait, but still no word from Josh. The rain keeps falling.`,
      choices: [
        { text: "Go to Josh's House", next: "joshsHouse" }
      ]
    },
    joshsHouse: {
      character: "Josh's Brother",
      location: "Josh's House",
      text: `You arrive at Josh's house. His brother answers the door and says Josh never came home.`,
      choices: [
        { text: "Ask about Josh's friends", next: "askFriends" },
        { text: "Check Josh's social media", next: "checkSocial" },
        { text: "Search Josh's room", next: "searchJoshRoom" }
      ],
      onEnter: () => {
        addPlace("Josh's House");
        addPersonMet("Josh's Brother");
      }
    },
    askFriends: {
      character: "Josh's Brother",
      location: "Josh's House",
      text: `Josh's brother mentions Nate and Aliya. Maybe they know something.`,
      choices: [
        { text: "Look up Nate's last messages", next: "checkNate" },
        { text: "Look up Aliya's posts", next: "checkAliya" },
        { text: "Go back", next: "joshsHouse" }
      ]
    },
    checkSocial: {
      character: 'Philip',
      location: "Josh's House",
      text: `Josh's social media shows a cryptic post from earlier today: "Don't trust anyone."`,
      choices: [
        { text: "Investigate further", next: "investigateFurther" },
        { text: "Go back", next: "joshsHouse" }
      ]
    },
    investigateFurther: {
      character: 'Philip',
      location: "Josh's House",
      text: `You notice some suspicious messages and decide to dig deeper.`,
      choices: [
        { text: "Go back", next: "checkSocial" }
      ]
    },
    checkNate: {
      character: 'Nate',
      location: "Online",
      text: `Nate's last message to Josh was a joke about meeting up tomorrow.`,
      choices: [
        { text: "Go back", next: "askFriends" }
      ]
    },
    checkAliya: {
      character: 'Aliya',
      location: "Online",
      text: `Aliya posted a photo with Josh two days ago.`,
      choices: [
        { text: "Go back", next: "askFriends" }
      ]
    },
    searchJoshRoom: {
      character: 'Philip',
      location: "Josh's House",
      text: `You search Josh's room carefully. You find torn diary pieces under his bed and in his closet.`,
      choices: [
        { text: "Look under the bed", next: "underBed" },
        { text: "Look in the closet", next: "inCloset" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => {
        addClue("Searching Josh's room for diary pieces.");
      }
    },
    underBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `Under the bed, you find several torn pieces of the diary page.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesUnderBed" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => {
        addNote("Found diary pieces under Josh's bed.");
      }
    },
    takePiecesUnderBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from under the bed and put them in your pocket.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => {
        addNote("Collected diary pieces from under the bed.");
      }
    },
    inCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `In the closet, you find more torn diary pieces, hidden behind some clothes.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesInCloset" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => {
        addNote("Found diary pieces in Josh's closet.");
      }
    },
    takePiecesInCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from the closet.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => {
        addNote("Collected diary pieces from the closet.");
      }
    },
    park: {
      character: 'Philip',
      location: 'Park',
      text: `You arrive at the park where you last saw Josh. The fog and rain make everything look eerie.`,
      choices: [
        { text: "Look around the park", next: "lookAroundPark" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => {
        addPlace('Park');
      }
    },
    lookAroundPark: {
      character: 'Philip',
      location: 'Park',
      text: `You find some torn pieces of paper near a bench. Could these be from Josh's diary?`,
      choices: [
        { text: "Collect torn pieces", next: "collectPiecesPark" },
        { text: "Go back", next: "park" }
      ],
      onEnter: () => {
        addClue("Found torn diary pieces at the park.");
      }
    },
    collectPiecesPark: {
      character: 'Philip',
      location: 'Park',
      text: `You collect the torn pieces. They might help you understand what Josh was scared of.`,
      choices: [
        { text: "Go back to Josh's House", next: "joshsHouse" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => {
        addNote("Collected diary pieces from the park.");
        addPlace("Josh's House");
      }
    },
    localpolicestation: {
      character: 'Sergeant Miller',
      location: 'Local Police Station',
      text: `The police station is quiet. Sergeant Miller looks up from his desk. "Can I help you with something?"`,
      choices: [
        { text: "Report Josh missing", next: "fileReport" },
        { text: "Go back", next: "start" }
      ],
      onEnter: () => {
        addPlace("Local Police Station");
        addPersonMet('Sergeant Miller');
      }
    },
    fileReport: {
      character: 'Sergeant Miller',
      location: 'Local Police Station',
      text: `You file a report about Josh's disappearance. Sergeant Miller promises to look into it.`,
      choices: [
        { text: "Go back", next: "localpolicestation" }
      ]
    },
    cafehevisits: {
      character: 'Barista',
      location: 'Cafe He Visits',
      text: `The café is cozy with the smell of fresh coffee. The barista recognizes you. "Josh? He hasn't been in today."`,
      choices: [
        { text: "Ask about regular customers", next: "askRegulars" },
        { text: "Go back", next: "start" }
      ],
      onEnter: () => {
        addPlace("Cafe He Visits");
        addPersonMet('Barista');
      }
    },
    askRegulars: {
      character: 'Barista',
      location: 'Cafe He Visits',
      text: `The barista mentions a few regulars who might know more about Josh's recent behavior.`,
      choices: [
        { text: "Go back", next: "cafehevisits" }
      ]
    }
  };

  // === Utility functions ===

  function addPlace(name) {
    if (!placesUnlocked.has(name)) {
      placesUnlocked.add(name);
      showNewPlaceNotification(name);
    }
  }

  function addPersonMet(name) {
    peopleMet.add(name);
  }

  function addClue(clue) {
    if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue);
  }

  function addNote(note) {
    if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note);
  }

  function showNewPlaceNotification(placeName) {
    const notif = document.createElement('div');
    notif.textContent = `${placeName} has been added to your logbook...`;
    notif.style = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #222;
      color: #afa;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 1.2rem;
      opacity: 0;
      transition: opacity 1s ease;
      z-index: 5000;
      user-select: none;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.style.opacity = '1', 50);
    setTimeout(() => {
      notif.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notif), 1000);
    }, 3500);
  }

  // === Show scene function ===

  function showScene(sceneKey, pushToHistory = true) {
    if (!sceneKey || !scenes[sceneKey]) {
      alert(`Scene "${sceneKey}" not found!`);
      return;
    }
    if (currentSceneKey && currentSceneKey !== sceneKey && pushToHistory) {
      historyStack.push(currentSceneKey);
    }
    currentSceneKey = sceneKey;
    currentLocation = Object.keys(placeToSceneKey).find(place => placeToSceneKey[place] === sceneKey) || currentLocation;

    gameScreen.innerHTML = '';

    showLocationSelector();

    // Character intro
    const scene = scenes[sceneKey];
    if (scene.character) showCharacterIntro(scene.character);
    updateCurrentCharacter(scene.character);

    // Scene text
    const p = document.createElement('p');
    p.textContent = scene.text;
    gameScreen.appendChild(p);

    // Diary button (if scene.diary is true)
    if (scene.diary) {
      const diaryBtn = document.createElement('button');
      diaryBtn.textContent = "Read Josh's Diary";
      diaryBtn.onclick = showDiary;
      gameScreen.appendChild(diaryBtn);
    }

    // Choices buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginTop = '1rem';

    createBackButton();
    if (historyStack.length > 0) {
      buttonsDiv.appendChild(backButton);
    }

    scene.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.onclick = () => showScene(choice.next);
      buttonsDiv.appendChild(btn);
    });
    gameScreen.appendChild(buttonsDiv);

    gameScreen.scrollTop = 0;

    if (scene.onEnter) scene.onEnter();
  }

  // === Location selector ===

  let locationSelector = null;
  function showLocationSelector() {
    if (!locationSelector) {
      locationSelector = document.createElement('div');
      locationSelector.style.margin = '1em 0';
      gameScreen.prepend(locationSelector);
    }
    locationSelector.innerHTML = '';
    placesUnlocked.forEach(place => {
      const btn = document.createElement('button');
      btn.textContent = place;
      btn.disabled = (place === currentLocation);
      btn.onclick = () => {
        const sceneKey = placeToSceneKey[place];
        if (sceneKey) {
          showScene(sceneKey);
        } else {
          alert(`No scene defined for place: ${place}`);
        }
      };
      locationSelector.appendChild(btn);
    });
  }

  // === Character intro popup ===

  function showCharacterIntro(name) {
    if (introducedCharacters.has(name)) return;
    introducedCharacters.add(name);
    const introBox = document.createElement('div');
    introBox.textContent = characterInfoMap[name] || name;
    introBox.style = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.85);
      color: #afa;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1.1rem;
      z-index: 4000;
      user-select: none;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(introBox);
    setTimeout(() => introBox.style.opacity = '1', 50);
    setTimeout(() => {
      introBox.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(introBox);
      }, 500);
    }, 3000);
  }

  // === Update current character display ===

  function updateCurrentCharacter(name) {
    currentCharacterDiv.textContent = name ? `Current: ${name}` : '';
  }

  // === Back button ===

  let backButton = null;
  function createBackButton() {
    if (!backButton) {
      backButton = document.createElement('button');
      backButton.textContent = 'Go Back';
      backButton.style.marginRight = '10px';
      backButton.onclick = goBack;
    }
  }
  function goBack() {
    if (historyStack.length === 0) return;
    const prevScene = historyStack.pop();
    currentSceneKey = null;
    showScene(prevScene, false);
  }

  // === Diary popup placeholder ===

  function showDiary() {
    alert("Diary popup placeholder - implement your diary UI here.");
  }

  // === Info panel handlers ===

  function showInfo() {
    let html = '';
    if (gatheredInfo.clues.length) {
      html += '<h3>Clues:</h3><ul>';
      gatheredInfo.clues.forEach(c => html += `<li>${c}</li>`);
      html += '</ul>';
    }
    if (gatheredInfo.suspects.length) {
      html += '<h3>Suspects:</h3><ul>';
      gatheredInfo.suspects.forEach(s => html += `<li>${s}</li>`);
      html += '</ul>';
    }
    if (gatheredInfo.notes.length) {
      html += '<h3>Notes:</h3><ul>';
      gatheredInfo.notes.forEach(n => html += `<li>${n}</li>`);
      html += '</ul>';
    }
    infoContent.innerHTML = html || '<p>No information gathered yet.</p>';
    infoPanel.style.display = 'block';
  }

  closeInfo.addEventListener('click', () => {
    infoPanel.style.display = 'none';
  });
  infoButton.addEventListener('click', showInfo);

  // === Start the game ===
  showScene('start');
})();
