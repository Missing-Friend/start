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

function createPhoneUI() {
  if (phoneUI) return;

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

  const callingText = document.createElement('div');
  callingText.id = 'calling-text';
  callingText.style = `
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 10px;
    text-align: center;
  `;
  phoneUI.appendChild(callingText);

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

  const questionsContainer = document.createElement('div');
  questionsContainer.id = 'questions-container';
  questionsContainer.style = `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  `;
  phoneUI.appendChild(questionsContainer);

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

  setTimeout(() => {
    callingText.textContent = `${personName} is on the line.`;
    loadCallQuestions(personName);
  }, 1500);
}

function hidePhoneUI() {
  if (!phoneUI) return;
  phoneUI.style.bottom = '-300px';
  phoneActive = false;
  currentCallPerson = null;
}

function endCall() {
  hidePhoneUI();
}

function loadCallQuestions(personName) {
  const questionsContainer = document.getElementById('questions-container');
  const dialogueContainer = document.getElementById('dialogue-container');
  questionsContainer.innerHTML = '';
  dialogueContainer.innerHTML = '';

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

  addPlace("Josh's House");
  addPlace("Park");

  enableCheckBackMechanic();
}

// --- Check Back Mechanic Setup ---
let checkBackEnabled = false;

function enableCheckBackMechanic() {
  if (checkBackEnabled) return;
  checkBackEnabled = true;

  createPersonIconsUI();
}

let personIconsUI = null;

function createPersonIconsUI() {
  if (personIconsUI) return;

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

function updatePersonIcons() {
  if (!personIconsUI) return;
  personIconsUI.innerHTML = '';

  peopleMet.forEach(person => {
    if (person === 'Philip') return;

    const iconBtn = document.createElement('button');
    iconBtn.textContent = person[0];
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
      if (phoneActive) return;
      showPhoneUI(person);
    };

    personIconsUI.appendChild(iconBtn);
  });
}

// --- Go Back Button ---
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

// --- Scenes ---
const scenes = {
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
  'checkPhone': {
    character: 'Philip',
    location: 'Your House',
    text: `Your phone shows no new messages from Josh. You feel uneasy.`,
    choices: [
      { text: "Go to Josh's House", next: "joshsHouse" },
      { text: "Wait a little longer", next: "waitLonger" }
    ]
  },
  'waitLonger': {
    character: 'Philip',
    location: 'Your House',
    text: `You wait, but still no word from Josh. The rain keeps falling.`,
    choices: [
      { text: "Go to Josh's House", next: "joshsHouse" }
    ]
  },
  'joshsHouse': {
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
  'askFriends': {
    character: "Josh's Brother",
    location: "Josh's House",
    text: `Josh's brother mentions Nate and Aliya. Maybe they know something.`,
    choices: [
      { text: "Look up Nate's last messages", next: "checkNate" },
      { text: "Look up Aliya's posts", next: "checkAliya" },
      { text: "Go back", next: "joshsHouse" }
    ]
  },
  'checkSocial': {
    character: 'Philip',
    location: "Josh's House",
    text: `Josh's social media shows a cryptic post from earlier today: "Don't trust anyone."`,
    choices: [
      { text: "Investigate further", next: "investigateFurther" },
      { text: "Go back", next: "joshsHouse" }
    ]
  },
  'checkNate': {
    character: 'Nate',
    location: 'Unknown',
    text: `Nate's last message to Josh was a joke about meeting up tomorrow. Nothing suspicious.`,
    choices: [
      { text: "Check Aliya's posts", next: "checkAliya" },
      { text: "Go back", next: "askFriends" }
    ],
    onEnter: () => {
      addSuspect('Nate');
      addPersonMet('Nate');
      addClue("Nate's last message was a joke, no threat detected.");
    }
  },
  'checkAliya': {
    character: 'Aliya',
    location: 'Unknown',
    text: `Aliya posted a photo with Josh two days ago with the caption: "Missing you already."`,
    choices: [
      { text: "Look for more posts", next: "moreAliya" },
      { text: "Go back", next: "askFriends" }
    ],
    onEnter: () => {
      addSuspect('Aliya');
      addPersonMet('Aliya');
      addClue("Aliya's social media shows affection towards Josh.");
    }
  },
  'moreAliya': {
    character: 'Aliya',
    location: 'Unknown',
    text: `A recent post shows Aliya arguing with Josh in a comment thread. Tensions might be higher than they seem.`,
    choices: [
      { text: "Go back", next: "checkAliya" }
    ],
    onEnter: () => {
      addNote("Aliya and Josh had a recent argument on social media.");
    }
  },
  'investigateFurther': {
    character: 'Philip',
    location: 'Your House',
    text: `You decide to dig deeper into Josh's online activity and diary entries.`,
    choices: [
      { text: "Check Josh's diary", next: "checkDiary" },
      { text: "Look up Josh's last location", next: "checkLocation" },
      { text: "Go back", next: "checkSocial" }
    ]
  },
  'checkDiary': {
    character: 'Philip',
    location: 'Your House',
    text: `Josh's diary is here. You can read it.`,
    diary: true,
    choices: [
      { text: "Go back", next: "investigateFurther" }
    ],
    onEnter: () => {
      addClue("Josh's diary might hold important information.");
    }
  },
  'checkLocation': {
    character: 'Philip',
    location: 'Your House',
    text: `Josh's location tracker last pinged near the park, close to where you were earlier.`,
    choices: [
      { text: "Go back", next: "investigateFurther" }
    ],
    onEnter: () => {
      addClue("Josh's last known location was near the park.");
      addPlace('Park');
    }
  },
  'park': {
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
  'lookAroundPark': {
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
  'collectPiecesPark': {
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
  'searchJoshRoom': {
    character: 'Philip',
    location: "Josh's House",
    text: `You search Josh's room carefully. You find torn diary pieces under his bed and in his closet.`,
    choices: [
      { text: "Look under the bed", next: "underBed" },
      { text: "Look in the closet", next: "inCloset" },
      { text: "Go back to Josh's House entrance", next: "joshsHouse" }
    ],
    onEnter: () => {
      addClue("Searching Josh's room for diary pieces.");
    }
  },
  'underBed': {
    character: 'Philip',
    location: "Josh's House",
    text: `Under the bed, you find several torn pieces of the diary page.`,
    choices: [
      { text: "Take the pieces", next: "takePiecesUnderBed" },
      { text: "Go back to searching room", next: "searchJoshRoom" }
    ],
    onEnter: () => {
      addNote("Found diary pieces under Josh's bed.");
    }
  },
  'takePiecesUnderBed': {
    character: 'Philip',
    location: "Josh's House",
    text: `You take the torn pieces from under the bed and put them in your pocket.`,
    choices: [
      { text: "Continue searching the room", next: "searchJoshRoom" },
      { text: "Go back to Josh's House entrance", next: "joshsHouse" }
    ],
    onEnter: () => {
      addNote("Collected diary pieces from under the bed.");
    }
  },
  'inCloset': {
    character: 'Philip',
    location: "Josh's House",
    text: `In the closet, you find more torn diary pieces, hidden behind some clothes.`,
    choices: [
      { text: "Take the pieces", next: "takePiecesInCloset" },
      { text: "Go back to searching room", next: "searchJoshRoom" }
    ],
    onEnter: () => {
      addNote("Found diary pieces in Josh's closet.");
    }
  },
  'takePiecesInCloset': {
    character: 'Philip',
    location: "Josh's House",
    text: `You take the torn pieces from the closet.`,
    choices: [
      { text: "Continue searching the room", next: "searchJoshRoom" },
      { text: "Go back to Josh's House entrance", next: "joshsHouse" }
    ],
    onEnter: () => {
      addNote("Collected diary pieces from the closet.");
    }
  },
  'talkKaylee': {
    character: 'Kaylee',
    location: 'Josh\'s House',
    text: `Kaylee looks worried but admits she has some of the diary page pieces. She says she took them to protect Josh.`,
    choices: [
      { text: "Ask about Nicholas", next: "talkNicholas" },
      { text: "Ask about Lily and Bri", next: "talkSisters" },
      { text: "Go back to Josh's House", next: "joshsHouse" }
    ],
    onEnter: () => {
      addSuspect('Kaylee');
      addPersonMet('Kaylee');
      addNote("Kaylee has some diary page pieces.");
    }
  },
  'talkNicholas': {
    character: 'Nicholas',
    location: 'Josh\'s House',
    text: `Nicholas is evasive but admits to having some diary fragments. He seems nervous.`,
    choices: [
      { text: "Ask about Kaylee", next: "talkKaylee" },
      { text: "Ask about Lily and Bri", next: "talkSisters" },
      { text: "Go back to Josh's House", next: "joshsHouse" }
    ],
    onEnter: () => {
      addSuspect('Nicholas');
      addPersonMet('Nicholas');
      addNote("Nicholas is hiding diary fragments.");
    }
  },
  'talkSisters': {
    character: 'Lily & Bri',
    location: 'Josh\'s House',
    text: `Lily and Bri giggle and admit they took some torn diary pages and hid them in Josh's closet.`,
    choices: [
      { text: "Ask about Kaylee", next: "talkKaylee" },
      { text: "Ask about Nicholas", next: "talkNicholas" },
      { text: "Go back to Josh's House", next: "joshsHouse" }
    ],
    onEnter: () => {
      addSuspect('Lily');
      addSuspect('Bri');
      addPersonMet('Lily');
      addPersonMet('Bri');
      addNote("Lily and Bri have some torn diary pages.");
    }
  }
};

// --- Show Scene Function ---
function showScene(sceneKey, pushToHistory = true) {
  const scene = scenes[sceneKey];
  if (!scene) {
    console.error(`Scene "${sceneKey}" not found.`);
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

// --- Back Button ---
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

// --- Start Game ---
showScene('start');
