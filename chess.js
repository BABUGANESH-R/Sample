(function () {
  const GLYPHS = {
    white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
    black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
  };

  const boardEl = document.getElementById("board");
  const fileLabelsEl = document.getElementById("file-labels");
  const rankLabelsEl = document.getElementById("rank-labels");
  const turnLabel = document.getElementById("turn-label");
  const statusDetail = document.getElementById("status-detail");
  const capturedWhiteEl = document.getElementById("captured-white");
  const capturedBlackEl = document.getElementById("captured-black");
  const moveListEl = document.getElementById("move-list");
  const promotionModal = document.getElementById("promotion-modal");
  const endModal = document.getElementById("end-modal");
  const endTitle = document.getElementById("end-title");
  const endDetail = document.getElementById("end-detail");
  const modeSelect = document.getElementById("mode-select");
  const btnUndo = document.getElementById("btn-undo");
  const btnResign = document.getElementById("btn-resign");
  const btnDraw = document.getElementById("btn-draw");

  let state = ChessEngine.createState();
  let selected = null;
  let legalTargets = [];
  let flipped = false;
  let historyStack = [];
  let pendingPromotion = null;
  let gameStartTime = Date.now();
  let statsSaved = false;
  let thinking = false;
  let cpuTimer = null;

  function currentMode() {
    return modeSelect.value;
  }

  function cpuColor() {
    if (currentMode() === "cpu-black") return "black";
    if (currentMode() === "cpu-white") return "white";
    return null;
  }

  function isCpuTurn() {
    const color = cpuColor();
    return !!color && !state.gameOver && state.turn === color;
  }

  function startNewGame() {
    if (cpuTimer) {
      clearTimeout(cpuTimer);
      cpuTimer = null;
    }
    state = ChessEngine.createState();
    selected = null;
    legalTargets = [];
    historyStack = [];
    pendingPromotion = null;
    gameStartTime = Date.now();
    statsSaved = false;
    thinking = false;
    flipped = currentMode() === "cpu-white";
    hide(endModal);
    hide(promotionModal);
    render();
    maybeComputerMove();
  }

  function hide(el) {
    el.hidden = true;
  }

  function show(el) {
    el.hidden = false;
  }

  function boardIndexFromDisplay(dr, dc) {
    if (!flipped) return { r: dr, c: dc };
    return { r: 7 - dr, c: 7 - dc };
  }

  function findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece && piece.type === "king" && piece.color === color) return { r, c };
      }
    }
    return null;
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const last = state.moveHistory[state.moveHistory.length - 1];
    const king = findKing(state.turn);
    const interactionLocked = state.gameOver || pendingPromotion || thinking || isCpuTurn();

    for (let dr = 0; dr < 8; dr++) {
      for (let dc = 0; dc < 8; dc++) {
        const { r, c } = boardIndexFromDisplay(dr, dc);
        const square = document.createElement("button");
        square.type = "button";
        square.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
        square.dataset.r = String(r);
        square.dataset.c = String(c);
        square.disabled = interactionLocked;

        if (selected && selected.r === r && selected.c === c) square.classList.add("selected");
        if (last && ((last.from.r === r && last.from.c === c) || (last.to.r === r && last.to.c === c))) {
          square.classList.add("last");
        }
        if (state.inCheck && king && king.r === r && king.c === c) square.classList.add("check");

        const piece = state.board[r][c];
        if (piece) {
          const glyph = document.createElement("span");
          glyph.className = "piece " + piece.color;
          glyph.textContent = GLYPHS[piece.color][piece.type] + "\uFE0E";
          square.appendChild(glyph);
        }

        const isLegal = legalTargets.some((t) => t.r === r && t.c === c);
        if (isLegal) {
          const marker = document.createElement("span");
          marker.className = piece ? "capture-ring" : "dot";
          square.appendChild(marker);
        }

        square.setAttribute(
          "aria-label",
          ChessEngine.squareName(r, c) + (piece ? " " + piece.color + " " + piece.type : "")
        );
        square.addEventListener("click", () => onSquareClick(r, c));
        boardEl.appendChild(square);
      }
    }

    const files = flipped ? "hgfedcba" : "abcdefgh";
    fileLabelsEl.innerHTML = files
      .split("")
      .map((file) => `<span>${file}</span>`)
      .join("");

    const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    rankLabelsEl.innerHTML = ranks.map((rank) => `<span>${rank}</span>`).join("");
  }

  function renderCaptured() {
    capturedWhiteEl.textContent = state.capturedByWhite.map((type) => GLYPHS.black[type]).join("");
    capturedBlackEl.textContent = state.capturedByBlack.map((type) => GLYPHS.white[type]).join("");
  }

  function renderMoves() {
    moveListEl.innerHTML = "";
    for (let i = 0; i < state.moveHistory.length; i += 2) {
      const li = document.createElement("li");
      const white = state.moveHistory[i];
      const black = state.moveHistory[i + 1];
      li.innerHTML = `<span>${i / 2 + 1}.</span><span>${white.san}</span><span>${black ? black.san : ""}</span>`;
      moveListEl.appendChild(li);
    }
    moveListEl.scrollTop = moveListEl.scrollHeight;
  }

  function renderStats() {
    if (typeof GameStatsTracker === "undefined") return;
    const stats = GameStatsTracker.getChessStats();
    document.getElementById("stat-games").textContent = String(stats.totalGames);
    document.getElementById("stat-white").textContent = String(stats.whiteWins);
    document.getElementById("stat-black").textContent = String(stats.blackWins);
    document.getElementById("stat-draws").textContent = String(stats.draws);
  }

  function statusText() {
    if (thinking) {
      return { title: "Computer thinking…", detail: "The computer is choosing a move." };
    }
    if (state.gameOver) {
      if (state.winner === "draw") {
        const reasons = {
          stalemate: "Stalemate",
          insufficient: "Draw by insufficient material",
          "fifty-move": "Draw by 50-move rule",
          agreement: "Draw by agreement",
        };
        return { title: "Draw", detail: reasons[state.endReason] || "The game is a draw." };
      }
      const winner = state.winner[0].toUpperCase() + state.winner.slice(1);
      const reasons = {
        checkmate: "Checkmate",
        resignation: "Resignation",
      };
      return { title: winner + " wins", detail: reasons[state.endReason] || "Game over." };
    }
    const turn = state.turn[0].toUpperCase() + state.turn.slice(1);
    return {
      title: turn + " to move",
      detail: state.inCheck ? turn + " is in check." : "Select a piece, then a highlighted square.",
    };
  }

  function updateButtons() {
    const ended = state.gameOver;
    btnUndo.disabled = ended || thinking || historyStack.length === 0;
    btnResign.disabled = ended || thinking;
    btnDraw.disabled = ended || thinking;
  }

  function render() {
    const status = statusText();
    turnLabel.textContent = status.title;
    statusDetail.textContent = status.detail;
    renderBoard();
    renderCaptured();
    renderMoves();
    renderStats();
    updateButtons();
  }

  function onSquareClick(r, c) {
    if (state.gameOver || pendingPromotion || thinking || isCpuTurn()) return;
    const piece = state.board[r][c];
    const isTarget = legalTargets.some((t) => t.r === r && t.c === c);

    if (selected && isTarget) {
      attemptMove(selected, { r, c });
      return;
    }

    if (piece && piece.color === state.turn) {
      selected = { r, c };
      legalTargets = ChessEngine.legalSquares(state, selected);
    } else {
      selected = null;
      legalTargets = [];
    }
    render();
  }

  function attemptMove(from, to, promotion) {
    const result = ChessEngine.makeMove(state, from, to, promotion);
    if (!result.ok && result.needsPromotion) {
      pendingPromotion = { from, to };
      show(promotionModal);
      return;
    }
    if (!result.ok) return;
    historyStack.push(state);
    state = result.state;
    selected = null;
    legalTargets = [];
    pendingPromotion = null;
    hide(promotionModal);
    render();
    if (state.gameOver) {
      onGameEnd();
      return;
    }
    maybeComputerMove();
  }

  function maybeComputerMove() {
    if (!isCpuTurn() || typeof ChessAI === "undefined") return;
    thinking = true;
    render();
    cpuTimer = setTimeout(() => {
      const choice = ChessAI.chooseMove(state, 2);
      thinking = false;
      if (!choice) {
        render();
        return;
      }
      attemptMove(choice.from, choice.to, choice.promotion);
    }, 280);
  }

  function onGameEnd() {
    const status = statusText();
    endTitle.textContent = status.title;
    endDetail.textContent = status.detail;
    show(endModal);
    saveStats();
    renderStats();
  }

  function saveStats() {
    if (statsSaved || typeof GameStatsTracker === "undefined") return;
    statsSaved = true;
    const duration = Math.floor((Date.now() - gameStartTime) / 60000) || 1;
    GameStatsTracker.saveChessGame({
      winner: state.winner,
      moves: state.moveHistory.length,
      duration,
      capturedByWhite: state.capturedByWhite,
      capturedByBlack: state.capturedByBlack,
    });
  }

  function confirmBusyGame(message) {
    if (!state.moveHistory.length || state.gameOver) return true;
    return window.confirm(message);
  }

  document.getElementById("btn-new").addEventListener("click", () => {
    if (!confirmBusyGame("Start a new game? The current game will be discarded.")) return;
    startNewGame();
  });
  document.getElementById("btn-play-again").addEventListener("click", startNewGame);
  document.getElementById("btn-flip").addEventListener("click", () => {
    flipped = !flipped;
    render();
  });
  btnUndo.addEventListener("click", () => {
    if (!historyStack.length || state.gameOver || thinking) return;
    state = historyStack.pop();
    while (cpuColor() && state.turn === cpuColor() && historyStack.length) {
      state = historyStack.pop();
    }
    selected = null;
    legalTargets = [];
    render();
    maybeComputerMove();
  });
  btnResign.addEventListener("click", () => {
    if (state.gameOver || thinking) return;
    if (!window.confirm("Resign this game?")) return;
    historyStack.push(state);
    const resigning = cpuColor() ? ChessEngine.opposite(cpuColor()) : state.turn;
    state = ChessEngine.resign(state, resigning);
    render();
    onGameEnd();
  });
  btnDraw.addEventListener("click", () => {
    if (state.gameOver || thinking) return;
    if (!window.confirm("Agree to a draw?")) return;
    historyStack.push(state);
    state = ChessEngine.agreeDraw(state);
    render();
    onGameEnd();
  });
  let lastMode = modeSelect.value;
  modeSelect.addEventListener("change", () => {
    if (!confirmBusyGame("Switch mode and start a new game?")) {
      modeSelect.value = lastMode;
      return;
    }
    lastMode = modeSelect.value;
    startNewGame();
  });

  promotionModal.querySelectorAll("[data-promo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!pendingPromotion) return;
      attemptMove(pendingPromotion.from, pendingPromotion.to, btn.dataset.promo);
    });
  });

  startNewGame();
})();
