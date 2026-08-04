(() => {
  const CELL = 20;
  const COLS = 20;
  const ROWS = 20;
  const TICK_MS = 140;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  let snake;
  let dir;
  let nextDir;
  let food;
  let score;
  let best = Number(localStorage.getItem("snake-best") || 0);
  let running = false;
  let paused = false;
  let awaitingInput = false;
  let timer = null;
  let eatPulse = 0;

  bestEl.textContent = String(best);

  function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    dir = "right";
    nextDir = "right";
    score = 0;
    scoreEl.textContent = "0";
    eatPulse = 0;
    placeFood();
    draw();
  }

  function placeFood() {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    let x;
    let y;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
    } while (occupied.has(`${x},${y}`));
    food = { x, y };
  }

  function bumpScore() {
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
  }

  function setOverlay(title, text, buttonLabel, visible) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = buttonLabel;
    overlay.classList.toggle("hidden", !visible);
  }

  function start() {
    if (running && paused) {
      paused = false;
      awaitingInput = false;
      setOverlay("", "", "Play", false);
      loop();
      return;
    }
    reset();
    running = true;
    paused = false;
    awaitingInput = true;
    clearTimeout(timer);
    setOverlay("", "", "Play", false);
  }

  function pause() {
    if (!running || paused || awaitingInput) return;
    paused = true;
    clearTimeout(timer);
    setOverlay("Paused", "Press Space or tap to resume", "Resume", true);
  }

  function gameOver() {
    running = false;
    paused = false;
    awaitingInput = false;
    clearTimeout(timer);
    if (score > best) {
      best = score;
      localStorage.setItem("snake-best", String(best));
      bestEl.textContent = String(best);
    }
    setOverlay("Game Over", `Score ${score} · Best ${best}`, "Play again", true);
  }

  function step() {
    dir = nextDir;
    const head = snake[0];
    const move = DIRS[dir];
    const next = { x: head.x + move.x, y: head.y + move.y };

    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
      gameOver();
      return;
    }

    if (snake.some((seg) => seg.x === next.x && seg.y === next.y)) {
      gameOver();
      return;
    }

    snake.unshift(next);

    if (next.x === food.x && next.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      bumpScore();
      eatPulse = 6;
      placeFood();
    } else {
      snake.pop();
    }

    if (eatPulse > 0) eatPulse -= 1;
    draw();
  }

  function loop() {
    clearTimeout(timer);
    if (!running || paused || awaitingInput) return;
    step();
    if (running && !paused && !awaitingInput) {
      timer = setTimeout(loop, TICK_MS);
    }
  }

  function drawGrid() {
    ctx.fillStyle = "#dce8c8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(31, 107, 56, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j += 1) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL + 0.5);
      ctx.lineTo(canvas.width, j * CELL + 0.5);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function draw() {
    drawGrid();

    const pulse = eatPulse > 0 ? 1 + eatPulse * 0.04 : 1;
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const fr = (CELL * 0.32) * pulse;

    ctx.fillStyle = "#e85d4c";
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2f8f4e";
    ctx.fillRect(fx - 1, fy - fr - 3, 2, 4);

    snake.forEach((seg, i) => {
      const pad = i === 0 ? 1.5 : 2.5;
      const x = seg.x * CELL + pad;
      const y = seg.y * CELL + pad;
      const size = CELL - pad * 2;
      const t = i / Math.max(snake.length - 1, 1);
      const g = Math.round(111 + (47 - 111) * (1 - t));
      const b = Math.round(56 + (78 - 56) * (1 - t));
      ctx.fillStyle = i === 0 ? "#1f6b38" : `rgb(47, ${g}, ${b})`;
      roundRect(x, y, size, size, i === 0 ? 6 : 5);
      ctx.fill();

      if (i === 0) {
        const eye = 2.2;
        const ox = dir === "left" ? -3 : dir === "right" ? 3 : 0;
        const oy = dir === "up" ? -3 : dir === "down" ? 3 : 0;
        ctx.fillStyle = "#f3efe3";
        ctx.beginPath();
        ctx.arc(x + size * 0.35 + ox * 0.2, y + size * 0.35 + oy * 0.2, eye, 0, Math.PI * 2);
        ctx.arc(x + size * 0.65 + ox * 0.2, y + size * 0.35 + oy * 0.2, eye, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a2e1f";
        ctx.beginPath();
        ctx.arc(x + size * 0.35 + ox * 0.35, y + size * 0.35 + oy * 0.35, 1.1, 0, Math.PI * 2);
        ctx.arc(x + size * 0.65 + ox * 0.35, y + size * 0.35 + oy * 0.35, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function queueDir(name) {
    if (!DIRS[name]) return;
    if (!running) start();
    // Never reverse into the body — including the first move after Play.
    if (OPPOSITE[name] === dir) return;
    if (awaitingInput) {
      dir = name;
      nextDir = name;
      awaitingInput = false;
      loop();
      return;
    }
    nextDir = name;
  }

  function onKey(e) {
    const key = e.key.toLowerCase();
    const map = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };

    if (key === " " || key === "enter") {
      e.preventDefault();
      if (!running || paused) start();
      else pause();
      return;
    }

    if (map[key]) {
      e.preventDefault();
      queueDir(map[key]);
    }
  }

  document.addEventListener("keydown", onKey);
  startBtn.addEventListener("click", start);
  overlay.addEventListener("click", (e) => {
    if (e.target === startBtn) return;
    start();
  });

  document.querySelectorAll(".controls button").forEach((btn) => {
    btn.addEventListener("click", () => queueDir(btn.dataset.dir));
  });

  reset();
  setOverlay("Ready?", "Press Play, then steer with arrows", "Play", true);
})();
