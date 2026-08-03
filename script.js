(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayHint = document.getElementById("overlay-hint");
  const startBtn = document.getElementById("start-btn");

  const COLS = 20;
  const ROWS = 20;
  const CELL = canvas.width / COLS;
  const BASE_INTERVAL = 130;
  const MIN_INTERVAL = 55;
  const STORAGE_KEY = "snake-best-score";

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
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let running = false;
  let paused = false;
  let dead = false;
  let lastTick = 0;
  let interval = BASE_INTERVAL;
  let rafId = 0;
  let eatPulse = 0;

  bestEl.textContent = String(best);

  function reset() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    dir = "right";
    nextDir = "right";
    score = 0;
    interval = BASE_INTERVAL;
    dead = false;
    paused = false;
    eatPulse = 0;
    scoreEl.textContent = "0";
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

  function showOverlay(title, hint, ctaLabel) {
    overlayTitle.textContent = title;
    overlayHint.textContent = hint;
    startBtn.textContent = ctaLabel;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    reset();
    running = true;
    lastTick = performance.now();
    hideOverlay();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    dead = true;
    running = false;
    if (score > best) {
      best = score;
      localStorage.setItem(STORAGE_KEY, String(best));
      bestEl.textContent = String(best);
      showOverlay("New best!", `Score ${score}`, "Play again");
    } else {
      showOverlay("Game over", `Score ${score}`, "Play again");
    }
  }

  function togglePause() {
    if (!running || dead) return;
    paused = !paused;
    if (paused) {
      showOverlay("Paused", "Press Space or tap to resume", "Resume");
    } else {
      hideOverlay();
      lastTick = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function setDirection(name) {
    if (!DIRS[name]) return;
    if (OPPOSITE[dir] === name) return;
    nextDir = name;
  }

  function step() {
    dir = nextDir;
    const head = snake[0];
    const move = DIRS[dir];
    const next = { x: head.x + move.x, y: head.y + move.y };

    if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) {
      endGame();
      return;
    }

    if (snake.some((part, i) => i !== snake.length - 1 && part.x === next.x && part.y === next.y)) {
      endGame();
      return;
    }

    snake.unshift(next);

    if (next.x === food.x && next.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      eatPulse = 1;
      interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - score * 4);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function drawCell(x, y, color, inset = 1.5) {
    const px = x * CELL;
    const py = y * CELL;
    const size = CELL - inset * 2;
    const r = Math.min(6, size * 0.28);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px + inset + r, py + inset);
    ctx.arcTo(px + inset + size, py + inset, px + inset + size, py + inset + size, r);
    ctx.arcTo(px + inset + size, py + inset + size, px + inset, py + inset + size, r);
    ctx.arcTo(px + inset, py + inset + size, px + inset, py + inset, r);
    ctx.arcTo(px + inset, py + inset, px + inset + size, py + inset, r);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1a2e27";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(215, 235, 227, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(canvas.width, j * CELL);
      ctx.stroke();
    }

    if (eatPulse > 0) {
      const pulse = eatPulse;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 107, 74, ${0.18 * pulse})`;
      ctx.arc(
        food.x * CELL + CELL / 2,
        food.y * CELL + CELL / 2,
        CELL * (0.9 + pulse * 0.6),
        0,
        Math.PI * 2
      );
      ctx.fill();
      eatPulse = Math.max(0, eatPulse - 0.06);
    }

    const foodInset = 3 + Math.sin(performance.now() / 180) * 0.8;
    drawCell(food.x, food.y, "#ff6b4a", foodInset);

    snake.forEach((part, i) => {
      const t = i / Math.max(1, snake.length - 1);
      const color =
        i === 0
          ? "#c8ffd9"
          : `rgb(${Math.round(125 + t * 20)}, ${Math.round(255 - t * 40)}, ${Math.round(163 + t * 10)})`;
      drawCell(part.x, part.y, color, i === 0 ? 1 : 2);
    });

    if (snake.length) {
      const head = snake[0];
      const cx = head.x * CELL + CELL / 2;
      const cy = head.y * CELL + CELL / 2;
      const eye = CELL * 0.09;
      const offset = CELL * 0.18;
      ctx.fillStyle = "#14201c";
      if (dir === "left" || dir === "right") {
        const sx = dir === "right" ? offset : -offset;
        ctx.beginPath();
        ctx.arc(cx + sx, cy - offset * 0.55, eye, 0, Math.PI * 2);
        ctx.arc(cx + sx, cy + offset * 0.55, eye, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const sy = dir === "down" ? offset : -offset;
        ctx.beginPath();
        ctx.arc(cx - offset * 0.55, cy + sy, eye, 0, Math.PI * 2);
        ctx.arc(cx + offset * 0.55, cy + sy, eye, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function loop(now) {
    if (!running || paused) return;
    if (now - lastTick >= interval) {
      step();
      lastTick = now;
    }
    draw();
    if (running && !paused) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function onPrimaryAction() {
    if (!running || dead) {
      startGame();
    } else if (paused) {
      togglePause();
    } else {
      togglePause();
    }
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      e.preventDefault();
    }

    if (key === "arrowup" || key === "w") setDirection("up");
    else if (key === "arrowdown" || key === "s") setDirection("down");
    else if (key === "arrowleft" || key === "a") setDirection("left");
    else if (key === "arrowright" || key === "d") setDirection("right");
    else if (key === " ") onPrimaryAction();
    else if (key === "r") startGame();
  });

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onPrimaryAction();
  });

  overlay.addEventListener("click", onPrimaryAction);

  document.querySelectorAll(".pad").forEach((btn) => {
    const dirName = btn.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      setDirection(dirName);
      if (!running || dead) startGame();
      else if (paused) togglePause();
    };
    btn.addEventListener("pointerdown", press);
  });

  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
        onPrimaryAction();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        setDirection(dx > 0 ? "right" : "left");
      } else {
        setDirection(dy > 0 ? "down" : "up");
      }
      if (!running || dead) startGame();
      else if (paused) togglePause();
    },
    { passive: true }
  );

  reset();
  showOverlay("Ready", "Press Space or tap to start", "Play");
})();
