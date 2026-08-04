(() => {
  "use strict";

  const screens = {
    hub: document.getElementById("hub"),
    slide: document.getElementById("slide"),
    match: document.getElementById("match"),
    echo: document.getElementById("echo"),
  };

  const winEl = document.getElementById("win");
  const winTitle = document.getElementById("win-title");
  const winDetail = document.getElementById("win-detail");
  const winAgain = document.getElementById("win-again");
  const winHub = document.getElementById("win-hub");

  let activeGame = null;
  let againHandler = null;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
    hideWin();
    activeGame = name === "hub" ? null : name;
  }

  function showWin(title, detail, onAgain) {
    winTitle.textContent = title;
    winDetail.textContent = detail;
    againHandler = onAgain;
    winEl.hidden = false;
  }

  function hideWin() {
    winEl.hidden = true;
  }

  document.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const game = btn.getAttribute("data-play");
      if (game === "slide") {
        showScreen("slide");
        Slide.start();
      } else if (game === "match") {
        showScreen("match");
        Match.start();
      } else if (game === "echo") {
        showScreen("echo");
        Echo.reset();
      }
    });
  });

  document.querySelectorAll("[data-home]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("hub"));
  });

  winAgain.addEventListener("click", () => {
    hideWin();
    if (typeof againHandler === "function") againHandler();
  });

  winHub.addEventListener("click", () => showScreen("hub"));

  // ─── Slide ───────────────────────────────────────────────────────────────
  const Slide = (() => {
    const boardEl = document.getElementById("slide-board");
    const movesEl = document.getElementById("slide-moves");
    const timeEl = document.getElementById("slide-time");
    const shuffleBtn = document.getElementById("slide-shuffle");
    const sizeBtns = document.querySelectorAll("[data-slide-size]");

    let size = 4;
    let tiles = [];
    let empty = 0;
    let moves = 0;
    let startedAt = 0;
    let timerId = null;
    let playing = false;

    function indexOf(r, c) {
      return r * size + c;
    }

    function coords(i) {
      return [Math.floor(i / size), i % size];
    }

    function isSolved() {
      for (let i = 0; i < tiles.length - 1; i++) {
        if (tiles[i] !== i + 1) return false;
      }
      return tiles[tiles.length - 1] === 0;
    }

    function inversionCount(arr) {
      let inv = 0;
      const flat = arr.filter((n) => n !== 0);
      for (let i = 0; i < flat.length; i++) {
        for (let j = i + 1; j < flat.length; j++) {
          if (flat[i] > flat[j]) inv++;
        }
      }
      return inv;
    }

    function isSolvable(arr) {
      const inv = inversionCount(arr);
      if (size % 2 === 1) return inv % 2 === 0;
      const blankRowFromBottom = size - Math.floor(arr.indexOf(0) / size);
      if (blankRowFromBottom % 2 === 0) return inv % 2 === 1;
      return inv % 2 === 0;
    }

    function shuffled() {
      const arr = Array.from({ length: size * size }, (_, i) =>
        i === size * size - 1 ? 0 : i + 1
      );
      do {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      } while (!isSolvable(arr) || arr.every((v, i) => (i === arr.length - 1 ? v === 0 : v === i + 1)));
      return arr;
    }

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function formatTime(ms) {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${String(r).padStart(2, "0")}`;
    }

    function tick() {
      timeEl.textContent = formatTime(Date.now() - startedAt);
    }

    function ensureTimer() {
      if (timerId || !playing) return;
      startedAt = Date.now();
      timerId = setInterval(tick, 250);
      tick();
    }

    function render() {
      boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      boardEl.innerHTML = "";
      tiles.forEach((value, i) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "slide-tile" + (value === 0 ? " is-empty" : "");
        if (value !== 0 && value === i + 1) cell.classList.add("is-correct");
        cell.textContent = value === 0 ? "" : String(value);
        cell.setAttribute("aria-label", value === 0 ? "Empty space" : `Tile ${value}`);
        if (value !== 0) {
          cell.addEventListener("click", () => tryMove(i));
        }
        boardEl.appendChild(cell);
      });
      movesEl.textContent = String(moves);
    }

    function tryMove(i) {
      if (!playing) return;
      const [er, ec] = coords(empty);
      const [r, c] = coords(i);
      if (Math.abs(er - r) + Math.abs(ec - c) !== 1) return;
      ensureTimer();
      [tiles[empty], tiles[i]] = [tiles[i], tiles[empty]];
      empty = i;
      moves += 1;
      render();
      if (isSolved()) {
        playing = false;
        stopTimer();
        const elapsed = formatTime(Date.now() - startedAt);
        showWin(
          "Slide cleared",
          `${moves} moves · ${elapsed}`,
          () => start()
        );
      }
    }

    function moveEmpty(dr, dc) {
      const [er, ec] = coords(empty);
      const nr = er + dr;
      const nc = ec + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) return;
      tryMove(indexOf(nr, nc));
    }

    function start(nextSize = size) {
      size = nextSize;
      tiles = shuffled();
      empty = tiles.indexOf(0);
      moves = 0;
      playing = true;
      stopTimer();
      timeEl.textContent = "0:00";
      sizeBtns.forEach((btn) => {
        const active = Number(btn.getAttribute("data-slide-size")) === size;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      render();
      boardEl.focus({ preventScroll: true });
    }

    shuffleBtn.addEventListener("click", () => start());
    sizeBtns.forEach((btn) => {
      btn.addEventListener("click", () => start(Number(btn.getAttribute("data-slide-size"))));
    });

    boardEl.addEventListener("keydown", (e) => {
      if (!playing) return;
      // Arrow keys move the tile into the empty space (opposite of empty move)
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveEmpty(1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveEmpty(-1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveEmpty(0, 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveEmpty(0, -1);
      }
    });

    let touchStart = null;
    boardEl.addEventListener(
      "touchstart",
      (e) => {
        const t = e.changedTouches[0];
        touchStart = { x: t.clientX, y: t.clientY };
      },
      { passive: true }
    );
    boardEl.addEventListener(
      "touchend",
      (e) => {
        if (!touchStart || !playing) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          moveEmpty(0, dx > 0 ? -1 : 1);
        } else {
          moveEmpty(dy > 0 ? -1 : 1);
        }
      },
      { passive: true }
    );

    return { start };
  })();

  // ─── Match ───────────────────────────────────────────────────────────────
  const Match = (() => {
    const boardEl = document.getElementById("match-board");
    const pairsEl = document.getElementById("match-pairs");
    const triesEl = document.getElementById("match-tries");
    const restartBtn = document.getElementById("match-restart");

    const SYMBOLS = ["▲", "●", "■", "◆", "✚", "★", "☾", "✿"];

    let cards = [];
    let flipped = [];
    let pairs = 0;
    let tries = 0;
    let lock = false;

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function updateStats() {
      pairsEl.textContent = `${pairs}/8`;
      triesEl.textContent = String(tries);
    }

    function render() {
      boardEl.innerHTML = "";
      cards.forEach((card, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "match-card";
        if (card.flipped || card.matched) btn.classList.add("is-flipped");
        if (card.matched) btn.classList.add("is-matched");
        btn.setAttribute("aria-label", card.matched || card.flipped ? `Card ${card.symbol}` : "Face-down card");
        btn.innerHTML = `
          <span class="match-card__inner">
            <span class="match-card__face match-card__face--back">?</span>
            <span class="match-card__face match-card__face--front">${card.symbol}</span>
          </span>
        `;
        btn.addEventListener("click", () => flip(i));
        boardEl.appendChild(btn);
      });
      updateStats();
    }

    function flip(i) {
      if (lock) return;
      const card = cards[i];
      if (card.flipped || card.matched) return;
      card.flipped = true;
      flipped.push(i);
      render();

      if (flipped.length < 2) return;

      tries += 1;
      updateStats();
      const [a, b] = flipped;
      if (cards[a].symbol === cards[b].symbol) {
        cards[a].matched = true;
        cards[b].matched = true;
        flipped = [];
        pairs += 1;
        updateStats();
        render();
        if (pairs === 8) {
          showWin("Match cleared", `${tries} tries to find every pair`, () => start());
        }
      } else {
        lock = true;
        setTimeout(() => {
          cards[a].flipped = false;
          cards[b].flipped = false;
          flipped = [];
          lock = false;
          render();
        }, 650);
      }
    }

    function start() {
      const deck = shuffle([...SYMBOLS, ...SYMBOLS]).map((symbol) => ({
        symbol,
        flipped: false,
        matched: false,
      }));
      cards = deck;
      flipped = [];
      pairs = 0;
      tries = 0;
      lock = false;
      render();
    }

    restartBtn.addEventListener("click", () => start());
    return { start };
  })();

  // ─── Echo ────────────────────────────────────────────────────────────────
  const Echo = (() => {
    const boardEl = document.getElementById("echo-board");
    const levelEl = document.getElementById("echo-level");
    const bestEl = document.getElementById("echo-best");
    const statusEl = document.getElementById("echo-status");
    const startBtn = document.getElementById("echo-start");
    const BEST_KEY = "riddle-echo-best";

    let sequence = [];
    let step = 0;
    let level = 1;
    let best = Number(localStorage.getItem(BEST_KEY) || "1");
    let accepting = false;
    let pads = [];

    function setStatus(text) {
      statusEl.textContent = text;
    }

    function updateHud() {
      levelEl.textContent = String(level);
      bestEl.textContent = String(best);
    }

    function buildPads() {
      boardEl.innerHTML = "";
      pads = [];
      for (let i = 0; i < 4; i++) {
        const pad = document.createElement("button");
        pad.type = "button";
        pad.className = "echo-pad";
        pad.setAttribute("aria-label", `Pad ${i + 1}`);
        pad.disabled = true;
        pad.addEventListener("click", () => onPad(i));
        boardEl.appendChild(pad);
        pads.push(pad);
      }
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function light(i, ms = 380) {
      const pad = pads[i];
      pad.classList.add("is-lit");
      await sleep(ms);
      pad.classList.remove("is-lit");
      await sleep(120);
    }

    async function playSequence() {
      accepting = false;
      pads.forEach((p) => {
        p.disabled = true;
      });
      setStatus("Watch the pattern");
      await sleep(450);
      for (const idx of sequence) {
        await light(idx);
      }
      accepting = true;
      step = 0;
      pads.forEach((p) => {
        p.disabled = false;
      });
      setStatus("Your turn — repeat it");
    }

    async function onPad(i) {
      if (!accepting) return;
      await light(i, 220);
      if (i !== sequence[step]) {
        accepting = false;
        pads.forEach((p) => {
          p.disabled = true;
        });
        setStatus("Missed — try again");
        showWin("Echo ended", `Reached level ${level}`, () => startRound(true));
        return;
      }
      step += 1;
      if (step >= sequence.length) {
        accepting = false;
        pads.forEach((p) => {
          p.disabled = true;
        });
        level += 1;
        if (level > best) {
          best = level;
          localStorage.setItem(BEST_KEY, String(best));
        }
        updateHud();
        setStatus("Nice — next pattern…");
        await sleep(500);
        sequence.push(Math.floor(Math.random() * 4));
        playSequence();
      }
    }

    function startRound(fromScratch = true) {
      if (fromScratch) {
        level = 1;
        sequence = [Math.floor(Math.random() * 4)];
      }
      updateHud();
      startBtn.textContent = "Restart";
      playSequence();
    }

    function reset() {
      level = 1;
      sequence = [];
      accepting = false;
      setStatus("Press Start, then echo the lights");
      updateHud();
      startBtn.textContent = "Start";
      buildPads();
    }

    startBtn.addEventListener("click", () => startRound(true));

    buildPads();
    updateHud();
    return { reset, startRound };
  })();

  // Expose for debugging / tests
  window.RiddleGames = { Slide, Match, Echo, showScreen };
})();
