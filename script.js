(() => {
  // DOM references
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');
  const mapButton = document.getElementById('map-button');

  // Game state
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

  // Scenes object
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
      onEnter: () => { addPlace("Josh's House"); addPersonMet("Josh's Brother"); }
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
    searchJoshRoom: {
      character: 'Philip',
      location: "Josh's House",
      text: `You search Josh's room carefully. You find torn diary pieces under his bed and in his closet.`,
      choices: [
        { text: "Look under the bed", next: "underBed" },
        { text: "Look in the closet", next: "inCloset" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addClue("Searching Josh's room for diary pieces."); }
    },
    underBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `Under the bed, you find several torn pieces of the diary page.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesUnderBed" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => { addNote("Found diary pieces under Josh's bed."); }
    },
    takePiecesUnderBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from under the bed and put them in your pocket.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addNote("Collected diary pieces from under the bed."); }
    },
    inCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `In the closet, you find more torn diary pieces, hidden behind some clothes.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesInCloset" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => { addNote("Found diary pieces in Josh's closet."); }
    },
    takePiecesInCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from the closet.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addNote("Collected diary pieces from the closet."); }
    },
    // Add other scenes as needed...

    park: {
      character: 'Philip',
      location: 'Park',
      text: `You arrive at the park where you last saw Josh. The fog and rain make everything look eerie.`,
      choices: [
        { text: "Look around the park", next: "lookAroundPark" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => { addPlace('Park'); }
    },
    lookAroundPark: {
      character: 'Philip',
      location: 'Park',
      text: `You find some torn pieces of paper near a bench. Could these be from Josh's diary?`,
      choices: [
        { text: "Collect torn pieces", next: "collectPiecesPark" },
        { text: "Go back", next: "park" }
      ],
      onEnter: () => { addClue("Found torn diary pieces at the park."); }
    },
    collectPiecesPark: {
      character: 'Philip',
      location: 'Park',
      text: `You collect the torn pieces. They might help you understand what Josh was scared of.`,
      choices: [
        { text: "Go back to Josh's House", next: "joshsHouse" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => { addNote("Collected diary pieces from the park."); addPlace("Josh's House"); }
    }
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

  // Other helper functions (showLocationSelector, showCharacterIntro, updateCurrentCharacter, createBackButton, showDiary, addPlace, addPersonMet) go here
  // For brevity, you can use the implementations from previous messages

  // Example: start the game AFTER all functions are declared
  showScene('start');
})();
(() => {
  // DOM references
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');
  const mapButton = document.getElementById('map-button');

  // Game state
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

  // Scenes object
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
      onEnter: () => { addPlace("Josh's House"); addPersonMet("Josh's Brother"); }
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
    searchJoshRoom: {
      character: 'Philip',
      location: "Josh's House",
      text: `You search Josh's room carefully. You find torn diary pieces under his bed and in his closet.`,
      choices: [
        { text: "Look under the bed", next: "underBed" },
        { text: "Look in the closet", next: "inCloset" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addClue("Searching Josh's room for diary pieces."); }
    },
    underBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `Under the bed, you find several torn pieces of the diary page.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesUnderBed" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => { addNote("Found diary pieces under Josh's bed."); }
    },
    takePiecesUnderBed: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from under the bed and put them in your pocket.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addNote("Collected diary pieces from under the bed."); }
    },
    inCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `In the closet, you find more torn diary pieces, hidden behind some clothes.`,
      choices: [
        { text: "Take the pieces", next: "takePiecesInCloset" },
        { text: "Go back", next: "searchJoshRoom" }
      ],
      onEnter: () => { addNote("Found diary pieces in Josh's closet."); }
    },
    takePiecesInCloset: {
      character: 'Philip',
      location: "Josh's House",
      text: `You take the torn pieces from the closet.`,
      choices: [
        { text: "Continue searching the room", next: "searchJoshRoom" },
        { text: "Go back", next: "joshsHouse" }
      ],
      onEnter: () => { addNote("Collected diary pieces from the closet."); }
    },
    // Add other scenes as needed...

    park: {
      character: 'Philip',
      location: 'Park',
      text: `You arrive at the park where you last saw Josh. The fog and rain make everything look eerie.`,
      choices: [
        { text: "Look around the park", next: "lookAroundPark" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => { addPlace('Park'); }
    },
    lookAroundPark: {
      character: 'Philip',
      location: 'Park',
      text: `You find some torn pieces of paper near a bench. Could these be from Josh's diary?`,
      choices: [
        { text: "Collect torn pieces", next: "collectPiecesPark" },
        { text: "Go back", next: "park" }
      ],
      onEnter: () => { addClue("Found torn diary pieces at the park."); }
    },
    collectPiecesPark: {
      character: 'Philip',
      location: 'Park',
      text: `You collect the torn pieces. They might help you understand what Josh was scared of.`,
      choices: [
        { text: "Go back to Josh's House", next: "joshsHouse" },
        { text: "Go back to Your House", next: "start" }
      ],
      onEnter: () => { addNote("Collected diary pieces from the park."); addPlace("Josh's House"); }
    }
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

  // Other helper functions (showLocationSelector, showCharacterIntro, updateCurrentCharacter, createBackButton, showDiary, addPlace, addPersonMet) go here
  // For brevity, you can use the implementations from previous messages

  // Example: start the game AFTER all functions are declared
  showScene('start');
})();
