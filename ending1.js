(() => {
  const stage = document.getElementById('stage');
  const player = document.getElementById('player');
  const shadow = document.getElementById('shadow');
  const slash = document.getElementById('slash');
  const flash = document.getElementById('flash');
  const cover = document.getElementById('cover');
  const endingText = document.getElementById('ending-text');
  const retry = document.getElementById('retry');

  // Where "Try again" sends the player
  const RETRY_URL = 'part3.html';

  retry.onclick = () => { window.location.href = RETRY_URL; };

  function at(ms, fn) {
    setTimeout(fn, ms);
  }

  function showEnding() {
    endingText.classList.add('show');
    at(4500, () => retry.classList.add('show'));
  }

  // Skip the animation for people who ask their system to reduce motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showEnding();
    return;
  }

  // ---------- Timeline ----------

  // 0.0s: fade in, your character walks alone
  at(300, () => {
    stage.classList.add('visible');
    player.classList.add('walking');
    player.style.left = '36%';
  });

  // 4.8s: you stop; a shadow appears at the edge of the dark
  at(4800, () => {
    player.classList.remove('walking');
    player.classList.add('stop');
    // Freeze the player where it currently is
    player.style.left = getComputedStyle(player).left;
  });

  at(5600, () => {
    shadow.classList.add('show');
  });

  // 8.0s: the shadow rushes you
  at(8000, () => {
    shadow.classList.add('running');
    shadow.classList.add('rush');
    shadow.querySelectorAll('.leg').forEach(l => l.style.animationPlayState = 'running');
  });

  // 8.7s: impact (white slash, red flash, screen shake)
  at(8650, () => {
    slash.classList.add('go');
    flash.classList.add('go');
    stage.classList.add('shake');
  });

  at(8800, () => {
    flash.classList.remove('go');
    flash.classList.add('red');
    void flash.offsetWidth; // restart the animation
    flash.classList.add('go');
  });

  // 9.0s: cut to black, the shadow is gone when the picture comes back
  at(9000, () => {
    cover.classList.add('on');
    shadow.classList.add('gone');
    player.classList.add('hit');
  });

  at(10000, () => {
    cover.style.transition = 'opacity 0.4s';
    cover.classList.remove('on');
  });

  // 11.0s: your character falls to the floor
  at(11300, () => {
    player.classList.remove('hit');
    player.classList.add('down');
  });

  // 13.5s: fade everything to black
  at(13500, () => {
    stage.classList.add('faded');
  });

  // 16.2s: the red text fades in
  at(16200, showEnding);
})();
