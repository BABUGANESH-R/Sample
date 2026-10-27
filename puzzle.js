(function () {
  'use strict';

  const boardEl = document.getElementById('board');
  const movesEl = document.getElementById('moves');
  const timerEl = document.getElementById('timer');
  const bestEl = document.getElementById('best');
  const winOverlay = document.getElementById('win-overlay');
  const winSummary = document.getElementById('win-summary');
  const playAgainBtn = document.getElementById('play-again');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const resetBtn = document.getElementById('solve-btn');
  const sizeChips = document.querySelectorAll('.chip[data-size]');

  const BEST_KEY_PREFIX = 'slide-puzzle-best:';

  const state = {
    size: 3,
    tiles: [],       // length size*size; last value 0 = empty
    emptyIdx: 0,     // index of the empty cell
    moves: 0,
    startedAt: null,
    elapsedMs: 0,
    timerId: null,
    solved: true,
    animating: false,
  };

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function loadBest(size) {
    try {
      const raw = localStorage.getItem(BEST_KEY_PREFIX + size);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveBest(size, record) {
    try { localStorage.setItem(BEST_KEY_PREFIX + size, JSON.stringify(record)); } catch {}
  }

  function updateBestDisplay() {
    const best = loadBest(state.size);
    bestEl.textContent = best ? `${best.moves} moves · ${formatTime(best.timeMs)}` : '—';
  }

  function solvedTiles(n) {
    const total = n * n;
    const arr = new Array(total);
    for (let i = 0; i < total - 1; i++) arr[i] = i + 1;
    arr[total - 1] = 0;
    return arr;
  }

  function isSolved(tiles) {
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  // Fisher-Yates shuffle, then ensure solvable; if not, swap two non-empty tiles.
  function shuffleSolvable(n) {
    const tiles = solvedTiles(n);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    if (!isSolvable(tiles, n)) {
      // Swap first two non-empty tiles to flip inversion parity.
      const a = tiles.findIndex((v) => v !== 0);
      const b = tiles.findIndex((v, i) => v !== 0 && i !== a);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
    // Avoid starting from the solved state.
    if (isSolved(tiles)) {
      const a = tiles.findIndex((v) => v !== 0);
      const b = tiles.findIndex((v, i) => v !== 0 && i !== a);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
    return tiles;
  }

  // Standard solvability rule for the 15-puzzle family.
  function isSolvable(tiles, n) {
    const flat = tiles.filter((v) => v !== 0);
    let inversions = 0;
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) inversions++;
      }
    }
    if (n % 2 === 1) {
      return inversions % 2 === 0;
    }
    const emptyRowFromBottom = n - Math.floor(tiles.indexOf(0) / n);
    return (inversions + emptyRowFromBottom) % 2 === 1;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.classList.toggle('solved', state.solved);

    const n = state.size;
    const cellPct = 100 / n;
    const gapPct = 2;            // visual gap inside each cell as a %
    const tileSizePct = cellPct - gapPct;
    const originPct = gapPct / 2;

    state.tiles.forEach((value, idx) => {
      if (value === 0) return;
      const row = Math.floor(idx / n);
      const col = idx % n;

      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.textContent = String(value);
      tile.setAttribute('data-value', String(value));
      tile.setAttribute('aria-label', `Tile ${value}`);
      tile.style.width = `${tileSizePct}%`;
      tile.style.height = `${tileSizePct}%`;
      tile.style.left = `${col * cellPct + originPct}%`;
      tile.style.top = `${row * cellPct + originPct}%`;
      tile.addEventListener('click', () => tryMoveByValue(value));
      boardEl.appendChild(tile);
    });
  }

  function updateTilePositions() {
    const n = state.size;
    const cellPct = 100 / n;
    const gapPct = 2;
    const originPct = gapPct / 2;

    state.tiles.forEach((value, idx) => {
      if (value === 0) return;
      const tile = boardEl.querySelector(`.tile[data-value="${value}"]`);
      if (!tile) return;
      const row = Math.floor(idx / n);
      const col = idx % n;
      tile.style.left = `${col * cellPct + originPct}%`;
      tile.style.top = `${row * cellPct + originPct}%`;
    });
  }

  function tryMoveByValue(value) {
    const idx = state.tiles.indexOf(value);
    if (idx === -1) return;
    tryMoveFromIndex(idx);
  }

  function tryMoveFromIndex(idx) {
    if (state.animating || state.solved) return;
    const n = state.size;
    const emptyIdx = state.emptyIdx;
    const row = Math.floor(idx / n);
    const col = idx % n;
    const er = Math.floor(emptyIdx / n);
    const ec = emptyIdx % n;

    const adjacent = (row === er && Math.abs(col - ec) === 1) ||
                     (col === ec && Math.abs(row - er) === 1);
    if (!adjacent) return;

    [state.tiles[idx], state.tiles[emptyIdx]] = [state.tiles[emptyIdx], state.tiles[idx]];
    state.emptyIdx = idx;
    state.moves += 1;
    movesEl.textContent = String(state.moves);

    if (state.startedAt === null) startTimer();

    updateTilePositions();

    if (isSolved(state.tiles)) {
      finishGame();
    }
  }

  // Arrow keys slide the tile that would fill the empty space in that direction.
  function handleKey(e) {
    const n = state.size;
    const er = Math.floor(state.emptyIdx / n);
    const ec = state.emptyIdx % n;
    let targetIdx = -1;

    switch (e.key) {
      case 'ArrowUp':    if (er < n - 1) targetIdx = (er + 1) * n + ec; break;
      case 'ArrowDown':  if (er > 0)     targetIdx = (er - 1) * n + ec; break;
      case 'ArrowLeft':  if (ec < n - 1) targetIdx = er * n + (ec + 1); break;
      case 'ArrowRight': if (ec > 0)     targetIdx = er * n + (ec - 1); break;
      default: return;
    }
    if (targetIdx !== -1) {
      e.preventDefault();
      tryMoveFromIndex(targetIdx);
    }
  }

  function startTimer() {
    state.startedAt = Date.now();
    state.timerId = setInterval(() => {
      state.elapsedMs = Date.now() - state.startedAt;
      timerEl.textContent = formatTime(state.elapsedMs);
    }, 250);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function resetTimer() {
    stopTimer();
    state.startedAt = null;
    state.elapsedMs = 0;
    timerEl.textContent = '0:00';
  }

  function finishGame() {
    state.solved = true;
    stopTimer();
    boardEl.classList.add('solved');

    const seconds = Math.max(1, Math.round(state.elapsedMs / 1000));

    // Save to the dashboard tracker if available (supports 3 and 4; still called for others for history).
    if (typeof GameStatsTracker !== 'undefined' && (state.size === 3 || state.size === 4)) {
      try {
        GameStatsTracker.saveSlidePuzzle({
          size: state.size,
          moves: state.moves,
          time: seconds,
        });
      } catch {}
    }

    const best = loadBest(state.size);
    const current = { moves: state.moves, timeMs: state.elapsedMs };
    let isNewBest = false;
    if (!best || current.moves < best.moves || (current.moves === best.moves && current.timeMs < best.timeMs)) {
      saveBest(state.size, current);
      isNewBest = true;
    }
    updateBestDisplay();

    winSummary.textContent = isNewBest
      ? `New best: ${state.moves} moves in ${formatTime(state.elapsedMs)}!`
      : `Solved in ${state.moves} moves and ${formatTime(state.elapsedMs)}.`;
    winOverlay.hidden = false;
  }

  function newGame(size) {
    state.size = size;
    state.tiles = shuffleSolvable(size);
    state.emptyIdx = state.tiles.indexOf(0);
    state.moves = 0;
    state.solved = false;
    resetTimer();
    movesEl.textContent = '0';
    winOverlay.hidden = true;
    boardEl.classList.remove('solved');
    renderBoard();
    updateBestDisplay();
  }

  function resetToSolved(size) {
    state.size = size;
    state.tiles = solvedTiles(size);
    state.emptyIdx = state.tiles.indexOf(0);
    state.moves = 0;
    state.solved = true;
    resetTimer();
    movesEl.textContent = '0';
    winOverlay.hidden = true;
    renderBoard();
    updateBestDisplay();
  }

  function selectSize(size) {
    sizeChips.forEach((chip) => {
      const active = Number(chip.dataset.size) === size;
      chip.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    newGame(size);
  }

  sizeChips.forEach((chip) => {
    chip.addEventListener('click', () => selectSize(Number(chip.dataset.size)));
  });

  shuffleBtn.addEventListener('click', () => newGame(state.size));
  resetBtn.addEventListener('click', () => resetToSolved(state.size));
  playAgainBtn.addEventListener('click', () => newGame(state.size));

  document.addEventListener('keydown', handleKey);
  window.addEventListener('resize', updateTilePositions);

  if (typeof GameStatsTracker !== 'undefined' && typeof GameStatsTracker.addDashboardLink === 'function') {
    try { GameStatsTracker.addDashboardLink(); } catch {}
  }

  selectSize(3);
})();
