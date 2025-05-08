(() => {
  const gameScreen = document.getElementById('game-screen');

  // Game state
  let choiceMade = false;
  let foundComputer = false;
  let computerUnlocked = false;
  let searchedLocation = false;
  let timerId = null;

  // Start the chapter
  function startChapter() {
    showChoiceMenu();
  }

  // Show the one-time choice menu with options
  function showChoiceMenu() {
    if (choiceMade) {
      // If choice already made, show next scene or message
      if (computerUnlocked) {
        showComputerOption();
      } else {
        showExploreOptions();
      }
      return;
    }

    gameScreen.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = 'Choose your next move to find Josh:';
    gameScreen.appendChild(title);

    const options = [
      { text: 'Search the park for clues', action: () => findClue('Park') },
      { text: 'Talk to Josh\'s friends', action: () => findClue('Friends') },
      { text: 'Check Josh\'s social media', action: () => findClue('SocialMedia') },
      { text: 'Look around Josh\'s house', action: () => findClue('House') }
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.onclick = () => {
        if (choiceMade) return; // prevent multiple clicks
        choiceMade = true;
        opt.action();
      };
      gameScreen.appendChild(btn);
    });
  }

  // Handle finding clues based on choice
  function findClue(location) {
    gameScreen.innerHTML = '';
    const p = document.createElement('p');
    switch(location) {
      case 'Park':
        p.textContent = 'You find a torn piece of paper near the bench. It mentions Josh was worried about someone.';
        break;
      case 'Friends':
        p.textContent = 'Josh\'s friends mention he was acting strange lately and talked about a secret location.';
        break;
      case 'SocialMedia':
        p.textContent = 'You find a cryptic message on Josh\'s social media hinting at a website: gotube.com.';
        break;
      case 'House':
        p.textContent = 'You discover Josh\'s computer is still on, with a note: "Use this to find me."';
        foundComputer = true;
        computerUnlocked = true;
        break;
    }
    gameScreen.appendChild(p);

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Continue';
    nextBtn.onclick = () => {
      if (computerUnlocked) {
        showComputerOption();
      } else {
        showExploreOptions();
      }
    };
    gameScreen.appendChild(nextBtn);
  }

  // Show options after initial clue search
  function showExploreOptions() {
    gameScreen.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = 'Where do you want to go next?';
    gameScreen.appendChild(p);

    const options = [
      { text: 'Search more clues', action: () => { choiceMade = false; showChoiceMenu(); } }
    ];

    if (computerUnlocked) {
      options.push({ text: 'Use Josh\'s computer', action: showComputerSimulation });
    }

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.onclick = opt.action;
      gameScreen.appendChild(btn);
    });
  }

  // Show option to use the computer or leave it
  function showComputerOption() {
    gameScreen.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = 'You have found Josh\'s computer. Do you want to use it or try to find Josh without it?';
    gameScreen.appendChild(p);

    const useBtn = document.createElement('button');
    useBtn.textContent = 'Use Josh\'s computer';
    useBtn.onclick = showComputerSimulation;
    gameScreen.appendChild(useBtn);

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Leave it and continue searching';
    skipBtn.onclick = () => {
      computerUnlocked = false; // lock computer option
      showExploreOptions();
    };
    gameScreen.appendChild(skipBtn);
  }

  // Computer simulation UI
  function showComputerSimulation() {
    gameScreen.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Josh\'s Computer';
    gameScreen.appendChild(title);

    const info = document.createElement('p');
    info.textContent = 'You can only search: gotube.com';
    gameScreen.appendChild(info);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Enter website URL...';
    searchInput.style.width = '80%';
    gameScreen.appendChild(searchInput);

    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'Go';
    gameScreen.appendChild(searchBtn);

    const resultDiv = document.createElement('div');
    resultDiv.style.marginTop = '1em';
    gameScreen.appendChild(resultDiv);

    // Start 2-minute timer for searching location
    if (timerId) clearTimeout(timerId);
    searchedLocation = false;
    timerId = setTimeout(() => {
      if (!searchedLocation) {
        fadeToBlackAndRedirectLate();
      }
    }, 2 * 60 * 1000); // 2 minutes

    searchBtn.onclick = () => {
      const url = searchInput.value.trim().toLowerCase();
      if (url !== 'gotube.com') {
        resultDiv.textContent = 'Access denied. You can only visit gotube.com.';
        return;
      }
      showGoTubePage(resultDiv);
    };
  }

  // Show gotube.com page simulation
  function showGoTubePage(container) {
    container.innerHTML = '';

    const profileBtn = document.createElement('button');
    profileBtn.textContent = 'Josh\'s Profile';
    container.appendChild(profileBtn);

    profileBtn.onclick = () => {
      showJoshVideo(container);
    };
  }

  // Show Josh's video with message
  function showJoshVideo(container) {
    container.innerHTML = '';

    const videoText = document.createElement('p');
    videoText.style.whiteSpace = 'pre-wrap';
    videoText.textContent =
`If you're watching this, you're a good listener and you want to help...
The only way to help is by going to this location (34°42'03.5"N 135°49'16.6"E)

Please... there's not much time...`;

    container.appendChild(videoText);

    searchedLocation = true; // Player found the location in time

    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.onclick = () => {
      clearTimeout(timerId);
      continueGame();
    };
    container.appendChild(continueBtn);
  }

  // Fade to black and redirect to late.html if player fails to find location in time
  function fadeToBlackAndRedirectLate() {
    const overlay = document.createElement('div');
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: black; opacity: 0; transition: opacity 2s;
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 50);
    setTimeout(() => {
      window.location.href = 'late.html';
    }, 2050);
  }

  // Continue the game after watching video and finding location
  function continueGame() {
    gameScreen.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = 'You have the location. Time to find Josh!';
    gameScreen.appendChild(p);

    // TODO: Add next steps or scenes here as you want

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => {
      alert('Next part coming soon!');
      // Replace with your next scene or function
    };
    gameScreen.appendChild(nextBtn);
  }

  // Start the chapter on load
  startChapter();
})();
