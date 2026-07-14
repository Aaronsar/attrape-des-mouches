(() => {
  'use strict';

  const GAME_DURATION = 60;
  const COMBO_THRESHOLD = 3;
  const COMBO_MULTIPLIER = 2;
  const PENALTY = 5;

  const FLY_TYPES = {
    normal: { emoji: '🪰', points: 10, speed: 1, lifetime: 5000, weight: 70, className: '' },
    fast:   { emoji: '🪰', speed: 2.2, points: 25, lifetime: 3500, weight: 22, className: 'fast' },
    golden: { emoji: '✨', speed: 1.5, points: 50, lifetime: 2500, weight: 8, className: 'golden' },
  };

  const MESSAGES = [
    { min: 0,   text: 'Tu peux faire mieux ! Réessaie !' },
    { min: 100, text: 'Pas mal pour un débutant !' },
    { min: 250, text: 'Belle chasse ! Tu as le reflexe.' },
    { min: 400, text: 'Impressionnant ! Expert en mouches.' },
    { min: 600, text: 'LÉGENDAIRE ! Personne n\'attrape comme toi !' },
  ];

  // DOM
  const screens = {
    home: document.getElementById('screen-home'),
    game: document.getElementById('screen-game'),
    end:  document.getElementById('screen-end'),
  };
  const gameArea     = document.getElementById('game-area');
  const scoreEl      = document.getElementById('score');
  const timerEl      = document.getElementById('timer');
  const comboEl      = document.getElementById('combo');
  const comboBanner  = document.getElementById('combo-banner');
  const bestScoreEl  = document.getElementById('best-score');
  const finalScoreEl = document.getElementById('final-score');
  const endMessageEl = document.getElementById('end-message');
  const newRecordEl  = document.getElementById('new-record');
  const statCaught   = document.getElementById('stat-caught');
  const statMissed   = document.getElementById('stat-missed');
  const statBestCombo = document.getElementById('stat-best-combo');

  // State
  let state = {};
  let rafId = null;
  let spawnTimer = null;
  let countdownTimer = null;

  function loadBestScore() {
    return parseInt(localStorage.getItem('attrape-mouches-best') || '0', 10);
  }

  function saveBestScore(score) {
    localStorage.setItem('attrape-mouches-best', String(score));
  }

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function pickFlyType() {
    const total = Object.values(FLY_TYPES).reduce((s, t) => s + t.weight, 0);
    let roll = Math.random() * total;
    for (const [key, type] of Object.entries(FLY_TYPES)) {
      roll -= type.weight;
      if (roll <= 0) return { key, ...type };
    }
    return { key: 'normal', ...FLY_TYPES.normal };
  }

  function getDifficultyMultiplier() {
    const elapsed = GAME_DURATION - state.timeLeft;
    return 1 + elapsed / GAME_DURATION * 1.5;
  }

  function getSpawnInterval() {
    const diff = getDifficultyMultiplier();
    return Math.max(400, 1200 - diff * 300);
  }

  function spawnFly() {
    if (!state.running) return;

    const type = pickFlyType();
    const area = gameArea.getBoundingClientRect();
    const size = 48;
    const x = Math.random() * (area.width - size);
    const y = Math.random() * (area.height - size);

    const fly = document.createElement('div');
    fly.className = `fly ${type.className}`;
    fly.textContent = type.emoji;
    fly.style.left = `${x}px`;
    fly.style.top = `${y}px`;
    fly.setAttribute('role', 'button');
    fly.setAttribute('aria-label', 'Mouche — clique pour attraper');

    const diff = getDifficultyMultiplier();
    const angle = Math.random() * Math.PI * 2;
    const speed = type.speed * diff * (0.8 + Math.random() * 0.4);

    const flyData = {
      el: fly,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type,
      born: Date.now(),
      lifetime: type.lifetime / diff,
    };

    fly.addEventListener('click', (e) => {
      e.stopPropagation();
      catchFly(flyData);
    });

    gameArea.appendChild(fly);
    state.flies.push(flyData);

    const escapeTimer = setTimeout(() => {
      if (state.flies.includes(flyData)) {
        escapeFly(flyData);
      }
    }, flyData.lifetime);

    flyData.escapeTimer = escapeTimer;
  }

  function showPopup(x, y, text, isPenalty = false) {
    const popup = document.createElement('div');
    popup.className = `score-popup${isPenalty ? ' penalty' : ''}`;
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    gameArea.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
  }

  function catchFly(flyData) {
    if (!state.running) return;

    clearTimeout(flyData.escapeTimer);
    state.flies = state.flies.filter(f => f !== flyData);

    let points = flyData.type.points;
    if (state.comboReady) {
      points *= COMBO_MULTIPLIER;
      state.comboReady = false;
      showComboBanner();
    }

    state.score += points;
    state.caught++;
    state.lastCatchTime = Date.now();
    state.comboCount++;

    if (state.comboCount > state.bestCombo) {
      state.bestCombo = state.comboCount;
    }

    flyData.el.classList.add('caught');
    showPopup(flyData.x, flyData.y, `+${points}`);
    setTimeout(() => flyData.el.remove(), 300);

    updateHUD();
  }

  function escapeFly(flyData) {
    if (!state.running) return;

    state.flies = state.flies.filter(f => f !== flyData);
    state.missed++;
    state.comboCount = 0;
    state.comboReady = false;
    state.score = Math.max(0, state.score - PENALTY);

    flyData.el.classList.add('escaped');
    showPopup(flyData.x, flyData.y, `-${PENALTY}`, true);
    setTimeout(() => flyData.el.remove(), 400);

    updateHUD();
  }

  function showComboBanner() {
    comboBanner.classList.remove('hidden');
    comboBanner.style.animation = 'none';
    void comboBanner.offsetWidth;
    comboBanner.style.animation = '';
    setTimeout(() => comboBanner.classList.add('hidden'), 800);
  }

  function updateHUD() {
    scoreEl.textContent = state.score;
    timerEl.textContent = state.timeLeft;
    comboEl.textContent = state.comboCount > 1 ? `x${state.comboCount}` : '—';

    const timerHud = document.querySelector('.hud-timer');
    timerHud.classList.toggle('urgent', state.timeLeft <= 10);
  }

  function moveFlies() {
    if (!state.running) return;

    const area = gameArea.getBoundingClientRect();
    const size = 48;

    state.flies.forEach(fly => {
      fly.x += fly.vx;
      fly.y += fly.vy;

      if (fly.x <= 0 || fly.x >= area.width - size) {
        fly.vx *= -1;
        fly.x = Math.max(0, Math.min(fly.x, area.width - size));
      }
      if (fly.y <= 0 || fly.y >= area.height - size) {
        fly.vy *= -1;
        fly.y = Math.max(0, Math.min(fly.y, area.height - size));
      }

      // Légère variation aléatoire de direction
      if (Math.random() < 0.02) {
        const angle = Math.atan2(fly.vy, fly.vx) + (Math.random() - 0.5) * 1.2;
        const speed = Math.hypot(fly.vx, fly.vy);
        fly.vx = Math.cos(angle) * speed;
        fly.vy = Math.sin(angle) * speed;
      }

      fly.el.style.left = `${fly.x}px`;
      fly.el.style.top = `${fly.y}px`;
    });

    // Combo : 3 captures en moins de 3 secondes d'intervalle
    if (state.lastCatchTime && Date.now() - state.lastCatchTime < COMBO_THRESHOLD * 1000) {
      if (state.comboCount >= 3 && !state.comboReady) {
        state.comboReady = true;
      }
    }

    rafId = requestAnimationFrame(moveFlies);
  }

  function scheduleSpawn() {
    if (!state.running) return;
    spawnFly();
    spawnTimer = setTimeout(scheduleSpawn, getSpawnInterval());
  }

  function startGame() {
    cleanup();

    state = {
      running: true,
      score: 0,
      timeLeft: GAME_DURATION,
      caught: 0,
      missed: 0,
      comboCount: 0,
      bestCombo: 0,
      comboReady: false,
      lastCatchTime: 0,
      flies: [],
    };

    gameArea.querySelectorAll('.fly, .score-popup').forEach(el => el.remove());
    updateHUD();
    showScreen('game');

    countdownTimer = setInterval(() => {
      state.timeLeft--;
      updateHUD();
      if (state.timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    rafId = requestAnimationFrame(moveFlies);
    scheduleSpawn();
  }

  function endGame() {
    state.running = false;
    cleanup();

    state.flies.forEach(f => {
      clearTimeout(f.escapeTimer);
      f.el.remove();
    });

    const best = loadBestScore();
    const isNewRecord = state.score > best;

    if (isNewRecord) {
      saveBestScore(state.score);
      bestScoreEl.textContent = state.score;
    }

    finalScoreEl.textContent = state.score;
    statCaught.textContent = state.caught;
    statMissed.textContent = state.missed;
    statBestCombo.textContent = state.bestCombo;

    const msg = [...MESSAGES].reverse().find(m => state.score >= m.min);
    endMessageEl.textContent = msg ? msg.text : '';
    newRecordEl.classList.toggle('hidden', !isNewRecord);

    showScreen('end');
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    clearTimeout(spawnTimer);
    clearInterval(countdownTimer);
    state.flies?.forEach(f => clearTimeout(f.escapeTimer));
  }

  function quitGame() {
    state.running = false;
    cleanup();
    state.flies?.forEach(f => f.el.remove());
    showScreen('home');
  }

  // Init
  bestScoreEl.textContent = loadBestScore();

  document.getElementById('btn-play').addEventListener('click', startGame);
  document.getElementById('btn-replay').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('home'));
  document.getElementById('btn-quit').addEventListener('click', quitGame);
})();
