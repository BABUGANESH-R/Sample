(() => {
  const PIECES = {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };

  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const boardEl = document.getElementById("board");
  const turnLabel = document.getElementById("turn-label");
  const messageEl = document.getElementById("message");
  const capturedByWhiteEl = document.getElementById("captured-by-white");
  const capturedByBlackEl = document.getElementById("captured-by-black");
  const newGameBtn = document.getElementById("new-game");
  const undoBtn = document.getElementById("undo");
  const promoteModal = document.getElementById("promote-modal");
  const promoteChoices = document.getElementById("promote-choices");

  let state;
  let selected = null;
  let legalTargets = [];
  let history = [];
  let pendingPromotion = null;

  function cloneState(s) {
    return {
      board: s.board.map((row) => row.slice()),
      turn: s.turn,
      castling: { ...s.castling },
      ep: s.ep ? { ...s.ep } : null,
      halfmove: s.halfmove,
      fullmove: s.fullmove,
      capturedByWhite: s.capturedByWhite.slice(),
      capturedByBlack: s.capturedByBlack.slice(),
      lastMove: s.lastMove ? { ...s.lastMove } : null,
      status: s.status,
    };
  }

  function parseFen(fen) {
    const [placement, turn, castle, ep, half, full] = fen.split(" ");
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const rows = placement.split("/");
    for (let r = 0; r < 8; r += 1) {
      let c = 0;
      for (const ch of rows[r]) {
        if (/\d/.test(ch)) {
          c += Number(ch);
        } else {
          board[r][c] = ch;
          c += 1;
        }
      }
    }
    return {
      board,
      turn: turn === "w" ? "w" : "b",
      castling: {
        K: castle.includes("K"),
        Q: castle.includes("Q"),
        k: castle.includes("k"),
        q: castle.includes("q"),
      },
      ep: ep === "-" ? null : algebraicToCoord(ep),
      halfmove: Number(half || 0),
      fullmove: Number(full || 1),
      capturedByWhite: [],
      capturedByBlack: [],
      lastMove: null,
      status: "playing",
    };
  }

  function algebraicToCoord(sq) {
    const file = sq.charCodeAt(0) - 97;
    const rank = 8 - Number(sq[1]);
    return { r: rank, c: file };
  }

  function coordToAlgebraic(r, c) {
    return String.fromCharCode(97 + c) + String(8 - r);
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function isWhite(piece) {
    return piece === piece.toUpperCase();
  }

  function colorOf(piece) {
    return isWhite(piece) ? "w" : "b";
  }

  function opponent(color) {
    return color === "w" ? "b" : "w";
  }

  function findKing(board, color) {
    const target = color === "w" ? "K" : "k";
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (board[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  function isSquareAttacked(board, r, c, byColor) {
    const enemyPawn = byColor === "w" ? "P" : "p";
    const pawnDir = byColor === "w" ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir;
      const pc = c + dc;
      if (inBounds(pr, pc) && board[pr][pc] === enemyPawn) return true;
    }

    const knightDeltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    const enemyKnight = byColor === "w" ? "N" : "n";
    for (const [dr, dc] of knightDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc] === enemyKnight) return true;
    }

    const enemyKing = byColor === "w" ? "K" : "k";
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc] === enemyKing) return true;
      }
    }

    const rookLike = byColor === "w" ? ["R", "Q"] : ["r", "q"];
    const bishopLike = byColor === "w" ? ["B", "Q"] : ["b", "q"];

    const slide = (dirs, attackers) => {
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const p = board[nr][nc];
          if (p) {
            if (attackers.includes(p)) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      return false;
    };

    if (slide([[-1, 0], [1, 0], [0, -1], [0, 1]], rookLike)) return true;
    if (slide([[-1, -1], [-1, 1], [1, -1], [1, 1]], bishopLike)) return true;
    return false;
  }

  function isInCheck(board, color) {
    const king = findKing(board, color);
    if (!king) return false;
    return isSquareAttacked(board, king.r, king.c, opponent(color));
  }

  function pseudoMoves(board, r, c, ep) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = colorOf(piece);
    const type = piece.toUpperCase();
    const moves = [];

    const add = (tr, tc, opts = {}) => {
      if (!inBounds(tr, tc)) return;
      const target = board[tr][tc];
      if (target && colorOf(target) === color) return;
      moves.push({
        from: { r, c },
        to: { r: tr, c: tc },
        capture: Boolean(target) || Boolean(opts.ep),
        ep: Boolean(opts.ep),
        castle: opts.castle || null,
        promote: Boolean(opts.promote),
      });
    };

    if (type === "P") {
      const dir = color === "w" ? -1 : 1;
      const startRank = color === "w" ? 6 : 1;
      const promoteRank = color === "w" ? 0 : 7;
      const oneR = r + dir;
      if (inBounds(oneR, c) && !board[oneR][c]) {
        add(oneR, c, { promote: oneR === promoteRank });
        const twoR = r + dir * 2;
        if (r === startRank && !board[twoR][c]) {
          add(twoR, c);
        }
      }
      for (const dc of [-1, 1]) {
        const tr = r + dir;
        const tc = c + dc;
        if (!inBounds(tr, tc)) continue;
        if (board[tr][tc] && colorOf(board[tr][tc]) !== color) {
          add(tr, tc, { promote: tr === promoteRank });
        } else if (ep && ep.r === tr && ep.c === tc) {
          add(tr, tc, { ep: true });
        }
      }
    } else if (type === "N") {
      for (const [dr, dc] of [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ]) {
        add(r + dr, c + dc);
      }
    } else if (type === "B" || type === "R" || type === "Q") {
      const dirs = [];
      if (type === "B" || type === "Q") {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === "R" || type === "Q") {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      for (const [dr, dc] of dirs) {
        let tr = r + dr;
        let tc = c + dc;
        while (inBounds(tr, tc)) {
          if (!board[tr][tc]) {
            add(tr, tc);
          } else {
            add(tr, tc);
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    } else if (type === "K") {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          add(r + dr, c + dc);
        }
      }
    }

    return moves;
  }

  function canCastle(state, color, side) {
    const board = state.board;
    const rank = color === "w" ? 7 : 0;
    const rights = color === "w"
      ? (side === "K" ? state.castling.K : state.castling.Q)
      : (side === "K" ? state.castling.k : state.castling.q);
    if (!rights) return false;
    if (isInCheck(board, color)) return false;

    if (side === "K") {
      if (board[rank][5] || board[rank][6]) return false;
      if (isSquareAttacked(board, rank, 5, opponent(color))) return false;
      if (isSquareAttacked(board, rank, 6, opponent(color))) return false;
      return true;
    }

    if (board[rank][1] || board[rank][2] || board[rank][3]) return false;
    if (isSquareAttacked(board, rank, 3, opponent(color))) return false;
    if (isSquareAttacked(board, rank, 2, opponent(color))) return false;
    return true;
  }

  function legalMovesForSquare(state, r, c) {
    const piece = state.board[r][c];
    if (!piece || colorOf(piece) !== state.turn) return [];

    const moves = pseudoMoves(state.board, r, c, state.ep);
    const type = piece.toUpperCase();

    if (type === "K") {
      if (canCastle(state, state.turn, "K")) {
        moves.push({
          from: { r, c },
          to: { r, c: c + 2 },
          capture: false,
          ep: false,
          castle: "K",
          promote: false,
        });
      }
      if (canCastle(state, state.turn, "Q")) {
        moves.push({
          from: { r, c },
          to: { r, c: c - 2 },
          capture: false,
          ep: false,
          castle: "Q",
          promote: false,
        });
      }
    }

    return moves.filter((move) => {
      const next = applyMove(state, move, "Q", true);
      return !isInCheck(next.board, state.turn);
    });
  }

  function allLegalMoves(state) {
    const moves = [];
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const piece = state.board[r][c];
        if (piece && colorOf(piece) === state.turn) {
          moves.push(...legalMovesForSquare(state, r, c));
        }
      }
    }
    return moves;
  }

  function applyMove(prev, move, promotion = "Q", dryRun = false) {
    const next = dryRun
      ? {
          board: prev.board.map((row) => row.slice()),
          turn: prev.turn,
          castling: { ...prev.castling },
          ep: prev.ep ? { ...prev.ep } : null,
          halfmove: prev.halfmove,
          fullmove: prev.fullmove,
          capturedByWhite: prev.capturedByWhite.slice(),
          capturedByBlack: prev.capturedByBlack.slice(),
          lastMove: null,
          status: prev.status,
        }
      : cloneState(prev);

    const { from, to } = move;
    const piece = next.board[from.r][from.c];
    let captured = next.board[to.r][to.c];

    if (move.ep) {
      const capR = prev.turn === "w" ? to.r + 1 : to.r - 1;
      captured = next.board[capR][to.c];
      next.board[capR][to.c] = null;
    }

    next.board[to.r][to.c] = piece;
    next.board[from.r][from.c] = null;

    if (move.castle === "K") {
      next.board[from.r][5] = next.board[from.r][7];
      next.board[from.r][7] = null;
    } else if (move.castle === "Q") {
      next.board[from.r][3] = next.board[from.r][0];
      next.board[from.r][0] = null;
    }

    if (move.promote) {
      const promo = prev.turn === "w" ? promotion.toUpperCase() : promotion.toLowerCase();
      next.board[to.r][to.c] = promo;
    }

    if (!dryRun && captured) {
      if (prev.turn === "w") next.capturedByWhite.push(captured);
      else next.capturedByBlack.push(captured);
    }

    if (piece.toUpperCase() === "K") {
      if (prev.turn === "w") {
        next.castling.K = false;
        next.castling.Q = false;
      } else {
        next.castling.k = false;
        next.castling.q = false;
      }
    }
    if (piece.toUpperCase() === "R") {
      if (from.r === 7 && from.c === 0) next.castling.Q = false;
      if (from.r === 7 && from.c === 7) next.castling.K = false;
      if (from.r === 0 && from.c === 0) next.castling.q = false;
      if (from.r === 0 && from.c === 7) next.castling.k = false;
    }
    if (captured) {
      if (to.r === 7 && to.c === 0) next.castling.Q = false;
      if (to.r === 7 && to.c === 7) next.castling.K = false;
      if (to.r === 0 && to.c === 0) next.castling.q = false;
      if (to.r === 0 && to.c === 7) next.castling.k = false;
    }

    next.ep = null;
    if (piece.toUpperCase() === "P" && Math.abs(to.r - from.r) === 2) {
      next.ep = { r: (from.r + to.r) / 2, c: from.c };
    }

    if (piece.toUpperCase() === "P" || captured) next.halfmove = 0;
    else next.halfmove += 1;

    if (prev.turn === "b") next.fullmove += 1;
    next.turn = opponent(prev.turn);
    next.lastMove = { from: { ...from }, to: { ...to } };
    next.status = "playing";
    return next;
  }

  function evaluateStatus(state) {
    const moves = allLegalMoves(state);
    const inCheck = isInCheck(state.board, state.turn);
    if (moves.length === 0) {
      state.status = inCheck ? "checkmate" : "stalemate";
    } else if (inCheck) {
      state.status = "check";
    } else {
      state.status = "playing";
    }
  }

  function pieceSortKey(p) {
    const order = { q: 0, r: 1, b: 2, n: 3, p: 4 };
    return order[p.toLowerCase()] ?? 5;
  }

  function renderCaptured() {
    const whiteTook = state.capturedByWhite
      .slice()
      .sort((a, b) => pieceSortKey(a) - pieceSortKey(b))
      .map((p) => PIECES[p])
      .join("");
    const blackTook = state.capturedByBlack
      .slice()
      .sort((a, b) => pieceSortKey(a) - pieceSortKey(b))
      .map((p) => PIECES[p])
      .join("");
    capturedByWhiteEl.textContent = whiteTook || "—";
    capturedByBlackEl.textContent = blackTook || "—";
  }

  function updateLabels() {
    const side = state.turn === "w" ? "White" : "Black";
    if (state.status === "checkmate") {
      const winner = state.turn === "w" ? "Black" : "White";
      turnLabel.textContent = `Checkmate — ${winner} wins`;
      messageEl.hidden = true;
    } else if (state.status === "stalemate") {
      turnLabel.textContent = "Stalemate — draw";
      messageEl.hidden = true;
    } else if (state.status === "check") {
      turnLabel.textContent = `${side} to move`;
      messageEl.hidden = false;
      messageEl.textContent = "Check!";
    } else {
      turnLabel.textContent = `${side} to move`;
      messageEl.hidden = true;
    }
    undoBtn.disabled = history.length === 0 || Boolean(pendingPromotion);
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const kingPos = isInCheck(state.board, state.turn)
      ? findKing(state.board, state.turn)
      : null;

    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const sq = document.createElement("button");
        sq.type = "button";
        sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
        sq.dataset.r = String(r);
        sq.dataset.c = String(c);
        sq.setAttribute("role", "gridcell");
        sq.setAttribute("aria-label", coordToAlgebraic(r, c));

        const piece = state.board[r][c];
        if (piece) {
          sq.classList.add("has-piece");
          const span = document.createElement("span");
          span.className = "piece";
          span.textContent = PIECES[piece];
          sq.appendChild(span);
        }

        if (selected && selected.r === r && selected.c === c) {
          sq.classList.add("selected");
        }
        if (legalTargets.some((m) => m.to.r === r && m.to.c === c)) {
          sq.classList.add("legal");
        }
        if (
          state.lastMove &&
          ((state.lastMove.from.r === r && state.lastMove.from.c === c) ||
            (state.lastMove.to.r === r && state.lastMove.to.c === c))
        ) {
          sq.classList.add("last-move");
        }
        if (kingPos && kingPos.r === r && kingPos.c === c && (state.status === "check" || state.status === "checkmate")) {
          sq.classList.add("in-check");
        }

        if (r === 7) {
          const file = document.createElement("span");
          file.className = "coord file";
          file.textContent = String.fromCharCode(97 + c);
          sq.appendChild(file);
        }
        if (c === 0) {
          const rank = document.createElement("span");
          rank.className = "coord rank";
          rank.textContent = String(8 - r);
          sq.appendChild(rank);
        }

        sq.addEventListener("click", () => onSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }

    renderCaptured();
    updateLabels();
  }

  function clearSelection() {
    selected = null;
    legalTargets = [];
  }

  function onSquareClick(r, c) {
    if (pendingPromotion || state.status === "checkmate" || state.status === "stalemate") {
      return;
    }

    const piece = state.board[r][c];

    if (selected) {
      const move = legalTargets.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        if (move.promote) {
          pendingPromotion = move;
          openPromotion(state.turn);
          return;
        }
        commitMove(move, "Q");
        return;
      }
      if (piece && colorOf(piece) === state.turn) {
        selected = { r, c };
        legalTargets = legalMovesForSquare(state, r, c);
        renderBoard();
        return;
      }
      clearSelection();
      renderBoard();
      return;
    }

    if (piece && colorOf(piece) === state.turn) {
      selected = { r, c };
      legalTargets = legalMovesForSquare(state, r, c);
      renderBoard();
    }
  }

  function commitMove(move, promotion) {
    history.push(cloneState(state));
    state = applyMove(state, move, promotion, false);
    evaluateStatus(state);
    clearSelection();
    pendingPromotion = null;
    renderBoard();
  }

  function openPromotion(color) {
    const choices = color === "w" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
    promoteChoices.innerHTML = "";
    choices.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = PIECES[p];
      btn.setAttribute("aria-label", `Promote to ${p.toUpperCase()}`);
      btn.addEventListener("click", () => {
        promoteModal.hidden = true;
        commitMove(pendingPromotion, p.toUpperCase());
      });
      promoteChoices.appendChild(btn);
    });
    promoteModal.hidden = false;
  }

  function newGame() {
    state = parseFen(START_FEN);
    history = [];
    clearSelection();
    pendingPromotion = null;
    promoteModal.hidden = true;
    renderBoard();
  }

  function undo() {
    if (!history.length || pendingPromotion) return;
    state = history.pop();
    clearSelection();
    renderBoard();
  }

  newGameBtn.addEventListener("click", newGame);
  undoBtn.addEventListener("click", undo);
  promoteModal.addEventListener("click", (e) => {
    if (e.target === promoteModal) {
      // Keep modal open until a choice is made — promotion is mandatory.
    }
  });

  newGame();
})();
