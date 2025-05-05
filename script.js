(() => {
  // DOM references
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');
  const mapButton = document.getElementById('map-button');

  // Game state and other variables
  let gatheredInfo = { clues: [], suspects: [], notes: [] };
  let introducedCharacters = new Set();
  let currentSceneKey = null;
  let historyStack = [];
  let placesUnlocked = new Set(['Your House']);
  let currentLocation = 'Your House';
  let peopleMet = new Set(['Philip']);
  let checkBackEnabled = false;

  // Mapping from place names to scene keys
  const placeToSceneKey = {
    "Your House": "start",
    "Josh's House": "joshsHouse",
    "Park": "park",
    "Local Police Station": "localpolicestation",
    "Cafe He Visits": "cafehevisits"
  };

  // Scenes object (add your full scenes here)
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
      onEnter: () => { addPlace('Your House'); addPersonMet('Philip'); }
    },
    // Add all other scenes here...
    // Example:
    joshsHouse: {
      character: "Josh's Brother",
      location: "Josh's House",
      text: `You arrive at Josh's house. His brother answers the door and says Josh never came home.`,
      choices: [
        { text: "Ask about Josh's friends", next: "askFriends" },
        { text: "Check Josh's social media", next: "checkSocial" },
        { text: "Search Josh's room", next: "searchJoshRoom" }
      ],
      onEnter: () => { addPlace("Josh's House"); addPersonMet("Josh's Brother"); }
    },
    // ...and so on
  };

  // Function to show a scene
  function showScene(sceneKey, pushToHistory = true) {
    if (!sceneKey) {
      console.error("Invalid scene key:", sceneKey);
      gameScreen.innerHTML = `<p>Invalid scene key.</p>`;
      currentCharacterDiv.textContent = '';
      return;
    }
    const scene = scenes[sceneKey];
    if (!scene) {
      console.error(`Scene "${sceneKey}" Not Found`);
      gameScreen.innerHTML = `<p>Scene "${sceneKey}" Not Found</p>`;
      currentCharacterDiv.textContent = '';
      return;
    }
    if (currentSceneKey && currentSceneKey !== sceneKey && pushToHistory) {
      historyStack.push(currentSceneKey);
    }
    currentSceneKey = sceneKey;
    if (scene.onEnter) scene.onEnter();
    if (scene.character) showCharacterIntro(scene.character);
    updateCurrentCharacter(scene.character);
    gameScreen.innerHTML = '';
    showLocationSelector();
    const sceneText = document.createElement('p');
    sceneText.textContent = scene.text;
    gameScreen.appendChild(sceneText);
    if (scene.diary) {
      const diaryBtn = document.createElement('button');
      diaryBtn.textContent = 'Read Josh\'s Diary';
      diaryBtn.onclick = showDiary;
      gameScreen.appendChild(diaryBtn);
    }
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '1rem';
    createBackButton();
    if (historyStack.length > 0) {
      buttonContainer.appendChild(backButton);
    }
    scene.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.onclick = () => showScene(choice.next);
      buttonContainer.appendChild(btn);
    });
    gameScreen.appendChild(buttonContainer);
    gameScreen.scrollTop = 0;
  }

  // Other functions declarations (showLocationSelector, showCharacterIntro, updateCurrentCharacter, createBackButton, showDiary, addPlace, addPersonMet, etc.)
  // Make sure these are declared BEFORE you call showScene()

  // Example: simple showLocationSelector
  let locationSelector = null;
  function showLocationSelector() {
    if (!locationSelector) {
      locationSelector = document.createElement('div');
      locationSelector.id = 'location-selector';
      locationSelector.style = `
        margin-bottom: 1rem;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      `;
      gameScreen.prepend(locationSelector);
    }
    locationSelector.innerHTML = '';
    placesUnlocked.forEach(place => {
      const btn = document.createElement('button');
      btn.textContent = place;
      btn.style = `
        background-color: ${place === currentLocation ? '#4a4' : '#222'};
        color: #afa;
        border: none;
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.9rem;
        transition: background-color 0.3s ease;
      `;
      btn.onmouseenter = () => {
        if (place !== currentLocation) btn.style.backgroundColor = '#6a6';
      };
      btn.onmouseleave = () => {
        if (place !== currentLocation) btn.style.backgroundColor = '#222';
      };
      btn.onclick = () => {
        if (place === currentLocation) return;
        currentLocation = place;
        showScene(placeToSceneKey[place]);
      };
      locationSelector.appendChild(btn);
    });
  }

  // Example: showCharacterIntro
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

  // Example: updateCurrentCharacter
  function updateCurrentCharacter(name) {
    currentCharacterDiv.textContent = name ? `Current: ${name}` : '';
  }

  // Example: createBackButton
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

  // Example: showDiary (simplified)
  function showDiary() {
    alert("Diary popup here (implement your diary UI)");
  }

  // Example: addPlace and addPersonMet
  function addPlace(name) {
    if (!placesUnlocked.has(name)) {
      placesUnlocked.add(name);
      // Optionally notify player
    }
  }
  function addPersonMet(name) {
    peopleMet.add(name);
  }

  // Character info map (example)
  const characterInfoMap = {
    'Philip': 'You - The worried friend searching for Josh.',
    'Josh': 'Josh - The missing friend.',
    "Josh's Brother": 'Josh\'s Brother - Knows Josh\'s recent whereabouts.',
    // Add others as needed
  };

  // Start the game AFTER all functions are declared
  showScene('start');
})();
