(function () {
  const GLYPHS = {
    white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
    black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
  };

  const boardEl = document.getElementById("board");
  const fileLabelsEl = document.getElementById("file-labels");
  const turnLabel = document.getElementById("turn-label");
  const statusDetail = document.getElementById("status-detail");
  const capturedWhiteEl = document.getElementById("captured-white");
  const capturedBlackEl = document.getElementById("captured-black");
  const moveListEl = document.getElementById("move-list");
  const promotionModal = document.getElementById("promotion-modal");
  const endModal = document.getElementById("end-modal");
  const endTitle = document.getElementById("end-title");
  const endDetail = document.getElementById("end-detail");

  let state = ChessEngine.createState();
  let selected = null;
  let legalTargets = [];
  let flipped = false;
  let historyStack = [];
  let pendingPromotion = null;
  let gameStartTime = Date.now();
  let statsSaved = false;

  function startNewGame() {
    state = ChessEngine.createState();
    selected = null;
    legalTargets = [];
    historyStack = [];
    pendingPromotion = null;
    gameStartTime = Date.now();
    statsSaved = false;
    hide(endModal);
    hide(promotionModal);
    render();
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

  function renderBoard() {
    boardEl.innerHTML = "";
    const last = state.moveHistory[state.moveHistory.length - 1];
    const king = (() => {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = state.board[r][c];
          if (p && p.type === "king" && p.color === state.turn) return { r, c };
        }
      }
      return null;
    })();

    for (let dr = 0; dr < 8; dr++) {
      for (let dc = 0; dc < 8; dc++) {
        const { r, c } = boardIndexFromDisplay(dr, dc);
        const square = document.createElement("button");
        square.type = "button";
        square.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
        square.dataset.r = String(r);
        square.dataset.c = String(c);

        if (dc === 0) {
          const coord = document.createElement("span");
          coord.className = "coord";
          coord.textContent = String(8 - r);
          square.appendChild(coord);
        }

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

        square.setAttribute("aria-label", ChessEngine.squareName(r, c) + (piece ? " " + piece.color + " " + piece.type : ""));
        square.addEventListener("click", () => onSquareClick(r, c));
        boardEl.appendChild(square);
      }
    }

    const files = flipped ? "hgfedcba" : "abcdefgh";
    fileLabelsEl.innerHTML = files
      .split("")
      .map((f) => `<span>${f}</span>`)
      .join("");
  }

  function renderCaptured() {
    capturedWhiteEl.textContent = state.capturedByWhite.map((t) => GLYPHS.black[t]).join("");
    capturedBlackEl.textContent = state.capturedByBlack.map((t) => GLYPHS.white[t]).join("");
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

  function statusText() {
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

  function render() {
    const status = statusText();
    turnLabel.textContent = status.title;
    statusDetail.textContent = status.detail;
    renderBoard();
    renderCaptured();
    renderMoves();
  }

  function onSquareClick(r, c) {
    if (state.gameOver || pendingPromotion) return;
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
    if (state.gameOver) onGameEnd();
  }

  function onGameEnd() {
    const status = statusText();
    endTitle.textContent = status.title;
    endDetail.textContent = status.detail;
    show(endModal);
    saveStats();
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

  document.getElementById("btn-new").addEventListener("click", startNewGame);
  document.getElementById("btn-play-again").addEventListener("click", startNewGame);
  document.getElementById("btn-flip").addEventListener("click", () => {
    flipped = !flipped;
    render();
  });
  document.getElementById("btn-undo").addEventListener("click", () => {
    if (!historyStack.length || state.gameOver) return;
    state = historyStack.pop();
    selected = null;
    legalTargets = [];
    render();
  });
  document.getElementById("btn-resign").addEventListener("click", () => {
    if (state.gameOver) return;
    historyStack.push(state);
    state = ChessEngine.resign(state, state.turn);
    render();
    onGameEnd();
  });
  document.getElementById("btn-draw").addEventListener("click", () => {
    if (state.gameOver) return;
    historyStack.push(state);
    state = ChessEngine.agreeDraw(state);
    render();
    onGameEnd();
  });

  promotionModal.querySelectorAll("[data-promo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!pendingPromotion) return;
      attemptMove(pendingPromotion.from, pendingPromotion.to, btn.dataset.promo);
    });
  });

  startNewGame();
})();
