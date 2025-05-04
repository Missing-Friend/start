// --- DOM References ---
const gameScreen = document.getElementById('game-screen');
const infoButton = document.getElementById('info-button');
const infoPanel = document.getElementById('info-panel');
const closeInfo = document.getElementById('close-info');
const infoContent = document.getElementById('info-content');
const currentCharacterDiv = document.getElementById('current-character');

// --- Game State ---
let gatheredInfo = {
  clues: [],
  suspects: [],
  notes: []
};

let introducedCharacters = new Set();
let visitedLocations = new Set(['Your House']); // Start with Your House unlocked
let currentSceneKey = null;
let historyStack = [];

// --- Places mechanic ---
let placesUnlocked = new Set(['Your House']);
let currentLocation = 'Your House';

// --- Phone call mechanic ---
let peopleMet = new Set(['Philip']); // You start knowing yourself
let phoneActive = false;
let currentCallPerson = null;

// --- Diary pages ---
const diaryPages = [
  `"Diary Entry 1/10/25"\n\n` +
  `"I have seen some things.. Pretty bad things before. But this thing.. It SCARES me!"\n` +
  `"Most people would just keep walking, but I got too curious.."\n` +
  `"I haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\n` +
  `"There was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!"\n` +
  `"I'm running out of time, so when I run around town, they're gonna feel this one!"\n` +
  `"Like a magic GONE! Its like he was a magician with a New Magic Wand!"\n\n` +
  `"I don't have enough page space for this.. I have to write a new page.."`,
  // Second page is ripped out
];

// --- Utility Functions ---

function addClue(clue) {
  if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue);
}
function addSuspect(suspect) {
  if (!gatheredInfo.suspects.includes(suspect)) gatheredInfo.suspects.push(suspect);
}
function addNote(note) {
  if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note);
}
function addPersonMet(name) {
  peopleMet.add(name);
}
function addPlace(name) {
  if (!placesUnlocked.has(name)) {
    placesUnlocked.add(name);
    showNewPlaceNotification(name);
  }
}

// Show fading notification for new place unlocked
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
    setTimeout(() => {
      document.body.removeChild(notif);
    }, 1000);
  }, 3500);
}

// --- Character Info Map ---
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

// --- Phone Call UI Elements ---
let phoneUI = null;

// Create phone UI on demand
function createPhoneUI() {
  if (phoneUI) return; // Already exists

  phoneUI = document.createElement('div');
  phoneUI.id = 'phone-ui';
  phoneUI.style = `
    position: fixed;
    bottom: -300px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    background: #111;
    border-radius: 15px 15px 0 0;
    box-shadow: 0 0 30px #0f0;
    color: #afa;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    z-index: 6000;
    transition: bottom 0.5s ease;
    display: flex;
    flex-direction: column;
    padding: 10px;
  `;

  // Calling text
  const callingText = document.createElement('div');
  callingText.id = 'calling-text';
  callingText.style = `
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 10px;
    text-align: center;
  `;
  phoneUI.appendChild(callingText);

  // Dialogue container
  const dialogueContainer = document.createElement('div');
  dialogueContainer.id = 'dialogue-container';
  dialogueContainer.style = `
    flex-grow: 1;
    overflow-y: auto;
    max-height: 180px;
    margin-bottom: 10px;
    padding: 5px;
    background: #222;
    border-radius: 10px;
    color: #afa;
  `;
  phoneUI.appendChild(dialogueContainer);

  // Questions container
  const questionsContainer = document.createElement('div');
  questionsContainer.id = 'questions-container';
  questionsContainer.style = `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  `;
  phoneUI.appendChild(questionsContainer);

  // Hang up button
  const hangupBtn = document.createElement('button');
  hangupBtn.textContent = 'Hang Up';
  hangupBtn.style = `
    background-color: #400;
    color: #faa;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    margin-top: 5px;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    transition: background-color 0.3s ease;
  `;
  hangupBtn.onmouseenter = () => hangupBtn.style.backgroundColor = '#600';
  hangupBtn.onmouseleave = () => hangupBtn.style.backgroundColor = '#400';
  hangupBtn.onclick = endCall;
  phoneUI.appendChild(hangupBtn);

  document.body.appendChild(phoneUI);
}

// Show phone UI with slide up animation
function showPhoneUI(personName) {
  createPhoneUI();
  phoneUI.style.bottom = '20px';
  phoneActive = true;
  currentCallPerson = personName;

  const callingText = document.getElementById('calling-text');
  const dialogueContainer = document.getElementById('dialogue-container');
  const questionsContainer = document.getElementById('questions-container');

  callingText.textContent = `Calling ${personName}...`;
  dialogueContainer.innerHTML = '';
  questionsContainer.innerHTML = '';

  // After short delay, simulate call answered and show questions
  setTimeout(() => {
    callingText.textContent = `${personName} is on the line.`;
    loadCallQuestions(personName);
  }, 1500);
}

// Hide phone UI with slide down animation
function hidePhoneUI() {
  if (!phoneUI) return;
  phoneUI.style.bottom = '-300px';
  phoneActive = false;
  currentCallPerson = null;
}

// End call handler
function endCall() {
  hidePhoneUI();
  // Return to main investigation screen (no scene change)
}

// Load questions for a person based on clues and context
function loadCallQuestions(personName) {
  const questionsContainer = document.getElementById('questions-container');
  const dialogueContainer = document.getElementById('dialogue-container');
  questionsContainer.innerHTML = '';
  dialogueContainer.innerHTML = '';

  // Example questions per person - expand as you like
  const questionsMap = {
    'Kaylee': [
      {
        q: 'Why do you have some of Josh’s diary pages?',
        a: 'I wanted to protect him. Some things in that diary scared me... I thought hiding parts would keep him safe.'
      },
      {
        q: 'Have you noticed anything strange lately?',
        a: 'Josh has been acting distant, and I saw him talking to someone suspicious near the park.'
      }
    ],
    'Nicholas': [
      {
        q: 'Why did you take some diary pieces?',
        a: 'I don’t want to get involved, but I had to keep some evidence safe.'
      },
      {
        q: 'Did Josh tell you about the homeless man?',
        a: 'He mentioned it once, but I thought it was just paranoia.'
      }
    ],
    'Lily': [
      {
        q: 'Why do you have some torn diary pages?',
        a: 'We found them and thought it was a game. Didn’t know it was important.'
      },
      {
        q: 'Did Josh seem scared of anyone?',
        a: 'Yeah, sometimes he looked over his shoulder at the park.'
      }
    ],
    'Bri': [
      {
        q: 'Did you hide diary pages in Josh’s closet?',
        a: 'Maybe... I just didn’t want him to get in trouble.'
      },
      {
        q: 'Do you know anything about the homeless man?',
        a: 'I heard rumors but never saw him myself.'
      }
    ],
    'Nate': [
      {
        q: 'Did Josh say anything about being scared?',
        a: 'Not really, just usual stuff. But he seemed off lately.'
      },
      {
        q: 'Do you know about the diary pages?',
        a: 'No clue, man.'
      }
    ],
    'Aliya': [
      {
        q: 'Why did Josh seem “off” lately?',
        a: 'He was stressed, but he didn’t want to talk about it.'
      },
      {
        q: 'Did you see Josh after the park?',
        a: 'No, he disappeared after that day.'
      }
    ]
  };

  const questions = questionsMap[personName] || [
    { q: 'No questions available.', a: '' }
  ];

  questions.forEach(({ q, a }) => {
    const btn = document.createElement('button');
    btn.textContent = q;
    btn.style = `
      background-color: #222;
      color: #afa;
      border: 1px solid #4a4;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.9rem;
      flex-grow: 1;
      min-width: 140px;
      transition: background-color 0.3s ease;
    `;
    btn.onmouseenter = () => btn.style.backgroundColor = '#4a4';
    btn.onmouseleave = () => btn.style.backgroundColor = '#222';

    btn.onclick = () => {
      // Show answer in dialogue container
      dialogueContainer.textContent = a || 'No response.';
    };

    questionsContainer.appendChild(btn);
  });
}

// --- Character Introduction ---
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

// --- Current Character Display ---
function updateCurrentCharacter(name) {
  currentCharacterDiv.textContent = name ? `Current: ${name}` : '';
}

// --- Info Panel ---
function showInfo() {
  let html = '';

  if (gatheredInfo.clues.length) {
    html += '<h3>Clues:</h3><ul>';
    gatheredInfo.clues.forEach(clue => {
      html += `<li>${clue}</li>`;
    });
    html += '</ul>';
  }

  if (gatheredInfo.suspects.length) {
    html += '<h3>Suspects:</h3><ul>';
    gatheredInfo.suspects.forEach(suspect => {
      html += `<li>${suspect}</li>`;
    });
    html += '</ul>';
  }

  if (gatheredInfo.notes.length) {
    html += '<h3>Notes:</h3><ul>';
    gatheredInfo.notes.forEach(note => {
      html += `<li>${note}</li>`;
    });
    html += '</ul>';
  }

  infoContent.innerHTML = html || '<p>No information gathered yet.</p>';
  infoPanel.style.display = 'block';
}

closeInfo.addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

infoButton.addEventListener('click', showInfo);

// --- Diary Popup Book ---
function showDiary() {
  const overlay = document.createElement('div');
  overlay.id = 'diary-overlay';
  overlay.style = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.85);
    display: flex; justify-content: center; align-items: center;
    z-index: 3000;
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
    font-family: 'Georgia', serif;
    font-size: 1.1rem;
    line-height: 1.5;
    position: relative;
    white-space: pre-wrap;
    overflow-y: auto;
  `;

  const pageText = document.createElement('div');
  pageText.id = 'page-text';
  pageText.textContent = diaryPages[0];

  const nextArrow = document.createElement('button');
  nextArrow.textContent = '→';
  nextArrow.style = `
    position: absolute;
    bottom: 20px;
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

  let currentPage = 0;

  nextArrow.onclick = () => {
    if (currentPage === 0) {
      pageText.textContent = '';
      pageText.style.textAlign = 'center';
      pageText.style.fontStyle = 'italic';
      pageText.style.color = '#a33';
      pageText.textContent = '--- Page ripped out ---';
      nextArrow.style.display = 'none';
      currentPage++;

      // Unlock page pieces mechanic and new objective
      addNote('Josh\'s diary has a ripped page. You need to find the pieces.');
      unlockPagePiecesMechanic();
    }
  };

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style = `
    position: absolute;
    bottom: 20px;
    left: 30px;
    padding: 6px 14px;
    background-color: #444;
    color: #eee;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  `;
  closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#666';
  closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = '#444';

  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
    fadeNewObjective('New Objective: Find Page Pieces');
  };

  book.appendChild(pageText);
  book.appendChild(nextArrow);
  book.appendChild(closeBtn);
  overlay.appendChild(book);
  document.body.appendChild(overlay);
}

// Fade new objective text
function fadeNewObjective(text) {
  const objBox = document.createElement('div');
  objBox.textContent = text;
  objBox.style = `
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
    z-index: 4000;
    user-select: none;
  `;

  document.body.appendChild(objBox);

  setTimeout(() => objBox.style.opacity = '1', 50);
  setTimeout(() => {
    objBox.style.opacity = '0';
    setTimeout(() => document.body.removeChild(objBox), 1000);
  }, 3000);
}

// --- Unlock Page Pieces Mechanic ---
let pagePiecesUnlocked = false;

function unlockPagePiecesMechanic() {
  if (pagePiecesUnlocked) return;
  pagePiecesUnlocked = true;

  // Add new places related to page pieces
  addPlace("Josh's House");
  addPlace("Park");

  // Enable Check Back mechanic (phone calls)
  enableCheckBackMechanic();
}

// --- Check Back Mechanic Setup ---
let checkBackEnabled = false;

function enableCheckBackMechanic() {
  if (checkBackEnabled) return;
  checkBackEnabled = true;

  // Show UI for person icons to call (we'll create it dynamically)
  createPersonIconsUI();
}

// Create person icons UI for calling
let personIconsUI = null;

function createPersonIconsUI() {
  if (personIconsUI) return; // Already created

  personIconsUI = document.createElement('div');
  personIconsUI.id = 'person-icons-ui';
  personIconsUI.style = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.75);
    padding: 8px 12px;
    border-radius: 12px;
    display: flex;
    gap: 12px;
    z-index: 5500;
    user-select: none;
  `;

  document.body.appendChild(personIconsUI);

  updatePersonIcons();
}

// Update person icons based on people met
function updatePersonIcons() {
  if (!personIconsUI) return;
  personIconsUI.innerHTML = '';

  peopleMet.forEach(person => {
    if (person === 'Philip') return; // Don't show self

    const iconBtn = document.createElement('button');
    iconBtn.textContent = person[0]; // First letter as icon
    iconBtn.title = person;
    iconBtn.style = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #4a4;
      background-color: #222;
      color: #afa;
      font-weight: 700;
      font-size: 1.3rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    `;
    iconBtn.onmouseenter = () => iconBtn.style.backgroundColor = '#4a4';
    iconBtn.onmouseleave = () => iconBtn.style.backgroundColor = '#222';

    iconBtn.onclick = () => {
      if (phoneActive) return; // Prevent multiple calls
      showPhoneUI(person);
    };

    personIconsUI.appendChild(iconBtn);
  });
}

// --- History and Go Back ---

// Declare backButton once at top
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

// --- Main Scene Logic ---

// Scenes object with locations, clues, suspects, diary, and branching
const scenes = {
  // Starting scene at Your House
  'start': {
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

  // ... (Include all other scenes exactly as in the previous full code) ...

  // For brevity, you should include all scenes from the previous full code here.
};

// --- Show Scene Function ---
function showScene(sceneKey, pushToHistory = true) {
  const scene = scenes[sceneKey];
  if (!scene) {
    gameScreen.innerHTML = `<p>Scene "${sceneKey}" not found.</p>`;
    currentCharacterDiv.textContent = '';
    return;
  }

  // Push current scene to history if needed
  if (currentSceneKey && currentSceneKey !== sceneKey && pushToHistory) {
    historyStack.push(currentSceneKey);
  }
  currentSceneKey = sceneKey;

  // Run onEnter if exists
  if (scene.onEnter) scene.onEnter();

  // Introduce character if first time
  if (scene.character) showCharacterIntro(scene.character);

  // Update current character display
  updateCurrentCharacter(scene.character);

  // Clear game screen
  gameScreen.innerHTML = '';

  // Show location selector if places unlocked
  showLocationSelector();

  // Scene text
  const sceneText = document.createElement('p');
  sceneText.textContent = scene.text;
  gameScreen.appendChild(sceneText);

  // Diary button if available
  if (scene.diary) {
    const diaryBtn = document.createElement('button');
    diaryBtn.textContent = 'Read Josh\'s Diary';
    diaryBtn.onclick = showDiary;
    gameScreen.appendChild(diaryBtn);
  }

  // Button container for choices and back button
  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '1rem';

  // Go Back button if history available
  createBackButton();
  if (historyStack.length > 0) {
    buttonContainer.appendChild(backButton);
  }

  // Add choices buttons
  scene.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.onclick = () => showScene(choice.next);
    buttonContainer.appendChild(btn);
  });

  gameScreen.appendChild(buttonContainer);
  gameScreen.scrollTop = 0;
}

// --- Location Selector UI ---
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
      // Show a scene corresponding to the location
      switch (place) {
        case 'Your House': showScene('start'); break;
        case "Josh's House": showScene('joshsHouse'); break;
        case 'Park': showScene('park'); break;
        default: showScene('start'); break;
      }
    };
    locationSelector.appendChild(btn);
  });
}

// --- Start Game ---
showScene('start');
