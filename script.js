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
  let diaryPageRipped = false;

  // === Place to Scene Key Mapping ===
  const placeToSceneKey = {
    "Your House": "start",
    "Josh's House": "joshsHouse",
    "Park": "park",
    "Local Police Station": "localpolicestation",
    "Cafe He Visits": "cafehevisits"
  };

  // === Character Info Map ===
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

  // === Diary Pages ===
  const diaryPages = [
    `"Diary Entry 1/10/25"\n\nI have seen some things.. Pretty bad things before. But this thing.. It SCARES me!\nMost people would just keep walking, but I got too curious..\nI haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\nThere was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!\nI'm running out of time, so when I run around town, they're gonna feel this one!\nLike a magic GONE! Its like he was a magician with a New Magic Wand!\n\nI don't have enough page space for this.. I have to write a new page.."`,
  ];

  // === Utility Functions ===

  function addPlace(name) {
    if (!placesUnlocked.has(name)) {
      placesUnlocked.add(name);
      showNewPlaceNotification(name);
      if (name !== 'Your House') fadeInMapButton();
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

  // === Map Button ===

  function fadeInMapButton() {
    if (mapButton.style.display !== 'block') {
      mapButton.style.display = 'block';
      mapButton.style.opacity = '0';
      setTimeout(() => {
        mapButton.style.transition = 'opacity 1s ease';
        mapButton.style.opacity = '1';
      }, 50);
    }
  }

  mapButton.onclick = () => {
    showMap();
  };

  function showMap() {
    const overlay = document.createElement('div');
    overlay.style = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.9);
      display: flex; justify-content: center; align-items: center;
      z-index: 7000;
    `;

    const mapContent = document.createElement('div');
    mapContent.style = `
      background: #222;
      padding: 20px;
      border-radius: 10px;
      max-width: 90vw;
      width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      color: #afa;
      font-weight: 700;
      font-size: 1.2rem;
      text-align: center;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Locations';
    mapContent.appendChild(title);

    placesUnlocked.forEach(place => {
      const btn = document.createElement('button');
      btn.textContent = place;
      btn.style = `
        display: block;
        width: 100%;
        margin: 5px 0;
        padding: 10px;
        background: #333;
        color: #afa;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 700;
      `;
      btn.onclick = () => {
        const sceneKey = placeToSceneKey[place];
        if (sceneKey) {
          currentLocation = place;
          showScene(sceneKey);
          document.body.removeChild(overlay);
        } else {
          alert(`No scene defined for location: ${place}`);
        }
      };
      mapContent.appendChild(btn);
    });

    const closeMapBtn = document.createElement('button');
    closeMapBtn.textContent = 'Close Map';
    closeMapBtn.style = `
      margin-top: 15px;
      width: 100%;
      padding: 10px;
      background: #4a4;
      color: #afa;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 700;
    `;
    closeMapBtn.onclick = () => document.body.removeChild(overlay);
    mapContent.appendChild(closeMapBtn);

    overlay.appendChild(mapContent);
    document.body.appendChild(overlay);
  }

  // === Diary Popup ===

  function showDiary() {
    const overlay = document.createElement('div');
    overlay.id = 'diary-overlay';
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.85);
      display: flex; justify-content: center; align-items: center;
      z-index: 3000;
      flex-direction: column;
      user-select: text;
    `;

    const book = document.createElement('div');
    book.id = 'diary-book';
    book.style = `
      background: #f9f5e3;
      color: #222;
      width: 600px;
      max-width: 90vw;
      height: 400px;
      padding: 30px 40px;
      box-shadow: 0 0 20px #000;
      border-radius: 15px;
      font-family: Georgia, serif;
      font-size: 1.1rem;
      line-height: 1.5;
      position: relative;
      white-space: pre-wrap;
      overflow-y: auto;
      flex-grow: 1;
    `;

    const pageText = document.createElement('div');
    pageText.id = 'page-text';
    pageText.textContent = diaryPages[0];

    const nextArrow = document.createElement('button');
    nextArrow.textContent = '→';
    nextArrow.style = `
      position: absolute;
      bottom: 60px;
      right: 30px;
      font-size: 2rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #444;
      transition: color 0.3s ease;
    `;
    nextArrow.onmouseenter = () => nextArrow.style.color = '#000';
    nextArrow.onmouseleave = () => nextArrow.style.color = '#444';

    nextArrow.onclick = () => {
      if (!diaryPageRipped) {
        diaryPageRipped = true;
        pageText.textContent = '';
        pageText.style.textAlign = 'center';
        pageText.style.fontStyle = 'italic';
        pageText.style.color = '#a33';
        pageText.textContent = '--- Page ripped out ---';
        nextArrow.style.display = 'none';
        addNote('Josh\'s diary has a ripped page. You need to find the pieces.');
        addPlace("Josh's House");
        addPlace("Park");
        addPlace("Local Police Station");
        addPlace("Cafe He Visits");
        fadeInMapButton();
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Diary';
    closeBtn.style = `
      margin-top: 10px;
      padding: 10px 20px;
      background-color: #444;
      color: #eee;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1rem;
      align-self: center;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#666';
    closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = '#444';
    closeBtn.onclick = () => document.body.removeChild(overlay);

    book.appendChild(pageText);
    book.appendChild(nextArrow);
    overlay.appendChild(book);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
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

    const scene = scenes[sceneKey];
    if (scene.character) showCharacterIntro(scene.character);
    updateCurrentCharacter(scene.character);

    const p = document.createElement('p');
    p.textContent = scene.text;
    gameScreen.appendChild(p);

    // Show diary button only if scene.diary === true
    if (scene.diary) {
      const diaryBtn = document.createElement('button');
      diaryBtn.textContent = "Read Josh's Diary";
      diaryBtn.onclick = showDiary;
      gameScreen.appendChild(diaryBtn);
    }

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

  // === Scenes object ===
  // (Add your full scenes here, example with diary: true on Josh's House)
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
    joshsHouse: {
      character: "Josh's Brother",
      location: "Josh's House",
      diary: true, // <-- Diary button will appear here
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
    // ... add other scenes similarly
  };

  // === Start the game ===
  showScene('start');
})();
