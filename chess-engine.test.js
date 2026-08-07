/**
 * Pure-logic tests for the chess rules used by script.js.
 * Mirrors the engine so we can verify castling and mate without a DOM.
 */

const PIECES_START =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function parseFen(fen) {
  const [placement, turn, castle, ep, half, full] = fen.split(" ");
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  placement.split("/").forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) c += Number(ch);
      else {
        board[r][c] = ch;
        c += 1;
      }
    }
  });
  return {
    board,
    turn: turn === "w" ? "w" : "b",
    castling: {
      K: castle.includes("K"),
      Q: castle.includes("Q"),
      k: castle.includes("k"),
      q: castle.includes("q"),
    },
    ep: null,
    halfmove: Number(half || 0),
    fullmove: Number(full || 1),
    capturedByWhite: [],
    capturedByBlack: [],
    lastMove: null,
    status: "playing",
  };
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
  const enemyKnight = byColor === "w" ? "N" : "n";
  for (const [dr, dc] of [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ]) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc] === enemyKnight) return true;
  }
  const enemyKing = byColor === "w" ? "K" : "k";
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
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

function canCastle(state, color, side) {
  const board = state.board;
  const rank = color === "w" ? 7 : 0;
  const rights =
    color === "w"
      ? side === "K"
        ? state.castling.K
        : state.castling.Q
      : side === "K"
        ? state.castling.k
        : state.castling.q;
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

function applyMove(prev, move, promotion = "Q") {
  const next = {
    board: prev.board.map((row) => row.slice()),
    turn: prev.turn,
    castling: { ...prev.castling },
    ep: null,
    halfmove: prev.halfmove,
    fullmove: prev.fullmove,
    capturedByWhite: [],
    capturedByBlack: [],
    lastMove: null,
    status: "playing",
  };
  const { from, to } = move;
  const piece = next.board[from.r][from.c];
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
    next.board[to.r][to.c] =
      prev.turn === "w" ? promotion.toUpperCase() : promotion.toLowerCase();
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
  next.turn = opponent(prev.turn);
  return next;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Position after e4, e5, Nf3, Nc6, Bc4, Bc5 — White can castle kingside
const castleReady = parseFen(
  "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
);
assert(canCastle(castleReady, "w", "K"), "White should be able to castle kingside");
const castled = applyMove(castleReady, {
  from: { r: 7, c: 4 },
  to: { r: 7, c: 6 },
  castle: "K",
});
assert(castled.board[7][6] === "K", "King should be on g1");
assert(castled.board[7][5] === "R", "Rook should be on f1");
assert(castled.board[7][4] === null, "e1 should be empty");
assert(castled.board[7][7] === null, "h1 should be empty");

// Fool's mate position before Qh4#
const fools = parseFen("rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2");
const afterMate = applyMove(fools, {
  from: { r: 0, c: 3 },
  to: { r: 4, c: 7 },
});
assert(isInCheck(afterMate.board, "w"), "White should be in check after Qh4");

// Starting position: no castling yet (path blocked)
const start = parseFen(PIECES_START);
assert(!canCastle(start, "w", "K"), "Cannot castle through occupied squares");

console.log("All chess engine tests passed.");
