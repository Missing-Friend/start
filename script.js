const gameScreen = document.getElementById('game-screen');
const infoButton = document.getElementById('info-button');
const infoPanel = document.getElementById('info-panel');
const closeInfo = document.getElementById('close-info');
const infoContent = document.getElementById('info-content');
const currentCharacterDiv = document.getElementById('current-character');

let gatheredInfo = {
  clues: [],
  suspects: [],
  notes: []
};

// Track which characters have been introduced to show their info once
let introducedCharacters = new Set();

// Diary pages content
const diaryPages = [
  `"Diary Entry 1/10/25"\n\n` +
  `"I have seen some things.. Pretty bad things before. But this thing.. It SCARES me!"\n` +
  `"Most people would just keep walking, but I got too curious.."\n` +
  `"I haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\n` +
  `"There was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!"\n` +
  `"I'm running out of time, so when I run around town, they're gonna feel this one!"\n` +
  `"Like a magic GONE! Its like he was a magician with a New Magic Wand!"\n\n` +
  `"I don't have enough page space for this.. I have to write a new page.."`,
  // Second page is ripped out, so no content, just simulate ripped page
];

// Show diary book popup
function showDiary() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'diary-overlay';
  overlay.style = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.85);
    display: flex; justify-content: center; align-items: center;
    z-index: 3000;
  `;

  // Create book container
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

  // Page text element
  const pageText = document.createElement('div');
  pageText.id = 'page-text';
  pageText.textContent = diaryPages[0];

  // Navigation arrow
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
      // Simulate ripped page effect for page 2
      pageText.textContent = '';
      pageText.style.textAlign = 'center';
      pageText.style.fontStyle = 'italic';
      pageText.style.color = '#a33';
      pageText.textContent = '--- Page ripped out ---';
      nextArrow.style.display = 'none';
      currentPage++;
    }
  };

  // Close button
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

// Fade in/out new objective text
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

  // Fade in
  setTimeout(() => {
    objBox.style.opacity = '1';
  }, 50);

  // Fade out after 3 seconds
  setTimeout(() => {
    objBox.style.opacity = '0';
    // Remove after fade out
    setTimeout(() => {
      document.body.removeChild(objBox);
    }, 1000);
  }, 3000);
}

// Add clues, suspects, notes safely
function addClue(clue) {
  if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue);
}
function addSuspect(suspect) {
  if (!gatheredInfo.suspects.includes(suspect)) gatheredInfo.suspects.push(suspect);
}
function addNote(note) {
  if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note);
}

// Show a scene by key
function showScene(sceneKey) {
  const scene = scenes[sceneKey];
  if (!scene) {
    gameScreen.innerHTML = `<p>Scene "${sceneKey}" not found.</p>`;
    currentCharacterDiv.textContent = '';
    return;
  }

  // Run onEnter if exists (for adding clues/suspects)
  if (scene.onEnter) scene.onEnter();

  // Introduce character if first time and show info
  if (scene.character && !introducedCharacters.has(scene.character)) {
    introducedCharacters.add(scene.character);
    showCharacterIntro(scene.character);
  }

  // Update character display
  updateCurrentCharacter(scene.character);

  // Display scene text
  gameScreen.innerHTML = `<p>${scene.text}</p>`;

  // Special case: if scene has diary action
  if (scene.diary) {
    const diaryBtn = document.createElement('button');
    diaryBtn.textContent = 'Read Josh\'s Diary';
    diaryBtn.onclick = showDiary;
    gameScreen.appendChild(diaryBtn);
  }

  // Display choices as buttons
  scene.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.onclick = () => showScene(choice.next);
    gameScreen.appendChild(btn);
  });

  // Scroll to top when scene changes
  gameScreen.scrollTop = 0;
}

// Show a short intro/info about a character when first met
function showCharacterIntro(name) {
  const introBox = document.createElement('div');
  introBox.textContent = getCharacterInfo(name);
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

  // Fade in
  setTimeout(() => introBox.style.opacity = '1', 50);

  // Fade out after 3 seconds
  setTimeout(() => {
    introBox.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(introBox);
    }, 500);
  }, 3000);
}

// Return info text about characters
function getCharacterInfo(name) {
  const infoMap = {
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
  return infoMap[name] || name;
}

// Show gathered info panel
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

// Hide info panel
closeInfo.addEventListener('click', () => {
  infoPanel.style.display = 'none';
});

// Info button event
infoButton.addEventListener('click', showInfo);

// Update current character display
function updateCurrentCharacter(name) {
  currentCharacterDiv.textContent = name ? `Current: ${name}` : '';
}

// Expanded scenes with more actions and diary
const scenes = {
  start: {
    character: 'Philip',
    text: `It’s a foggy, rainy evening in Arlington. You and your friend Josh just left the park. You ask him to text you when he gets home, but hours pass with no message.`,
    choices: [
      { text: "Check your phone for messages", next: "checkPhone" },
      { text: "Go to Josh's house", next: "goToHouse" },
    ],
  },
  checkPhone: {
    character: 'Philip',
    text: `Your phone shows no new messages from Josh. You feel uneasy.`,
    choices: [
      { text: "Go to Josh's house", next: "goToHouse" },
      { text: "Wait a little longer", next: "waitLonger" },
    ],
  },
  goToHouse: {
    character: "Josh's Brother",
    text: `You arrive at Josh's house. His brother answers the door and says Josh never came home.`,
    choices: [
      { text: "Ask about Josh's friends", next: "askFriends" },
      { text: "Check Josh's social media", next: "checkSocial" },
    ],
  },
  waitLonger: {
    character: 'Philip',
    text: `You wait, but still no word from Josh. The rain keeps falling.`,
    choices: [
      { text: "Go to Josh's house", next: "goToHouse" },
    ],
  },
  askFriends: {
    character: "Josh's Brother",
    text: `Josh's brother mentions Nate and Aliya. Maybe they know something.`,
    choices: [
      { text: "Look up Nate's last messages", next: "checkNate" },
      { text: "Look up Aliya's posts", next: "checkAliya" },
    ],
  },
  checkSocial: {
    character: 'Philip',
    text: `Josh's social media shows a cryptic post from earlier today: "Don't trust anyone."`,
    choices: [
      { text: "Investigate further", next: "investigateFurther" },
    ],
  },
  checkNate: {
    character: 'Nate',
    text: `Nate's last message to Josh was a joke about meeting up tomorrow. Nothing suspicious.`,
    choices: [
      { text: "Check Aliya's posts", next: "checkAliya" },
      { text: "Go back", next: "askFriends" },
    ],
    onEnter: () => {
      addClue("Nate's last message was a joke, no threat detected.");
      addSuspect("Nate");
    }
  },
  checkAliya: {
    character: 'Aliya',
    text: `Aliya posted a photo with Josh two days ago with the caption: "Missing you already."`,
    choices: [
      { text: "Look for more posts", next: "moreAliya" },
      { text: "Go back", next: "askFriends" },
    ],
    onEnter: () => {
      addClue("Aliya's social media shows affection towards Josh.");
      addSuspect("Aliya");
    }
  },
  moreAliya: {
    character: 'Aliya',
    text: `A recent post shows Aliya arguing with Josh in a comment thread. Tensions might be higher than they seem.`,
    choices: [
      { text: "Go back", next: "checkAliya" },
    ],
    onEnter: () => {
      addNote("Aliya and Josh had a recent argument on social media.");
    }
  },
  investigateFurther: {
    character: 'Philip',
    text: `You decide to dig deeper into Josh's online activity and diary entries.`,
    choices: [
      { text: "Check Josh's diary", next: "checkDiary" },
      { text: "Look up Josh's last location", next: "checkLocation" },
    ],
  },
  checkDiary: {
    character: 'Philip',
    text: `Josh's diary is here. You can read it.`,
    diary: true,
    choices: [
      { text: "Look up the homeless man", next: "checkHomeless" },
      { text: "Go back", next: "investigateFurther" },
    ],
    onEnter: () => {
      addClue("Josh's diary might hold important information.");
    }
  },
  checkHomeless: {
    character: 'Homeless Man',
    text: `The homeless man is known locally but has no clear motive. He was seen near the park the night Josh disappeared.`,
    choices: [
      { text: "Go back", next: "checkDiary" },
    ],
    onEnter: () => {
      addSuspect("Homeless Man");
    }
  },
  checkLocation: {
    character: 'Philip',
    text: `Josh's location tracker last pinged near the park, close to where you were earlier.`,
    choices: [
      { text: "Go back", next: "investigateFurther" },
    ],
    onEnter: () => {
      addClue("Josh's last known location was near the park.");
    }
  }
};

// Start the game
showScene('start');
