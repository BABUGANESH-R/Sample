(() => {
  "use strict";

  const PIECES = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };

  const START = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const resetBtn = document.getElementById("reset");
  const capturedWhiteEl = document.getElementById("captured-white");
  const capturedBlackEl = document.getElementById("captured-black");

  let board = [];
  let turn = "w";
  let selected = null;
  let validMoves = [];
  let gameOver = false;
  let captured = { w: [], b: [] };

  function isWhite(piece) {
    return piece !== null && piece === piece.toUpperCase();
  }

  function isBlack(piece) {
    return piece !== null && piece === piece.toLowerCase();
  }

  function colorOf(piece) {
    if (!piece) return null;
    return isWhite(piece) ? "w" : "b";
  }

  function cloneBoard(src) {
    return src.map((row) => row.slice());
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function findKing(b, color) {
    const king = color === "w" ? "K" : "k";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === king) return { r, c };
      }
    }
    return null;
  }

  function isSquareAttacked(b, r, c, byColor) {
    const enemyPawn = byColor === "w" ? "P" : "p";
    const pawnDir = byColor === "w" ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir;
      const pc = c + dc;
      if (inBounds(pr, pc) && b[pr][pc] === enemyPawn) return true;
    }

    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    const enemyKnight = byColor === "w" ? "N" : "n";
    for (const [dr, dc] of knightMoves) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && b[nr][nc] === enemyKnight) return true;
    }

    const enemyKing = byColor === "w" ? "K" : "k";
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && b[nr][nc] === enemyKing) return true;
      }
    }

    const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    const scan = (dirs, pieces) => {
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const p = b[nr][nc];
          if (p) {
            if (pieces.includes(p)) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      return false;
    };

    const enemyRooks = byColor === "w" ? ["R", "Q"] : ["r", "q"];
    const enemyBishops = byColor === "w" ? ["B", "Q"] : ["b", "q"];

    if (scan(rookDirs, enemyRooks)) return true;
    if (scan(bishopDirs, enemyBishops)) return true;

    return false;
  }

  function isInCheck(b, color) {
    const king = findKing(b, color);
    if (!king) return true;
    return isSquareAttacked(b, king.r, king.c, color === "w" ? "b" : "w");
  }

  function rawMoves(b, r, c) {
    const piece = b[r][c];
    if (!piece) return [];
    const type = piece.toUpperCase();
    const white = isWhite(piece);
    const moves = [];

    const addSlide = (dirs) => {
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = b[nr][nc];
          if (!target) {
            moves.push({ r: nr, c: nc });
          } else {
            if (colorOf(target) !== colorOf(piece)) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    };

    if (type === "P") {
      const dir = white ? -1 : 1;
      const startRow = white ? 6 : 1;
      const one = r + dir;
      if (inBounds(one, c) && !b[one][c]) {
        moves.push({ r: one, c });
        const two = r + 2 * dir;
        if (r === startRow && !b[two][c]) {
          moves.push({ r: two, c });
        }
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir;
        const nc = c + dc;
        if (inBounds(nr, nc) && b[nr][nc] && colorOf(b[nr][nc]) !== colorOf(piece)) {
          moves.push({ r: nr, c: nc });
        }
      }
    } else if (type === "N") {
      const jumps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of jumps) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = b[nr][nc];
        if (!target || colorOf(target) !== colorOf(piece)) {
          moves.push({ r: nr, c: nc });
        }
      }
    } else if (type === "B") {
      addSlide([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    } else if (type === "R") {
      addSlide([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    } else if (type === "Q") {
      addSlide([
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ]);
    } else if (type === "K") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = b[nr][nc];
          if (!target || colorOf(target) !== colorOf(piece)) {
            moves.push({ r: nr, c: nc });
          }
        }
      }
    }

    return moves;
  }

  function legalMoves(b, r, c) {
    const piece = b[r][c];
    if (!piece) return [];
    const color = colorOf(piece);
    return rawMoves(b, r, c).filter((m) => {
      const next = cloneBoard(b);
      next[m.r][m.c] = piece;
      next[r][c] = null;
      // Pawn promotion for check simulation
      if (piece.toUpperCase() === "P" && (m.r === 0 || m.r === 7)) {
        next[m.r][m.c] = color === "w" ? "Q" : "q";
      }
      return !isInCheck(next, color);
    });
  }

  function hasAnyLegalMove(b, color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (colorOf(b[r][c]) === color && legalMoves(b, r, c).length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  function promoteIfNeeded(b, r, c) {
    const piece = b[r][c];
    if (!piece || piece.toUpperCase() !== "P") return;
    if (r === 0) b[r][c] = "Q";
    if (r === 7) b[r][c] = "q";
  }

  function updateStatus() {
    statusEl.classList.remove("check", "mate");
    const inCheck = isInCheck(board, turn);
    const canMove = hasAnyLegalMove(board, turn);
    const name = turn === "w" ? "White" : "Black";

    if (!canMove) {
      gameOver = true;
      if (inCheck) {
        const winner = turn === "w" ? "Black" : "White";
        statusEl.textContent = `Checkmate — ${winner} wins`;
        statusEl.classList.add("mate");
      } else {
        statusEl.textContent = "Stalemate — draw";
        statusEl.classList.add("mate");
      }
      return;
    }

    if (inCheck) {
      statusEl.textContent = `${name} in check`;
      statusEl.classList.add("check");
    } else {
      statusEl.textContent = `${name} to move`;
    }
  }

  function renderCaptured() {
    capturedWhiteEl.textContent = captured.b.map((p) => PIECES[p]).join("");
    capturedBlackEl.textContent = captured.w.map((p) => PIECES[p]).join("");
  }

  function render() {
    boardEl.innerHTML = "";
    const kingPos = isInCheck(board, turn) ? findKing(board, turn) : null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement("div");
        sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
        sq.dataset.r = String(r);
        sq.dataset.c = String(c);
        sq.setAttribute("role", "gridcell");

        if (selected && selected.r === r && selected.c === c) {
          sq.classList.add("selected");
        }

        const move = validMoves.find((m) => m.r === r && m.c === c);
        if (move) {
          sq.classList.add(board[r][c] ? "valid-capture" : "valid-move");
        }

        if (kingPos && kingPos.r === r && kingPos.c === c) {
          sq.classList.add("in-check");
        }

        const piece = board[r][c];
        if (piece) {
          const span = document.createElement("span");
          span.className = `piece ${isWhite(piece) ? "white" : "black"}`;
          span.textContent = PIECES[piece];
          sq.appendChild(span);
        }

        sq.addEventListener("click", () => onSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }

    renderCaptured();
  }

  function onSquareClick(r, c) {
    if (gameOver) return;

    const piece = board[r][c];

    if (selected) {
      const move = validMoves.find((m) => m.r === r && m.c === c);
      if (move) {
        makeMove(selected.r, selected.c, r, c);
        return;
      }
      if (piece && colorOf(piece) === turn) {
        selected = { r, c };
        validMoves = legalMoves(board, r, c);
        render();
        return;
      }
      selected = null;
      validMoves = [];
      render();
      return;
    }

    if (piece && colorOf(piece) === turn) {
      selected = { r, c };
      validMoves = legalMoves(board, r, c);
      render();
    }
  }

  function makeMove(fromR, fromC, toR, toC) {
    const piece = board[fromR][fromC];
    const capturedPiece = board[toR][toC];

    if (capturedPiece) {
      captured[turn].push(capturedPiece);
    }

    board[toR][toC] = piece;
    board[fromR][fromC] = null;
    promoteIfNeeded(board, toR, toC);

    selected = null;
    validMoves = [];
    turn = turn === "w" ? "b" : "w";
    updateStatus();
    render();
  }

  function resetGame() {
    board = cloneBoard(START);
    turn = "w";
    selected = null;
    validMoves = [];
    gameOver = false;
    captured = { w: [], b: [] };
    updateStatus();
    render();
  }

  resetBtn.addEventListener("click", resetGame);
  resetGame();
})();
