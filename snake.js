(function () {
  const TICK_MS = 120;
  const CELL = 20;
  const KEY_DIRS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayDetail = document.getElementById("overlay-detail");
  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnRestart = document.getElementById("btn-restart");

  let state;
  let timer = null;
  let paused = false;
  let saved = false;
  let playedMs = 0;
  let resumedAt = 0;
  let best = readBest();

  function readBest() {
    try {
      const n = parseInt(localStorage.getItem("snake-best") || "0", 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeBest(value) {
    try {
      localStorage.setItem("snake-best", String(value));
    } catch (e) {
      /* storage blocked: keep the in-memory best */
    }
  }

  function showOverlay(title, detail, buttonLabel) {
    overlayTitle.textContent = title;
    overlayDetail.textContent = detail;
    btnStart.textContent = buttonLabel;
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function newGame() {
    clearTimer();
    state = SnakeEngine.createState({ cols: canvas.width / CELL, rows: canvas.height / CELL });
    paused = false;
    saved = false;
    playedMs = 0;
    resumedAt = 0;
    btnPause.textContent = "Pause";
    showOverlay("Snake", "Press Space or a direction to start.", "Start");
    updateScores();
    render();
  }

  function beginPlay() {
    SnakeEngine.start(state);
    hideOverlay();
    resumeTimer();
  }

  function resumeTimer() {
    clearTimer();
    resumedAt = Date.now();
    timer = setInterval(tick, TICK_MS);
  }

  function pauseGame() {
    if (state.status !== "running" || paused) return;
    paused = true;
    playedMs += Date.now() - resumedAt;
    clearTimer();
    btnPause.textContent = "Resume";
    showOverlay("Paused", "Press Space to resume.", "Resume");
  }

  function resumeGame() {
    if (state.status !== "running" || !paused) return;
    paused = false;
    btnPause.textContent = "Pause";
    hideOverlay();
    resumeTimer();
  }

  function togglePause() {
    if (state.status === "ready") beginPlay();
    else if (state.status === "running") (paused ? resumeGame : pauseGame)();
    else newGameAndStart();
  }

  function newGameAndStart() {
    newGame();
    beginPlay();
  }

  function tick() {
    SnakeEngine.step(state);
    updateScores();
    render();
    if (state.status === "over" || state.status === "won") finishGame();
  }

  function finishGame() {
    clearTimer();
    playedMs += Date.now() - resumedAt;
    if (!saved) {
      saved = true; // once per game, even if saving throws
      const minutes = Math.max(1, Math.ceil(playedMs / 60000));
      try {
        if (typeof GameStatsTracker !== "undefined") {
          GameStatsTracker.saveSnakeGame({ score: state.score, duration: minutes });
        }
      } catch (e) {
        /* storage blocked: the game stays playable, the result is just not recorded */
      }
    }
    if (state.score > best) {
      best = state.score;
      writeBest(best);
    }
    updateScores();
    btnPause.textContent = "Pause";
    showOverlay(
      state.status === "won" ? "You win!" : "Game over",
      "Score: " + state.score + ". Press Space to play again.",
      "Play again"
    );
  }

  function updateScores() {
    scoreEl.textContent = state.score;
    bestEl.textContent = Math.max(best, state.score);
  }

  function render() {
    ctx.fillStyle = "#0f1524";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.food) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(state.food.x * CELL + CELL / 2, state.food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
    }

    state.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#34d399" : "#10b981";
      ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  function steer(dir) {
    if (state.status === "over" || state.status === "won" || paused) return;
    SnakeEngine.queueDirection(state, dir);
    if (state.status === "ready") beginPlay();
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) togglePause();
      return;
    }
    const dir = KEY_DIRS[e.key];
    if (dir) {
      e.preventDefault();
      steer(dir);
    }
  });

  // A focused button would otherwise also "click" on Space keyup.
  document.addEventListener("keyup", (e) => {
    if (e.key === " " || e.code === "Space") e.preventDefault();
  });

  document.querySelectorAll(".dpad-btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      steer(btn.dataset.dir);
    });
  });

  btnStart.addEventListener("click", () => {
    btnStart.blur();
    togglePause();
  });
  btnPause.addEventListener("click", () => {
    btnPause.blur();
    if (state.status === "running") (paused ? resumeGame : pauseGame)();
  });
  btnRestart.addEventListener("click", () => {
    btnRestart.blur();
    newGame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
  });

  newGame();
})();
