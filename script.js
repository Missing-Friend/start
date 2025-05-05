(() => {
  // Mapping from place names to scene keys
  const placeToSceneKey = {
    "Your House": "start",
    "Josh's House": "joshsHouse",
    "Park": "park",
    "Local Police Station": "localpolicestation",
    "Cafe He Visits": "cafehevisits"
  };

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

  // Diary pages
  const diaryPages = [
    `"Diary Entry 1/10/25"\n\nI have seen some things.. Pretty bad things before. But this thing.. It SCARES me!\nMost people would just keep walking, but I got too curious..\nI haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\nThere was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!\nI'm running out of time, so when I ride around town, he'll feel this one!\nLike magic, GONE! Its like he was a magician with a New Magic Wand!\n\nI don't have enough page space for this.. I have to write a new page.."`,
  ];

  // Utility functions
  function addClue(clue) { if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue); }
  function addSuspect(suspect) { if (!gatheredInfo.suspects.includes(suspect)) gatheredInfo.suspects.push(suspect); }
  function addNote(note) { if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note); }
  function addPersonMet(name) { peopleMet.add(name); }
  function addPlace(name) {
    if (!placesUnlocked.has(name)) {
      placesUnlocked.add(name);
      showNewPlaceNotification(name);
      if (name === 'Park') fadeInMapButton();
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

  // Character info map
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

  // Back button
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

  // Map button fade in
  function fadeInMapButton() {
    mapButton.style.display = 'block';
    setTimeout(() => {
      mapButton.style.opacity = '1';
    }, 100);
  }

  mapButton.onclick = () => {
    showMap();
  };

  // Show map overlay with correct navigation
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

  // Diary popup
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

  // Unlock page pieces mechanic
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

  // Phone call mechanic (implement as needed)...

  // Scenes object with all scenes and valid keys
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
    localpolicestation: {
      character: 'Sergeant Miller',
      location: 'Local Police Station',
      text: `The police station is quiet. Sergeant Miller looks up from his desk. "Can I help you with something?"`,
      choices: [
        { text: "Report Josh missing", next: "fileReport" },
        { text: "Go back", next: "start" }
      ],
      onEnter: () => { addPlace("Local Police Station"); addPersonMet('Sergeant Miller'); }
    },
    cafehevisits: {
      character: 'Barista',
      location: 'Cafe He Visits',
      text: `The café is cozy with the smell of fresh coffee. The barista recognizes you. "Josh? He hasn't been in today."`,
      choices: [
        { text: "Ask about regular customers", next: "askRegulars" },
        { text: "Go back", next: "start" }
      ],
      onEnter: () => { addPlace("Cafe He Visits"); addPersonMet('Barista'); }
    },
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

  // Show scene function, location selector, character intro, updateCurrentCharacter, info panel, back button, etc.
  // (Use the same implementations as in previous messages, ensuring all references are consistent.)

  // Start the game
  showScene('start');
})();
