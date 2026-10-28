// Simple chess engine. Works in the browser as a global `ChessEngine` and in
// Node via `require('./engine')`.
//
// Board representation
// --------------------
// board[r][f] represents the square at rank r and file f, where r = 0 is
// the 8th rank (Black's back row) and r = 7 is the 1st rank (White's back
// row). f = 0 is the a-file, f = 7 is the h-file. Each cell is either
// null (empty) or an object { c: 'w' | 'b', t: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' }.

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ChessEngine = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const PIECE_LETTER = { k: "K", q: "Q", r: "R", b: "B", n: "N" };

  const START_POSITION = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];

  function makeInitialBoard() {
    return START_POSITION.map((row) =>
      row.map((code) => (code ? { c: code[0], t: code[1].toLowerCase() } : null))
    );
  }

  function makeInitialState() {
    return {
      board: makeInitialBoard(),
      turn: "w",
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      ep: null,
      halfmove: 0,
      fullmove: 1,
      history: [],
      moves: []
    };
  }

  function inBounds(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }
  function other(color) { return color === "w" ? "b" : "w"; }
  function squareName(r, f) { return FILES[f] + RANKS[r]; }

  const KNIGHT_OFFSETS = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  const KING_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const QUEEN_DIRS = BISHOP_DIRS.concat(ROOK_DIRS);

  function pseudoMovesForPiece(state, r, f) {
    const piece = state.board[r][f];
    if (!piece) return [];
    switch (piece.t) {
      case "p": return pawnMoves(state, r, f, piece.c);
      case "n": return knightMoves(state, r, f, piece.c);
      case "b": return slidingMoves(state, r, f, piece.c, BISHOP_DIRS);
      case "r": return slidingMoves(state, r, f, piece.c, ROOK_DIRS);
      case "q": return slidingMoves(state, r, f, piece.c, QUEEN_DIRS);
      case "k": return kingMoves(state, r, f, piece.c);
    }
    return [];
  }

  function pawnMoves(state, r, f, color) {
    const moves = [];
    const dir = color === "w" ? -1 : 1;
    const startRank = color === "w" ? 6 : 1;
    const promotionRank = color === "w" ? 0 : 7;

    const oneAhead = r + dir;
    if (inBounds(oneAhead, f) && !state.board[oneAhead][f]) {
      if (oneAhead === promotionRank) {
        for (const promo of ["q", "r", "b", "n"]) {
          moves.push({ from: [r, f], to: [oneAhead, f], promotion: promo });
        }
      } else {
        moves.push({ from: [r, f], to: [oneAhead, f] });
        const twoAhead = r + 2 * dir;
        if (r === startRank && !state.board[twoAhead][f]) {
          moves.push({ from: [r, f], to: [twoAhead, f], doubleStep: true });
        }
      }
    }

    for (const df of [-1, 1]) {
      const nr = r + dir;
      const nf = f + df;
      if (!inBounds(nr, nf)) continue;
      const target = state.board[nr][nf];
      if (target && target.c !== color) {
        if (nr === promotionRank) {
          for (const promo of ["q", "r", "b", "n"]) {
            moves.push({ from: [r, f], to: [nr, nf], promotion: promo });
          }
        } else {
          moves.push({ from: [r, f], to: [nr, nf] });
        }
      } else if (!target && state.ep && state.ep.r === nr && state.ep.f === nf) {
        moves.push({ from: [r, f], to: [nr, nf], enPassant: true });
      }
    }
    return moves;
  }

  function knightMoves(state, r, f, color) {
    const moves = [];
    for (const [dr, df] of KNIGHT_OFFSETS) {
      const nr = r + dr;
      const nf = f + df;
      if (!inBounds(nr, nf)) continue;
      const target = state.board[nr][nf];
      if (!target || target.c !== color) moves.push({ from: [r, f], to: [nr, nf] });
    }
    return moves;
  }

  function slidingMoves(state, r, f, color, dirs) {
    const moves = [];
    for (const [dr, df] of dirs) {
      let nr = r + dr;
      let nf = f + df;
      while (inBounds(nr, nf)) {
        const target = state.board[nr][nf];
        if (!target) {
          moves.push({ from: [r, f], to: [nr, nf] });
        } else {
          if (target.c !== color) moves.push({ from: [r, f], to: [nr, nf] });
          break;
        }
        nr += dr;
        nf += df;
      }
    }
    return moves;
  }

  function kingMoves(state, r, f, color) {
    const moves = [];
    for (const [dr, df] of KING_OFFSETS) {
      const nr = r + dr;
      const nf = f + df;
      if (!inBounds(nr, nf)) continue;
      const target = state.board[nr][nf];
      if (!target || target.c !== color) moves.push({ from: [r, f], to: [nr, nf] });
    }

    const backRank = color === "w" ? 7 : 0;
    if (r === backRank && f === 4) {
      const rights = state.castling;
      const canKing = color === "w" ? rights.wK : rights.bK;
      const canQueen = color === "w" ? rights.wQ : rights.bQ;
      if (canKing && canCastle(state, color, "K")) {
        moves.push({ from: [r, f], to: [backRank, 6], castle: "K" });
      }
      if (canQueen && canCastle(state, color, "Q")) {
        moves.push({ from: [r, f], to: [backRank, 2], castle: "Q" });
      }
    }
    return moves;
  }

  function canCastle(state, color, side) {
    const backRank = color === "w" ? 7 : 0;
    const king = state.board[backRank][4];
    if (!king || king.t !== "k" || king.c !== color) return false;
    const rookFile = side === "K" ? 7 : 0;
    const rook = state.board[backRank][rookFile];
    if (!rook || rook.t !== "r" || rook.c !== color) return false;

    const between = side === "K" ? [5, 6] : [1, 2, 3];
    for (const bf of between) if (state.board[backRank][bf]) return false;

    if (isSquareAttacked(state.board, backRank, 4, other(color))) return false;
    const pathSquares = side === "K" ? [5, 6] : [3, 2];
    for (const pf of pathSquares) {
      if (isSquareAttacked(state.board, backRank, pf, other(color))) return false;
    }
    return true;
  }

  function isSquareAttacked(board, r, f, byColor) {
    const dir = byColor === "w" ? -1 : 1;
    for (const df of [-1, 1]) {
      const pr = r - dir;
      const pf = f + df;
      if (inBounds(pr, pf)) {
        const p = board[pr][pf];
        if (p && p.c === byColor && p.t === "p") return true;
      }
    }

    for (const [dr, df] of KNIGHT_OFFSETS) {
      const nr = r + dr;
      const nf = f + df;
      if (!inBounds(nr, nf)) continue;
      const p = board[nr][nf];
      if (p && p.c === byColor && p.t === "n") return true;
    }

    for (const [dr, df] of BISHOP_DIRS) {
      let nr = r + dr, nf = f + df;
      while (inBounds(nr, nf)) {
        const p = board[nr][nf];
        if (p) {
          if (p.c === byColor && (p.t === "b" || p.t === "q")) return true;
          break;
        }
        nr += dr; nf += df;
      }
    }

    for (const [dr, df] of ROOK_DIRS) {
      let nr = r + dr, nf = f + df;
      while (inBounds(nr, nf)) {
        const p = board[nr][nf];
        if (p) {
          if (p.c === byColor && (p.t === "r" || p.t === "q")) return true;
          break;
        }
        nr += dr; nf += df;
      }
    }

    for (const [dr, df] of KING_OFFSETS) {
      const nr = r + dr;
      const nf = f + df;
      if (!inBounds(nr, nf)) continue;
      const p = board[nr][nf];
      if (p && p.c === byColor && p.t === "k") return true;
    }

    return false;
  }

  function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (p && p.c === color && p.t === "k") return [r, f];
      }
    }
    return null;
  }

  function kingInCheck(state, color) {
    const king = findKing(state.board, color);
    if (!king) return false;
    return isSquareAttacked(state.board, king[0], king[1], other(color));
  }

  function legalMovesFor(state, r, f) {
    const piece = state.board[r][f];
    if (!piece || piece.c !== state.turn) return [];
    const pseudo = pseudoMovesForPiece(state, r, f);
    const legal = [];
    for (const move of pseudo) {
      const snap = applyMoveInPlace(state, move);
      const stillInCheck = kingInCheck(state, piece.c);
      undoMoveInPlace(state, snap);
      if (!stillInCheck) legal.push(move);
    }
    return legal;
  }

  function allLegalMoves(state, color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = state.board[r][f];
        if (p && p.c === color) {
          for (const m of legalMovesFor(state, r, f)) moves.push(m);
        }
      }
    }
    return moves;
  }

  function applyMoveInPlace(state, move) {
    const [fr, ff] = move.from;
    const [tr, tf] = move.to;
    const piece = state.board[fr][ff];
    const captured = state.board[tr][tf];

    const snap = {
      move,
      piece: { c: piece.c, t: piece.t },
      captured: captured ? { c: captured.c, t: captured.t } : null,
      ep: state.ep ? { r: state.ep.r, f: state.ep.f } : null,
      castling: { ...state.castling },
      halfmove: state.halfmove,
      fullmove: state.fullmove,
      turn: state.turn,
      extra: null
    };

    state.board[fr][ff] = null;
    state.board[tr][tf] = { c: piece.c, t: piece.t };

    if (move.enPassant) {
      const dir = piece.c === "w" ? 1 : -1;
      const capR = tr + dir;
      snap.extra = { type: "ep", piece: state.board[capR][tf], r: capR, f: tf };
      state.board[capR][tf] = null;
    }

    if (move.castle) {
      const backRank = piece.c === "w" ? 7 : 0;
      if (move.castle === "K") {
        const rook = state.board[backRank][7];
        state.board[backRank][7] = null;
        state.board[backRank][5] = rook;
        snap.extra = { type: "castle", side: "K" };
      } else {
        const rook = state.board[backRank][0];
        state.board[backRank][0] = null;
        state.board[backRank][3] = rook;
        snap.extra = { type: "castle", side: "Q" };
      }
    }

    if (move.promotion) state.board[tr][tf].t = move.promotion;

    state.ep = null;
    if (move.doubleStep) {
      const dir = piece.c === "w" ? -1 : 1;
      state.ep = { r: fr + dir, f: ff };
    }

    if (piece.t === "k") {
      if (piece.c === "w") { state.castling.wK = false; state.castling.wQ = false; }
      else { state.castling.bK = false; state.castling.bQ = false; }
    }
    if (piece.t === "r") {
      if (piece.c === "w" && fr === 7 && ff === 0) state.castling.wQ = false;
      if (piece.c === "w" && fr === 7 && ff === 7) state.castling.wK = false;
      if (piece.c === "b" && fr === 0 && ff === 0) state.castling.bQ = false;
      if (piece.c === "b" && fr === 0 && ff === 7) state.castling.bK = false;
    }
    if (captured && captured.t === "r") {
      if (tr === 7 && tf === 0) state.castling.wQ = false;
      if (tr === 7 && tf === 7) state.castling.wK = false;
      if (tr === 0 && tf === 0) state.castling.bQ = false;
      if (tr === 0 && tf === 7) state.castling.bK = false;
    }

    if (piece.t === "p" || captured || move.enPassant) state.halfmove = 0;
    else state.halfmove += 1;

    if (state.turn === "b") state.fullmove += 1;
    state.turn = other(state.turn);

    return snap;
  }

  function undoMoveInPlace(state, snap) {
    const move = snap.move;
    const [fr, ff] = move.from;
    const [tr, tf] = move.to;

    state.board[fr][ff] = { c: snap.piece.c, t: snap.piece.t };
    state.board[tr][tf] = snap.captured ? { c: snap.captured.c, t: snap.captured.t } : null;

    if (snap.extra && snap.extra.type === "ep") {
      state.board[snap.extra.r][snap.extra.f] = snap.extra.piece;
      state.board[tr][tf] = null;
    }

    if (snap.extra && snap.extra.type === "castle") {
      const backRank = snap.piece.c === "w" ? 7 : 0;
      if (snap.extra.side === "K") {
        const rook = state.board[backRank][5];
        state.board[backRank][5] = null;
        state.board[backRank][7] = rook;
      } else {
        const rook = state.board[backRank][3];
        state.board[backRank][3] = null;
        state.board[backRank][0] = rook;
      }
    }

    state.ep = snap.ep ? { r: snap.ep.r, f: snap.ep.f } : null;
    state.castling = { ...snap.castling };
    state.halfmove = snap.halfmove;
    state.fullmove = snap.fullmove;
    state.turn = snap.turn;
  }

  function moveToSan(state, move) {
    if (move.castle === "K") return decorate(state, move, "O-O");
    if (move.castle === "Q") return decorate(state, move, "O-O-O");

    const [fr, ff] = move.from;
    const [tr, tf] = move.to;
    const piece = state.board[fr][ff];
    const captured = state.board[tr][tf] || move.enPassant;

    let san = "";
    if (piece.t === "p") {
      if (captured) san += FILES[ff] + "x";
      san += squareName(tr, tf);
      if (move.promotion) san += "=" + PIECE_LETTER[move.promotion];
    } else {
      san += PIECE_LETTER[piece.t];
      san += disambiguate(state, move, piece);
      if (captured) san += "x";
      san += squareName(tr, tf);
    }
    return decorate(state, move, san);
  }

  function disambiguate(state, move, piece) {
    const [fr, ff] = move.from;
    const [tr, tf] = move.to;
    const candidates = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (r === fr && f === ff) continue;
        const p = state.board[r][f];
        if (!p || p.c !== piece.c || p.t !== piece.t) continue;
        const moves = legalMovesFor(state, r, f);
        for (const m of moves) {
          if (m.to[0] === tr && m.to[1] === tf) {
            candidates.push([r, f]);
            break;
          }
        }
      }
    }
    if (candidates.length === 0) return "";
    const sameFile = candidates.some(([, f]) => f === ff);
    const sameRank = candidates.some(([r]) => r === fr);
    if (!sameFile) return FILES[ff];
    if (!sameRank) return RANKS[fr];
    return FILES[ff] + RANKS[fr];
  }

  function decorate(state, move, san) {
    const snap = applyMoveInPlace(state, move);
    const opponent = state.turn;
    const hasMoves = allLegalMoves(state, opponent).length > 0;
    const inCheck = kingInCheck(state, opponent);
    undoMoveInPlace(state, snap);
    if (inCheck && !hasMoves) return san + "#";
    if (inCheck) return san + "+";
    return san;
  }

  function checkGameState(state) {
    const moves = allLegalMoves(state, state.turn);
    const inCheck = kingInCheck(state, state.turn);
    if (moves.length === 0) {
      return inCheck
        ? { over: true, result: "checkmate", winner: other(state.turn) }
        : { over: true, result: "stalemate", winner: null };
    }
    if (state.halfmove >= 100) return { over: true, result: "fifty-move", winner: null };
    if (isInsufficientMaterial(state.board)) return { over: true, result: "insufficient", winner: null };
    return { over: false, inCheck };
  }

  function isInsufficientMaterial(board) {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p) continue;
        if (p.t === "p" || p.t === "r" || p.t === "q") return false;
        pieces.push({ c: p.c, t: p.t, square: (r + f) % 2 });
      }
    }
    if (pieces.length === 2) return true;
    if (pieces.length === 3) return pieces.some((p) => p.t === "n" || p.t === "b");
    if (pieces.length === 4) {
      const bishops = pieces.filter((p) => p.t === "b");
      if (bishops.length === 2 && bishops[0].c !== bishops[1].c &&
          bishops[0].square === bishops[1].square) return true;
    }
    return false;
  }

  return {
    FILES, RANKS,
    makeInitialState, makeInitialBoard,
    pseudoMovesForPiece, legalMovesFor, allLegalMoves,
    applyMoveInPlace, undoMoveInPlace,
    kingInCheck, findKing, isSquareAttacked,
    checkGameState, isInsufficientMaterial,
    moveToSan, squareName, other
  };
}));
