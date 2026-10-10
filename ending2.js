(() => {
  const side = document.getElementById('e2-side');
  const player = document.getElementById('e2-player');
  const obstacle = document.getElementById('e2-obstacle');
  const pov = document.getElementById('e2-pov');
  const man = document.getElementById('e2-man');
  const knife = document.getElementById('e2-knife');
  const cover = document.getElementById('e2-cover');
  const flash = document.getElementById('e2-flash');
  const text = document.getElementById('e2-text');
  const retry = document.getElementById('e2-retry');

  // Where "Try again" sends the player (part 4 starts fresh from your part 3 results)
  const RETRY_URL = 'part4.html';
  const PART4_KEY = 'missing_part4';

  retry.onclick = () => { window.location.href = RETRY_URL; };

  function at(ms, fn) { setTimeout(fn, ms); }

  // Which obstacle ended the run? Part 4 saves it when the 4th mistake happens.
  //   'ledge' = you did not drop in time, so you take it in the head
  //   'crack' = you did not jump in time, so you slip
  function failedObstacle() {
    try {
      const saved = JSON.parse(localStorage.getItem(PART4_KEY));
      if (saved && (saved.failedObstacle === 'ledge' || saved.failedObstacle === 'crack')) {
        return saved.failedObstacle;
      }
    } catch (e) {
      // No saved data. Fall back to a random one below.
    }
    return Math.random() < 0.5 ? 'ledge' : 'crack';
  }

  function showEnding() {
    text.classList.add('show');
    at(4500, () => retry.classList.add('show'));
  }

  // Skip the animation for people who ask their system to reduce motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    flash.classList.add('big', 'red');
    flash.style.transition = 'none';
    flash.style.backgroundColor = '#8a0000';
    showEnding();
    return;
  }

  const kind = failedObstacle();
  obstacle.className = kind;

  // ---------- Timeline ----------

  // 0.3s: fade in, you run toward the obstacle
  at(300, () => {
    side.classList.add('visible');
    player.classList.add('running');
    obstacle.style.transition = 'left 2.6s linear';
    obstacle.style.left = '12%';
  });

  // 2.9s: you don't make the move
  at(2900, () => {
    player.classList.remove('running');
    if (kind === 'ledge') {
      // Head meets ice
      flash.classList.add('small');
      side.classList.add('shake');
      player.classList.add('hit-head');
      player.classList.add('knocked');
    } else {
      // Your foot catches and you slip
      player.classList.add('slip');
      side.classList.add('shake');
    }
  });

  // 4.0s: cut to black
  at(4000, () => {
    cover.classList.add('on');
  });

  // 4.8s: first-person view from the ground; the cover fades off
  at(4800, () => {
    side.style.display = 'none';
    pov.classList.add('on');
    cover.classList.add('slow');
    cover.classList.remove('on');
  });

  // 6.2s: a figure begins to appear in the dark
  at(6200, () => {
    man.classList.add('show');
  });

  // 8.8s: he walks closer
  at(8800, () => {
    man.classList.add('approach');
  });

  // 11.6s: the blade comes up
  at(11600, () => {
    knife.classList.add('show');
  });

  // 12.8s: he lunges, straight at your face
  at(12800, () => {
    man.classList.add('lunge');
    knife.classList.add('thrust');
  });

  // 13.1s: white flash
  at(13100, () => {
    flash.classList.add('big');
    pov.classList.remove('on');
  });

  // 13.5s: the white bleeds into red
  at(13500, () => {
    flash.classList.add('red');
  });

  // 16.5s: black letters fade in on the red
  at(16500, showEnding);
})();
