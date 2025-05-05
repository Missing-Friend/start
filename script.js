(() => {
  // --- DOM References ---
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');

  // --- Game State ---
  let gatheredInfo = { clues: [], suspects: [], notes: [] };
  let introducedCharacters = new Set();
  let currentSceneKey = null;
  let historyStack = [];
  let placesUnlocked = new Set(['Your House']);
  let currentLocation = 'Your House';
  let peopleMet = new Set(['Philip']);
  let phoneActive = false;
  let currentCallPerson = null;
  let checkBackEnabled = false;

  // --- Diary pages ---
  const diaryPages = [
    `"Diary Entry 1/10/25"\n\nI have seen some things.. Pretty bad things before. But this thing.. It SCARES me!\nMost people would just keep walking, but I got too curious..\nI haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\nThere was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!\nI'm running out of time, so when I run around town, they're gonna feel this one!\nLike a magic GONE! Its like he was a magician with a New Magic Wand!\n\nI don't have enough page space for this.. I have to write a new page.."`,
    // Second page ripped out
  ];

  // --- Utility functions ---
  function addClue(clue) { if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue); }
  function addSuspect(suspect) { if (!gatheredInfo.suspects.includes(suspect)) gatheredInfo.suspects.push(suspect); }
  function addNote(note) { if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note); }
  function addPersonMet(name) { peopleMet.add(name); }
  function addPlace(name) {
    if (!placesUnlocked.has(name)) {
      placesUnlocked.add(name);
      showNewPlaceNotification(name);
      if (name === 'Park') {
        fadeInMapButton();
      }
    }
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

  // --- Character info map ---
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

  // --- Back button ---
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

  // --- Map button ---
  let mapButton = null;
  function createMapButton() {
    if (!mapButton) {
      mapButton = document.createElement('button');
      mapButton.textContent = 'Map';
      mapButton.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4a4;
        color: #afa;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 1s ease;
        z-index: 5000;
      `;
      mapButton.onclick = showMap;
      document.body.appendChild(mapButton);
    }
  }
  function fadeInMapButton() {
    createMapButton();
    setTimeout(() => {
      mapButton.style.opacity = '1';
    }, 100);
  }
  function showMap() {
    const overlay = document.createElement('div');
    overlay.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      display: flex;
      justify-content: center;
      align-items: center;
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
    `;

    const title = document.createElement('h2');
    title.textContent = 'Locations';
    title.style.color = '#afa';
    title.style.textAlign = 'center';
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
        currentLocation = place;
        showScene(place.toLowerCase().replace(/ /g, ''));
        document.body.removeChild(overlay);
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

  // --- Diary popup ---
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
      font-family: 'Georgia', serif;
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

  // --- Unlock Page Pieces Mechanic ---
  let pagePiecesUnlocked = false;
  function unlockPagePiecesMechanic() {
    if (pagePiecesUnlocked) return;
    pagePiecesUnlocked = true;
    addPlace("Josh's House");
    addPlace("Park");
    addPlace("Local Police Station");
    addPlace("Cafe He Visits");
    enableCheckBackMechanic();
  }

  // --- Check Back Mechanic ---
  let personIconsUI = null;
  function enableCheckBackMechanic() {
    if (checkBackEnabled) return;
    checkBackEnabled = true;
    createPersonIconsUI();
  }
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

  // --- Phone UI and calls ---
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
        { q: 'Why do you have some of Josh’s diary pages?', a: 'I wanted to protect him...' },
        { q: 'Have you noticed anything strange lately?', a: 'Josh has been acting distant...' }
      ],
      'Nicholas': [
        { q: 'Why did you take some diary pieces?', a: 'I don’t want to get involved...' },
        { q: 'Did Josh tell you about the homeless man?', a: 'He mentioned it once...' }
      ],
      'Lily': [
        { q: 'Why do you have some torn diary pages?', a: 'We found them and thought it was a game...' },
        { q: 'Did Josh seem scared of anyone?', a: 'Yeah, sometimes he looked over his shoulder...' }
      ],
      'Bri': [
        { q: 'Did you hide diary pages in Josh’s closet?', a: 'Maybe... I just didn’t want him to get in trouble.' },
        { q: 'Do you know anything about the homeless man?', a: 'I heard rumors but never saw him myself.' }
      ],
      'Nate': [
        { q: 'Did Josh say anything about being scared?', a: 'Not really, just usual stuff...' },
        { q: 'Do you know about the diary pages?', a: 'No clue, man.' }
      ],
      'Aliya': [
        { q: 'Why did Josh seem “off” lately?', a: 'He was stressed, but he didn’t want to talk about it.' },
        { q: 'Did you see Josh after the park?', a: 'No, he disappeared after that day.' }
      ]
    };
    const questions = questionsMap[personName] || [{ q: 'No questions available.', a: '' }];
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
      btn.onclick = () => { dialogueContainer.textContent = a || 'No response.'; };
      questionsContainer.appendChild(btn);
    });
  }

  // --- Scenes object ---
  const scenes = {
    // Your existing scenes here (start, checkPhone, joshsHouse, park, etc.)
    // Add new scenes for Local Police Station and Cafe He Visits:
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
    // Add placeholder scenes for fileReport, askRegulars, etc.
    fileReport: {
      character: 'Sergeant Miller',
      location: 'Local Police Station',
      text: `You file a report about Josh's disappearance. Sergeant Miller promises to look into it.`,
      choices: [
        { text: "Go back", next: "localpolicestation" }
      ]
    },
    askRegulars: {
      character: 'Barista',
      location: 'Cafe He Visits',
      text: `The barista mentions a few regulars who might know more about Josh's recent behavior.`,
      choices: [
        { text: "Go back", next: "cafehevisits" }
      ]
    },
    // Add all other scenes you had previously, making sure all .next keys exist
  };

  // --- Show Scene function and all other functions remain as previously defined ---

  // --- Start game ---
  showScene('start');
})();
