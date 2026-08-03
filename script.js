(() => {
  "use strict";

  const STORAGE_KEY = "shift-puzzle-best";

  const els = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    board: document.getElementById("board"),
    moves: document.getElementById("move-count"),
    timer: document.getElementById("timer"),
    best: document.getElementById("best-score"),
    win: document.getElementById("win-overlay"),
    winSummary: document.getElementById("win-summary"),
    sizeChips: document.querySelectorAll("[data-resize]"),
  };

  const state = {
    size: 4,
    tiles: [],
    empty: 0,
    moves: 0,
    startedAt: null,
    timerId: null,
    won: false,
    hintIndex: null,
  };

  function tileColor(value, size) {
    const max = size * size - 1;
    const t = (value - 1) / Math.max(max - 1, 1);
    const hue = 152 + t * 28;
    const sat = 40 + t * 12;
    const light = 36 + t * 14;
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function loadBests() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveBest(size, moves, ms) {
    const bests = loadBests();
    const key = String(size);
    const prev = bests[key];
    if (!prev || moves < prev.moves || (moves === prev.moves && ms < prev.ms)) {
      bests[key] = { moves, ms };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
    }
    return bests[key];
  }

  function showBest() {
    const best = loadBests()[String(state.size)];
    els.best.textContent = best ? `${best.moves} · ${formatTime(best.ms)}` : "—";
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function tickTimer() {
    if (!state.startedAt || state.won) return;
    els.timer.textContent = formatTime(Date.now() - state.startedAt);
  }

  function startTimer() {
    if (state.startedAt || state.won) return;
    state.startedAt = Date.now();
    stopTimer();
    state.timerId = setInterval(tickTimer, 250);
    tickTimer();
  }

  function resetClock() {
    stopTimer();
    state.startedAt = null;
    els.timer.textContent = "0:00";
  }

  /** Count inversions ignoring the blank (0). */
  function inversionCount(arr) {
    let inv = 0;
    const vals = arr.filter((n) => n !== 0);
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        if (vals[i] > vals[j]) inv++;
      }
    }
    return inv;
  }

  function isSolvable(arr, size) {
    const inv = inversionCount(arr);
    if (size % 2 === 1) return inv % 2 === 0;
    const emptyRowFromBottom = size - Math.floor(arr.indexOf(0) / size);
    if (emptyRowFromBottom % 2 === 0) return inv % 2 === 1;
    return inv % 2 === 0;
  }

  function isSolved(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[arr.length - 1] === 0;
  }

  function shuffledBoard(size) {
    const n = size * size;
    let tiles;
    do {
      tiles = Array.from({ length: n }, (_, i) => (i + 1) % n);
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
    } while (!isSolvable(tiles, size) || isSolved(tiles));
    return tiles;
  }

  function neighbors(index, size) {
    const r = Math.floor(index / size);
    const c = index % size;
    const out = [];
    if (r > 0) out.push(index - size);
    if (r < size - 1) out.push(index + size);
    if (c > 0) out.push(index - 1);
    if (c < size - 1) out.push(index + 1);
    return out;
  }

  function canMove(index) {
    return neighbors(index, state.size).includes(state.empty);
  }

  function updateChips() {
    els.sizeChips.forEach((chip) => {
      const size = Number(chip.dataset.resize);
      chip.setAttribute("aria-pressed", String(size === state.size));
    });
  }

  function renderBoard() {
    const { size, tiles } = state;
    els.board.style.setProperty("--size", String(size));
    els.board.innerHTML = "";
    els.board.setAttribute("aria-rowcount", String(size));
    els.board.setAttribute("aria-colcount", String(size));

    tiles.forEach((value, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.style.setProperty("--pop-i", String(index));
      btn.setAttribute("role", "gridcell");
      btn.setAttribute("aria-rowindex", String(Math.floor(index / size) + 1));
      btn.setAttribute("aria-colindex", String((index % size) + 1));

      if (value === 0) {
        btn.classList.add("tile--empty");
        btn.setAttribute("aria-label", "Empty space");
        btn.tabIndex = -1;
      } else {
        btn.textContent = String(value);
        btn.style.setProperty("--tile-color", tileColor(value, size));
        btn.setAttribute("aria-label", `Tile ${value}`);
        if (canMove(index)) {
          btn.classList.add("tile--movable");
          btn.tabIndex = 0;
        } else {
          btn.tabIndex = -1;
        }
        if (state.hintIndex === index) btn.classList.add("tile--hint");
        btn.addEventListener("click", () => tryMove(index));
      }

      if (state.won) btn.classList.add("tile--locked");
      els.board.appendChild(btn);
    });
  }

  function tryMove(index) {
    if (state.won || !canMove(index)) return false;

    startTimer();
    const next = state.tiles.slice();
    next[state.empty] = next[index];
    next[index] = 0;
    state.tiles = next;
    state.empty = index;
    state.moves += 1;
    state.hintIndex = null;
    els.moves.textContent = String(state.moves);
    renderBoard();

    if (isSolved(state.tiles)) onWin();
    return true;
  }

  function moveEmpty(dr, dc) {
    const size = state.size;
    const r = Math.floor(state.empty / size);
    const c = state.empty % size;
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
    tryMove(nr * size + nc);
  }

  function onWin() {
    state.won = true;
    stopTimer();
    const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    els.timer.textContent = formatTime(elapsed);
    els.board.classList.add("board--won");
    renderBoard();

    const best = saveBest(state.size, state.moves, elapsed);
    showBest();

    const isRecord =
      best.moves === state.moves && best.ms === elapsed;
    els.winSummary.textContent = isRecord
      ? `${state.moves} moves in ${formatTime(elapsed)} — new best for ${state.size}×${state.size}.`
      : `${state.moves} moves in ${formatTime(elapsed)}. Best: ${best.moves} · ${formatTime(best.ms)}.`;
    els.win.hidden = false;
    document.getElementById("btn-again")?.focus();
  }

  function showHint() {
    if (state.won) return;
    const movable = [];
    for (let i = 0; i < state.tiles.length; i++) {
      if (state.tiles[i] !== 0 && canMove(i)) movable.push(i);
    }
    if (!movable.length) return;

    // Prefer a tile that belongs closer to the empty slot's solved position.
    let best = movable[0];
    let bestScore = Infinity;
    for (const idx of movable) {
      const value = state.tiles[idx];
      const target = value - 1;
      const tr = Math.floor(target / state.size);
      const tc = target % state.size;
      const er = Math.floor(state.empty / state.size);
      const ec = state.empty % state.size;
      const score = Math.abs(tr - er) + Math.abs(tc - ec);
      if (score < bestScore) {
        bestScore = score;
        best = idx;
      }
    }
    state.hintIndex = best;
    renderBoard();
  }

  function newGame(size = state.size) {
    state.size = size;
    state.tiles = shuffledBoard(size);
    state.empty = state.tiles.indexOf(0);
    state.moves = 0;
    state.won = false;
    state.hintIndex = null;
    els.moves.textContent = "0";
    els.board.classList.remove("board--won");
    els.win.hidden = true;
    resetClock();
    updateChips();
    showBest();
    renderBoard();
    els.board.focus({ preventScroll: true });
  }

  function showGame(size) {
    els.start.hidden = true;
    els.game.hidden = false;
    newGame(size);
  }

  function showHome() {
    stopTimer();
    els.win.hidden = true;
    els.game.hidden = true;
    els.start.hidden = false;
    document.getElementById("btn-play")?.focus();
  }

  // Events
  document.getElementById("btn-play")?.addEventListener("click", (e) => {
    showGame(Number(e.currentTarget.dataset.size) || 4);
  });
  document.getElementById("btn-play-easy")?.addEventListener("click", (e) => {
    showGame(Number(e.currentTarget.dataset.size) || 3);
  });
  document.getElementById("btn-play-hard")?.addEventListener("click", (e) => {
    showGame(Number(e.currentTarget.dataset.size) || 5);
  });
  document.getElementById("btn-home")?.addEventListener("click", showHome);
  document.getElementById("btn-win-home")?.addEventListener("click", showHome);
  document.getElementById("btn-again")?.addEventListener("click", () => newGame());
  document.getElementById("btn-shuffle")?.addEventListener("click", () => newGame());
  document.getElementById("btn-hint")?.addEventListener("click", showHint);

  els.sizeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const size = Number(chip.dataset.resize);
      if (size !== state.size) newGame(size);
    });
  });

  els.board.addEventListener("keydown", (e) => {
    if (state.won) return;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        moveEmpty(1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveEmpty(-1, 0);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveEmpty(0, 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveEmpty(0, -1);
        break;
    }
  });

  // Touch swipe on board
  let touchStart = null;
  els.board.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );
  els.board.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart || state.won) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 28) return;
      if (absX > absY) moveEmpty(0, dx > 0 ? -1 : 1);
      else moveEmpty(dy > 0 ? -1 : 1, 0);
    },
    { passive: true }
  );

  els.win.addEventListener("click", (e) => {
    if (e.target === els.win) els.win.hidden = true;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.win.hidden) els.win.hidden = true;
  });
})();
