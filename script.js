(() => {
  // Declare backButton once here
  let backButton = null;

  // DOM references
  const gameScreen = document.getElementById('game-screen');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const closeInfo = document.getElementById('close-info');
  const infoContent = document.getElementById('info-content');
  const currentCharacterDiv = document.getElementById('current-character');

  // Game state variables
  let gatheredInfo = { clues: [], suspects: [], notes: [] };
  let introducedCharacters = new Set();
  let currentSceneKey = null;
  let historyStack = [];
  let placesUnlocked = new Set(['Your House']);
  let currentLocation = 'Your House';
  let peopleMet = new Set(['Philip']);
  let phoneActive = false;
  let currentCallPerson = null;

  // Diary pages content
  const diaryPages = [
    `"Diary Entry 1/10/25"\n\nI have seen some things.. Pretty bad things before. But this thing.. It SCARES me!\nMost people would just keep walking, but I got too curious..\nI haven't really been as traumatized as I've ever been, Aliya even thinks I'm "off"!\n\nThere was this man in the park.. and it wasn't some ordinary man.. It wasn't the nice homeless man I've talked to before. No, this man is a monster!\nI'm running out of time, so when I run around town, they're gonna feel this one!\nLike a magic GONE! Its like he was a magician with a New Magic Wand!\n\nI don't have enough page space for this.. I have to write a new page.."`,
    // Second page ripped out
  ];

  // Utility functions (addClue, addSuspect, etc.)
  function addClue(clue) { if (!gatheredInfo.clues.includes(clue)) gatheredInfo.clues.push(clue); }
  function addSuspect(suspect) { if (!gatheredInfo.suspects.includes(suspect)) gatheredInfo.suspects.push(suspect); }
  function addNote(note) { if (!gatheredInfo.notes.includes(note)) gatheredInfo.notes.push(note); }
  function addPersonMet(name) { peopleMet.add(name); }
  function addPlace(name) { if (!placesUnlocked.has(name)) { placesUnlocked.add(name); showNewPlaceNotification(name); } }

  function showNewPlaceNotification(placeName) {
    const notif = document.createElement('div');
    notif.textContent = `${placeName} has been added to your logbook...`;
    notif.style = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #222; color: #afa; padding: 12px 24px; border-radius: 10px;
      font-weight: 700; font-size: 1.2rem; opacity: 0; transition: opacity 1s ease;
      z-index: 5000; user-select: none;`;
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

  // Phone UI creation and call logic (omitted here for brevity, use previous full code)

  // Create back button once
  function createBackButton() {
    if (!backButton) {
      backButton = document.createElement('button');
      backButton.textContent = 'Go Back';
      backButton.style.marginRight = '10px';
      backButton.onclick = goBack;
    }
  }

  // Go back function
  function goBack() {
    if (historyStack.length === 0) return;
    const prevScene = historyStack.pop();
    currentSceneKey = null;
    showScene(prevScene, false);
  }

  // Scenes object - ensure all referenced scenes exist here (use your full scenes object)

  // Show scene function with error handling
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

  // Location selector UI (use previous full code)

  // Character intro, updateCurrentCharacter, info panel, diary popup, check back mechanic, phone UI, etc.
  // Use the full implementations from the previous full code I provided.

  // Start the game
  showScene('start');
})();
