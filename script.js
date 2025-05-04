const gameScreen = document.getElementById('game-screen');

const scenes = {
  start: {
    text: `It’s a foggy, rainy evening in Arlington. You and your friend Josh just left the park. You ask him to text you when he gets home, but hours pass with no message.`,
    choices: [
      { text: "Check your phone for messages", next: "checkPhone" },
      { text: "Go to Josh's house", next: "goToHouse" },
    ],
  },
  checkPhone: {
    text: `Your phone shows no new messages from Josh. You feel uneasy.`,
    choices: [
      { text: "Go to Josh's house", next: "goToHouse" },
      { text: "Wait longer", next: "waitLonger" },
    ],
  },
  goToHouse: {
    text: `You arrive at Josh's house. His brother answers the door and says Josh never came home.`,
    choices: [
      { text: "Ask about Josh's friends", next: "askFriends" },
      { text: "Check Josh's social media", next: "checkSocial" },
    ],
  },
  waitLonger: {
    text: `You wait, but still no word from Josh. The rain keeps falling.`,
    choices: [
      { text: "Go to Josh's house", next: "goToHouse" },
    ],
  },
  askFriends: {
    text: `Josh's brother mentions Nate and Aliya. Maybe they know something.`,
    choices: [
      { text: "Look up Nate's last messages", next: "checkNate" },
      { text: "Look up Aliya's posts", next: "checkAliya" },
    ],
  },
  checkSocial: {
    text: `Josh's social media shows a cryptic post from earlier today: "Don't trust anyone."`,
    choices: [
      { text: "Investigate further", next: "investigateFurther" },
    ],
  },
  // Add more scenes here...
};

function showScene(sceneKey) {
  const scene = scenes[sceneKey];
  gameScreen.innerHTML = `<p>${scene.text}</p>`;
  scene.choices.forEach(choice => {
    const button = document.createElement('button');
    button.textContent = choice.text;
    button.onclick = () => showScene(choice.next);
    gameScreen.appendChild(button);
  });
}

// Start the game
showScene('start');
