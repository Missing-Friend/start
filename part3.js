(() => {
  const gameScreen = document.getElementById('game-screen');
  const currentCharacter = document.getElementById('current-character');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const closeInfo = document.getElementById('close-info');

  // ---------- Game state ----------
  const BLIZZARD_SECONDS = 4 * 60; // time before the storm becomes fatal
  const visited = { shed: false, hut: false, tracks: false };
  let hasFlashlight = false;
  let gameOver = false;
  let secondsLeft = BLIZZARD_SECONDS;
  let timerInterval = null;
  const gatheredInfo = [];

  // ---------- Info panel ----------
  // Note: part 2's script.js is not loaded on this page, so the panel is wired up here.
  // If you carry info over from earlier parts with localStorage, load it into gatheredInfo here.
  function addInfo(text) {
    if (gatheredInfo.includes(text)) return;
    gatheredInfo.push(text);
    renderInfo();
  }

  function renderInfo() {
    infoContent.innerHTML = '';
    if (gatheredInfo.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Nothing yet.';
      infoContent.appendChild(empty);
      return;
    }
    gatheredInfo.forEach(text => {
      const entry = document.createElement('div');
      entry.className = 'info-entry';
      entry.textContent = text;
      infoContent.appendChild(entry);
    });
  }

  infoButton.onclick = () => { infoPanel.style.display = 'block'; };
  closeInfo.onclick = () => { infoPanel.style.display = 'none'; };

  // ---------- Helpers ----------
  function clearScreen() {
    gameScreen.innerHTML = '';
  }

  function addText(text, className) {
    const p = document.createElement('p');
    p.textContent = text;
    if (className) p.className = className;
    gameScreen.appendChild(p);
    return p;
  }

  function addButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = onClick;
    gameScreen.appendChild(btn);
    return btn;
  }

  // ---------- Blizzard timer ----------
  function startTimer() {
    stopTimer();
    renderTimer();
    timerInterval = setInterval(() => {
      secondsLeft--;
      renderTimer();
      if (secondsLeft <= 0) {
        stopTimer();
        frozenEnding();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function renderTimer() {
    const m = Math.floor(secondsLeft / 60);
    const s = String(secondsLeft % 60).padStart(2, '0');
    currentCharacter.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'blizzard-timer' + (secondsLeft <= 30 ? ' urgent' : '');
    span.textContent = `Storm closing in: ${m}:${s}`;
    currentCharacter.appendChild(span);
  }

  function frozenEnding() {
    if (gameOver) return;
    gameOver = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: black; opacity: 0; transition: opacity 2s;
      z-index: 9999; display: flex; flex-direction: column;
      align-items: center; justify-content: center; color: white;
      text-align: center; padding: 2em; box-sizing: border-box;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 50);

    setTimeout(() => {
      const msg = document.createElement('p');
      msg.textContent = 'The storm swallowed everything. By the time anyone reaches this place, there is nothing left to find.';
      msg.style.maxWidth = '30em';
      overlay.appendChild(msg);

      const retry = document.createElement('button');
      retry.textContent = 'Try again';
      retry.onclick = () => window.location.reload();
      overlay.appendChild(retry);
    }, 2200);
  }

  // ---------- Scenes ----------
  function startChapter() {
    renderInfo();
    clearScreen();
    addText('PART 3: THE END OF THE WORLD', 'location-tag');
    addText(
      'The plane drops you on a strip of packed ice and is gone before you can finish saying thank you. ' +
      'The wind is deafening. Every direction looks the same: white, and then more white.'
    );
    addText(
      'Your GPS blinks at 72°00\'36.0"S, 168°34\'40.0"E. You are in the right place. ' +
      'Through the snow you can make out a small research station, a shed, and a line of tracks leading away from both.'
    );
    addText('A storm is rolling in. You do not have long.');
    addInfo('Location: 72°00\'36.0"S 168°34\'40.0"E. A remote research station in Antarctica.');

    addButton('Start looking', () => {
      startTimer();
      showHub();
    });
  }

  function canEnterCave() {
    return visited.tracks;
  }

  function showHub() {
    if (gameOver) return;
    clearScreen();
    addText('Where do you go?');

    if (!visited.shed) addButton('Check the supply shed', visitShed);
    if (!visited.hut) addButton('Go inside the main hut', visitHut);
    if (!visited.tracks) addButton('Follow the tracks in the snow', visitTracks);
    if (canEnterCave()) addButton('Enter the ice cave', enterCave);
  }

  function visitShed() {
    visited.shed = true;
    hasFlashlight = true;
    clearScreen();
    addText(
      'The shed door is frozen half open. Inside are shelves of tools, a coil of rope, and a heavy parka that is still ' +
      'slightly warm, like someone was wearing it not long ago.'
    );
    addText('You take a flashlight from the shelf. The batteries are fresh.');
    addInfo('Supply shed: a parka that was recently worn. Took a flashlight.');
    addButton('Back outside', showHub);
  }

  function visitHut() {
    visited.hut = true;
    clearScreen();
    addText(
      'Inside the hut it is almost as cold as outside. A radio sits on the desk, crackling with static. ' +
      'Beside it is an open logbook.'
    );
    addText(
      'The last few entries are normal weather readings. Then the handwriting changes, rushed and shaky. ' +
      'The final line is only three words: "It\'s under us."'
    );
    addInfo('Station logbook: the last entry reads "It\'s under us."');
    addInfo('The radio is still on, but it only picks up static.');
    addButton('Back outside', showHub);
  }

  function visitTracks() {
    visited.tracks = true;
    clearScreen();
    addText(
      'The tracks are boot prints, and they are fresh. They lead away from the station and stop at a dark opening ' +
      'in the ice, half hidden by a drift of snow.'
    );
    addText('Someone went in. You see no prints coming back out.');
    addInfo('Boot prints lead into an ice cave. None lead back out.');
    addButton('Back outside', showHub);
  }

  function enterCave() {
    if (!hasFlashlight) {
      clearScreen();
      addText('The cave is pitch black. You will not get ten steps without a light. Find one first.');
      addButton('Back outside', showHub);
      return;
    }

    stopTimer();
    currentCharacter.innerHTML = '';
    clearScreen();
    addText('THE ICE CAVE', 'location-tag');
    addText(
      'Your flashlight cuts through the dark. The walls shine blue and the wind fades to a low hum. ' +
      'The tunnel slopes down, deeper than any natural cave should go.'
    );
    addText(
      'At the bottom, slumped against the ice with a blanket around his shoulders, is Josh. ' +
      'He looks up at your light and tries to smile.'
    );
    addButton('Run to him', foundJosh);
  }

  function foundJosh() {
    clearScreen();
    addText('"You came," Josh whispers. His lips are cracked and his voice is barely there. "I didn\'t think anyone would listen."');
    addText('"You have to see this before they come back." He points behind you, deeper into the cave, where a faint light is pulsing.');
    addInfo('Josh was found alive in the ice cave. Something deeper in the cave is giving off a pulsing light.');
    addButton('Look at what is behind you', () => {
      clearScreen();
      addText('The light grows brighter as you turn. And then you hear footsteps in the tunnel above you.');
      addText('You are not alone down here.');
      addButton('Next', () => {
        // Change this if you name the next part something else
        window.location.href = 'part4.html';
      });
    });
  }

  // ---------- Go ----------
  startChapter();
})();
