(function () {
  const MATCH_SYMBOLS = ["🌙", "⭐", "🍀", "🔥", "💎", "🌊", "🌸", "⚡"];
  const ECHO_TONES = [329.63, 261.63, 392.0, 220.0];

  const screens = {
    hub: document.getElementById("hub"),
    slide: document.getElementById("slide"),
    match: document.getElementById("match"),
    echo: document.getElementById("echo"),
  };

  const winModal = document.getElementById("win");
  const winTitle = document.getElementById("win-title");
  const winDetail = document.getElementById("win-detail");

  let currentPuzzle = null;
  let audioCtx = null;

  const slide = {
    size: 4,
    tiles: [],
    moves: 0,
    startTime: 0,
    timerId: null,
    solved: false,
  };

  const match = {
    cards: [],
    flipped: [],
    tries: 0,
    pairs: 0,
    startTime: 0,
    timerId: null,
    busy: false,
    generation: 0,
  };

  const echo = {
    sequence: [],
    step: 0,
    level: 1,
    startTime: 0,
    listening: false,
    playing: false,
    generation: 0,
  };

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function elapsedSeconds(startTime) {
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
  }

  function closeWin() {
    winModal.hidden = true;
  }

  function showWin(title, detail) {
    winTitle.textContent = title;
    winDetail.textContent = detail;
    winModal.hidden = false;
  }

  function saveSlideStats() {
    if (typeof GameStatsTracker === "undefined") return;
    GameStatsTracker.saveSlidePuzzle({
      size: slide.size,
      moves: slide.moves,
      time: elapsedSeconds(slide.startTime),
    });
  }

  function saveMatchStats() {
    if (typeof GameStatsTracker === "undefined") return;
    GameStatsTracker.saveMatchPuzzle({
      tries: match.tries,
      pairs: match.pairs,
      time: elapsedSeconds(match.startTime),
    });
  }

  function saveEchoStats() {
    if (typeof GameStatsTracker === "undefined") return;
    GameStatsTracker.saveEchoGame({
      level: echo.level,
      duration: Math.floor((Date.now() - echo.startTime) / 60000) || 1,
    });
  }

  function stopTimers() {
    clearInterval(slide.timerId);
    clearInterval(match.timerId);
    slide.timerId = null;
    match.timerId = null;
  }

  function tickSlide() {
    document.getElementById("slide-time").textContent = formatTime(
      elapsedSeconds(slide.startTime)
    );
  }

  function tickMatch() {
    document.getElementById("match-time").textContent = formatTime(
      elapsedSeconds(match.startTime)
    );
  }

  function neighbors(index, size) {
    const row = Math.floor(index / size);
    const col = index % size;
    const next = [];
    if (row > 0) next.push(index - size);
    if (row < size - 1) next.push(index + size);
    if (col > 0) next.push(index - 1);
    if (col < size - 1) next.push(index + 1);
    return next;
  }

  function solvedTiles(size) {
    const tiles = [];
    for (let i = 1; i < size * size; i += 1) tiles.push(i);
    tiles.push(0);
    return tiles;
  }

  function isSolved(tiles) {
    for (let i = 0; i < tiles.length - 1; i += 1) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  function shuffleSlide(size) {
    const tiles = solvedTiles(size);
    let blank = tiles.length - 1;
    const steps = size * size * 48;
    let last = null;

    for (let i = 0; i < steps; i += 1) {
      const options = neighbors(blank, size).filter((n) => n !== last);
      const pick = options[Math.floor(Math.random() * options.length)];
      tiles[blank] = tiles[pick];
      tiles[pick] = 0;
      last = blank;
      blank = pick;
    }

    if (isSolved(tiles)) return shuffleSlide(size);
    return tiles;
  }

  function renderSlide() {
    const board = document.getElementById("slide-board");
    board.className = `slide-board size-${slide.size}`;
    board.innerHTML = "";

    slide.tiles.forEach((value, index) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = value === 0 ? "tile blank" : "tile";
      tile.textContent = value === 0 ? "" : String(value);
      tile.setAttribute("aria-label", value === 0 ? "Empty space" : `Tile ${value}`);
      if (slide.solved) tile.classList.add("locked");
      tile.addEventListener("click", () => trySlideMove(index));
      board.appendChild(tile);
    });

    document.getElementById("slide-moves").textContent = String(slide.moves);
  }

  function trySlideMove(index) {
    if (slide.solved) return;
    const blank = slide.tiles.indexOf(0);
    if (!neighbors(index, slide.size).includes(blank)) return;

    slide.tiles[blank] = slide.tiles[index];
    slide.tiles[index] = 0;
    slide.moves += 1;
    renderSlide();

    if (isSolved(slide.tiles)) {
      slide.solved = true;
      stopTimers();
      renderSlide();
      saveSlideStats();
      showWin(
        "Slide complete!",
        `${slide.moves} moves in ${formatTime(elapsedSeconds(slide.startTime))}`
      );
    }
  }

  function moveBlank(deltaRow, deltaCol) {
    const blank = slide.tiles.indexOf(0);
    const size = slide.size;
    const row = Math.floor(blank / size) + deltaRow;
    const col = (blank % size) + deltaCol;
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    trySlideMove(row * size + col);
  }

  function startSlidePuzzle(boardSize) {
    stopTimers();
    closeWin();
    currentPuzzle = "slide";
    slide.size = boardSize;
    slide.tiles = shuffleSlide(boardSize);
    slide.moves = 0;
    slide.solved = false;
    slide.startTime = Date.now();
    slide.timerId = setInterval(tickSlide, 250);
    document.querySelectorAll("[data-slide-size]").forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.slideSize) === boardSize);
    });
    tickSlide();
    renderSlide();
    showScreen("slide");
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderMatch() {
    const board = document.getElementById("match-board");
    board.innerHTML = "";
    match.cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "match-card";
      if (card.flipped || card.matched) button.classList.add("is-flipped");
      if (card.matched) button.classList.add("is-matched");
      button.disabled = card.matched || match.busy;
      button.innerHTML = `<span class="face ${card.flipped || card.matched ? "front" : "back"}">${
        card.flipped || card.matched ? card.symbol : "▣"
      }</span>`;
      button.addEventListener("click", () => flipMatch(index));
      board.appendChild(button);
    });

    document.getElementById("match-tries").textContent = String(match.tries);
    document.getElementById("match-pairs").textContent = `${match.pairs} / 8`;
  }

  function flipMatch(index) {
    const card = match.cards[index];
    if (match.busy || card.flipped || card.matched) return;

    card.flipped = true;
    match.flipped.push(index);
    renderMatch();

    if (match.flipped.length < 2) return;

    match.busy = true;
    match.tries += 1;
    const [a, b] = match.flipped;
    const first = match.cards[a];
    const second = match.cards[b];

    if (first.symbol === second.symbol) {
      first.matched = true;
      second.matched = true;
      match.pairs += 1;
      match.flipped = [];
      match.busy = false;
      renderMatch();

      if (match.pairs === 8) {
        stopTimers();
        saveMatchStats();
        const perfect = match.tries === 8;
        showWin(
          "Match complete!",
          perfect ? "Perfect match — eight tries, eight pairs." : `${match.tries} tries`
        );
      }
      return;
    }

    const generation = match.generation;
    setTimeout(() => {
      if (generation !== match.generation) return;
      first.flipped = false;
      second.flipped = false;
      match.flipped = [];
      match.busy = false;
      renderMatch();
    }, 700);
  }

  function startMatchPuzzle() {
    stopTimers();
    closeWin();
    currentPuzzle = "match";
    match.generation += 1;
    const deck = shuffle(MATCH_SYMBOLS.concat(MATCH_SYMBOLS)).map((symbol) => ({
      symbol,
      flipped: false,
      matched: false,
    }));
    match.cards = deck;
    match.flipped = [];
    match.tries = 0;
    match.pairs = 0;
    match.busy = false;
    match.startTime = Date.now();
    match.timerId = setInterval(tickMatch, 250);
    tickMatch();
    renderMatch();
    showScreen("match");
  }

  function getAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function playTone(index) {
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ECHO_TONES[index];
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  function setEchoStatus(text) {
    document.getElementById("echo-status").textContent = text;
  }

  function setEchoLevel() {
    document.getElementById("echo-level").textContent = String(echo.level);
  }

  function lightPad(index, on) {
    const pad = document.querySelector(`.echo-pad[data-pad="${index}"]`);
    if (pad) pad.classList.toggle("is-lit", on);
  }

  function setPadsEnabled(enabled) {
    document.querySelectorAll(".echo-pad").forEach((pad) => {
      pad.disabled = !enabled;
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function playSequence() {
    const generation = echo.generation;
    echo.playing = true;
    echo.listening = false;
    setPadsEnabled(false);
    setEchoStatus("Watch");
    await wait(420);
    if (generation !== echo.generation) return;
    for (const index of echo.sequence) {
      if (generation !== echo.generation) return;
      lightPad(index, true);
      playTone(index);
      await wait(420);
      if (generation !== echo.generation) return;
      lightPad(index, false);
      await wait(160);
    }
    if (generation !== echo.generation) return;
    echo.playing = false;
    echo.listening = true;
    echo.step = 0;
    setPadsEnabled(true);
    setEchoStatus("Your turn");
  }

  function nextEchoLevel() {
    echo.level += 1;
    echo.sequence.push(Math.floor(Math.random() * 4));
    setEchoLevel();
    playSequence();
  }

  function onEchoPad(index) {
    if (!echo.listening || echo.playing) return;
    lightPad(index, true);
    playTone(index);
    setTimeout(() => lightPad(index, false), 180);

    if (index !== echo.sequence[echo.step]) {
      echo.listening = false;
      setPadsEnabled(false);
      setEchoStatus("Miss");
      saveEchoStats();
      showWin("Echo over", `Reached level ${echo.level}`);
      return;
    }

    echo.step += 1;
    if (echo.step === echo.sequence.length) {
      const generation = echo.generation;
      echo.listening = false;
      setPadsEnabled(false);
      setEchoStatus("Nice");
      setTimeout(() => {
        if (generation !== echo.generation) return;
        nextEchoLevel();
      }, 650);
    }
  }

  function startEchoGame() {
    stopTimers();
    closeWin();
    currentPuzzle = "echo";
    echo.generation += 1;
    echo.level = 1;
    echo.sequence = [Math.floor(Math.random() * 4)];
    echo.step = 0;
    echo.startTime = Date.now();
    echo.listening = false;
    echo.playing = false;
    setEchoLevel();
    showScreen("echo");
    playSequence();
  }

  function playAgain() {
    closeWin();
    if (currentPuzzle === "slide") startSlidePuzzle(slide.size);
    else if (currentPuzzle === "match") startMatchPuzzle();
    else if (currentPuzzle === "echo") startEchoGame();
  }

  function showHub() {
    stopTimers();
    closeWin();
    currentPuzzle = null;
    echo.generation += 1;
    match.generation += 1;
    document.querySelectorAll(".echo-pad").forEach((pad) => pad.classList.remove("is-lit"));
    setPadsEnabled(false);
    setEchoStatus("Ready");
    showScreen("hub");
  }

  document.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const puzzle = btn.dataset.play;
      if (puzzle === "slide") startSlidePuzzle(4);
      if (puzzle === "match") startMatchPuzzle();
      if (puzzle === "echo") startEchoGame();
    });
  });

  document.querySelectorAll("[data-slide-size]").forEach((btn) => {
    btn.addEventListener("click", () => startSlidePuzzle(Number(btn.dataset.slideSize)));
  });

  document.getElementById("slide-shuffle").addEventListener("click", () => {
    startSlidePuzzle(slide.size);
  });
  document.getElementById("match-restart").addEventListener("click", startMatchPuzzle);
  document.getElementById("echo-start").addEventListener("click", startEchoGame);
  document.getElementById("home-btn").addEventListener("click", showHub);
  document.getElementById("win-again").addEventListener("click", playAgain);
  document.getElementById("win-hub").addEventListener("click", showHub);

  document.querySelectorAll(".echo-pad").forEach((pad) => {
    pad.addEventListener("click", () => onEchoPad(Number(pad.dataset.pad)));
  });

  document.addEventListener("keydown", (event) => {
    if (!winModal.hidden) return;
    if (currentPuzzle === "slide") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveBlank(1, 0);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveBlank(-1, 0);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveBlank(0, 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveBlank(0, -1);
      }
    }
    if (currentPuzzle === "echo" && echo.listening) {
      const map = { "1": 0, "2": 1, "3": 2, "4": 3, q: 0, w: 1, a: 2, s: 3 };
      if (event.key in map) onEchoPad(map[event.key]);
    }
  });

  setPadsEnabled(false);
})();
