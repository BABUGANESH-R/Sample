(function () {
  "use strict";

  const E = window.ChessEngine;

  const UNICODE = {
    w: { k: "\u2654", q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658", p: "\u2659" },
    b: { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" }
  };

  const state = E.makeInitialState();
  let flipped = false;
  let selected = null;       // [r, f] of selected piece, or null
  let legalForSelected = []; // Legal moves for currently selected piece
  let lastMove = null;       // { from: [r,f], to: [r,f] } for highlighting
  let pendingPromotion = null; // { resolve } while promotion modal is open
  const capturedByWhite = []; // Types of black pieces captured by White
  const capturedByBlack = []; // Types of white pieces captured by Black

  const boardEl = document.getElementById("board");
  const turnTextEl = document.getElementById("turn-text");
  const turnDotEl = document.getElementById("turn-dot");
  const statusDetailEl = document.getElementById("status-detail");
  const historyEl = document.getElementById("history-list");
  const capturedBlackEl = document.getElementById("captured-black");
  const capturedWhiteEl = document.getElementById("captured-white");
  const promotionModal = document.getElementById("promotion-modal");
  const promoChoicesEl = document.getElementById("promo-choices");
  const filesTopEl = document.getElementById("files-top");
  const filesBottomEl = document.getElementById("files-bottom");
  const ranksLeftEl = document.getElementById("ranks-left");
  const ranksRightEl = document.getElementById("ranks-right");

  document.getElementById("btn-new").addEventListener("click", onNewGame);
  document.getElementById("btn-undo").addEventListener("click", onUndo);
  document.getElementById("btn-flip").addEventListener("click", onFlip);

  function render() {
    renderBoard();
    renderCoords();
    renderStatus();
    renderHistory();
    renderCaptured();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const outcome = E.checkGameState(state);
    const inCheck = !outcome.over && outcome.inCheck;
    const kingSquare = inCheck ? E.findKing(state.board, state.turn) : null;

    for (let i = 0; i < 64; i++) {
      const r = flipped ? 7 - Math.floor(i / 8) : Math.floor(i / 8);
      const f = flipped ? 7 - (i % 8) : (i % 8);
      const sq = document.createElement("div");
      sq.className = "square " + ((r + f) % 2 === 0 ? "light" : "dark");
      sq.dataset.r = String(r);
      sq.dataset.f = String(f);
      sq.setAttribute("role", "gridcell");
      sq.setAttribute("aria-label", E.squareName(r, f));

      if (selected && selected[0] === r && selected[1] === f) sq.classList.add("is-selected");

      if (lastMove) {
        const [lr1, lf1] = lastMove.from;
        const [lr2, lf2] = lastMove.to;
        if ((r === lr1 && f === lf1) || (r === lr2 && f === lf2)) {
          sq.classList.add("is-last-move");
        }
      }

      if (kingSquare && kingSquare[0] === r && kingSquare[1] === f) {
        sq.classList.add("is-check");
      }

      const match = legalForSelected.find((m) => m.to[0] === r && m.to[1] === f);
      if (match) {
        const target = state.board[r][f];
        if (target || match.enPassant) sq.classList.add("is-capture");
        else sq.classList.add("is-move");
      }

      const piece = state.board[r][f];
      if (piece) {
        const span = document.createElement("span");
        span.className = "piece piece-" + piece.c;
        span.textContent = UNICODE[piece.c][piece.t];
        sq.appendChild(span);
      }

      sq.addEventListener("click", onSquareClick);
      boardEl.appendChild(sq);
    }
  }

  function renderCoords() {
    const files = flipped ? [...E.FILES].reverse() : E.FILES;
    const ranks = flipped ? [...E.RANKS].reverse() : E.RANKS;
    filesTopEl.innerHTML = files.map((f) => "<span>" + f + "</span>").join("");
    filesBottomEl.innerHTML = files.map((f) => "<span>" + f + "</span>").join("");
    ranksLeftEl.innerHTML = ranks.map((r) => "<span>" + r + "</span>").join("");
    ranksRightEl.innerHTML = ranks.map((r) => "<span>" + r + "</span>").join("");
  }

  function renderStatus() {
    const outcome = E.checkGameState(state);
    turnDotEl.dataset.color = state.turn;

    if (outcome.over) {
      if (outcome.result === "checkmate") {
        turnTextEl.textContent = (outcome.winner === "w" ? "White" : "Black") + " wins";
        statusDetailEl.textContent = "Checkmate";
      } else if (outcome.result === "stalemate") {
        turnTextEl.textContent = "Draw";
        statusDetailEl.textContent = "Stalemate";
      } else if (outcome.result === "fifty-move") {
        turnTextEl.textContent = "Draw";
        statusDetailEl.textContent = "Fifty-move rule";
      } else if (outcome.result === "insufficient") {
        turnTextEl.textContent = "Draw";
        statusDetailEl.textContent = "Insufficient material";
      }
      statusDetailEl.className = "status__detail is-end";
    } else {
      turnTextEl.textContent = (state.turn === "w" ? "White" : "Black") + " to move";
      statusDetailEl.textContent = outcome.inCheck ? "Check!" : "";
      statusDetailEl.className = "status__detail" + (outcome.inCheck ? " is-check" : "");
    }
  }

  function renderHistory() {
    historyEl.innerHTML = "";
    for (let i = 0; i < state.history.length; i += 2) {
      const li = document.createElement("li");
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = (i / 2 + 1) + ".";
      const move = document.createElement("span");
      move.className = "move";
      const white = state.history[i] || "";
      const black = state.history[i + 1] || "";
      move.textContent = white + (black ? " " + black : "");
      li.appendChild(num);
      li.appendChild(move);
      historyEl.appendChild(li);
    }
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function renderCaptured() {
    const order = { q: 0, r: 1, b: 2, n: 3, p: 4 };
    const sorted = (arr) => [...arr].sort((a, b) => order[a] - order[b]);
    capturedBlackEl.innerHTML = sorted(capturedByWhite)
      .map((t) => '<span class="piece-b">' + UNICODE.b[t] + "</span>")
      .join("");
    capturedWhiteEl.innerHTML = sorted(capturedByBlack)
      .map((t) => '<span class="piece-w">' + UNICODE.w[t] + "</span>")
      .join("");
  }

  function onSquareClick(event) {
    if (pendingPromotion) return;
    const outcome = E.checkGameState(state);
    if (outcome.over) return;

    const r = Number(event.currentTarget.dataset.r);
    const f = Number(event.currentTarget.dataset.f);

    if (selected) {
      const move = legalForSelected.find((m) => m.to[0] === r && m.to[1] === f);
      if (move) {
        attemptMove(move);
        return;
      }
    }

    const piece = state.board[r][f];
    if (piece && piece.c === state.turn) {
      selected = [r, f];
      legalForSelected = E.legalMovesFor(state, r, f);
    } else {
      selected = null;
      legalForSelected = [];
    }
    renderBoard();
  }

  function attemptMove(move) {
    const promoMoves = legalForSelected.filter(
      (m) => m.to[0] === move.to[0] && m.to[1] === move.to[1] && m.promotion
    );
    if (promoMoves.length > 0) {
      askForPromotion().then((choice) => {
        if (!choice) return;
        const chosen = promoMoves.find((m) => m.promotion === choice);
        if (chosen) commitMove(chosen);
      });
    } else {
      commitMove(move);
    }
  }

  function commitMove(move) {
    const san = E.moveToSan(state, move);
    const [tr, tf] = move.to;
    const captured = state.board[tr][tf];
    const mover = state.board[move.from[0]][move.from[1]];

    const capturesBefore = { w: capturedByWhite.length, b: capturedByBlack.length };

    if (captured) {
      if (captured.c === "w") capturedByBlack.push(captured.t);
      else capturedByWhite.push(captured.t);
    } else if (move.enPassant) {
      const dir = mover.c === "w" ? 1 : -1;
      const capPiece = state.board[tr + dir][tf];
      if (capPiece) {
        if (capPiece.c === "w") capturedByBlack.push(capPiece.t);
        else capturedByWhite.push(capPiece.t);
      }
    }

    const snapshot = E.applyMoveInPlace(state, move);
    state.history.push(san);
    state.moves.push({ snapshot, capturesBefore });
    lastMove = { from: [...move.from], to: [...move.to] };
    selected = null;
    legalForSelected = [];
    render();
  }

  function onNewGame() {
    const fresh = E.makeInitialState();
    state.board = fresh.board;
    state.turn = fresh.turn;
    state.castling = fresh.castling;
    state.ep = fresh.ep;
    state.halfmove = fresh.halfmove;
    state.fullmove = fresh.fullmove;
    state.history.length = 0;
    state.moves.length = 0;
    capturedByWhite.length = 0;
    capturedByBlack.length = 0;
    selected = null;
    legalForSelected = [];
    lastMove = null;
    render();
  }

  function onUndo() {
    if (state.moves.length === 0) return;
    const last = state.moves.pop();
    E.undoMoveInPlace(state, last.snapshot);
    state.history.pop();
    capturedByWhite.length = last.capturesBefore.w;
    capturedByBlack.length = last.capturesBefore.b;

    if (state.moves.length > 0) {
      const prev = state.moves[state.moves.length - 1];
      const m = prev.snapshot.move;
      lastMove = { from: [...m.from], to: [...m.to] };
    } else {
      lastMove = null;
    }
    selected = null;
    legalForSelected = [];
    render();
  }

  function onFlip() {
    flipped = !flipped;
    render();
  }

  function askForPromotion() {
    const color = state.turn;
    promoChoicesEl.innerHTML = "";
    for (const t of ["q", "r", "b", "n"]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.promo = t;
      btn.textContent = UNICODE[color][t];
      btn.style.color = color === "w" ? "var(--piece-white)" : "var(--piece-black)";
      btn.addEventListener("click", () => resolvePromotion(t));
      promoChoicesEl.appendChild(btn);
    }
    promotionModal.hidden = false;
    return new Promise((resolve) => {
      pendingPromotion = { resolve };
    });
  }

  function resolvePromotion(choice) {
    if (!pendingPromotion) return;
    const { resolve } = pendingPromotion;
    pendingPromotion = null;
    promotionModal.hidden = true;
    resolve(choice);
  }

  render();
})();
