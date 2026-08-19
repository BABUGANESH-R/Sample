/**
 * Simple two-player chess engine.
 * Pieces: { type, color } where type is pawn|knight|bishop|rook|queen|king
 * and color is white|black. Empty squares are null.
 */
(function (root) {
  const FILES = "abcdefgh";
  const TYPES = ["pawn", "knight", "bishop", "rook", "queen", "king"];
  const PIECE_LETTER = {
    pawn: "",
    knight: "N",
    bishop: "B",
    rook: "R",
    queen: "Q",
    king: "K",
  };

  const START_RANK = {
    white: {
      pawn: 6,
      back: 7,
    },
    black: {
      pawn: 1,
      back: 0,
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function squareName(r, c) {
    return FILES[c] + (8 - r);
  }

  function parseSquare(name) {
    const file = FILES.indexOf(name[0]);
    const rank = 8 - parseInt(name[1], 10);
    return { r: rank, c: file };
  }

  function opposite(color) {
    return color === "white" ? "black" : "white";
  }

  function pieceAt(board, r, c) {
    return board[r][c];
  }

  function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
  }

  function initialBoard() {
    const board = emptyBoard();
    const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: back[c], color: "black" };
      board[1][c] = { type: "pawn", color: "black" };
      board[6][c] = { type: "pawn", color: "white" };
      board[7][c] = { type: back[c], color: "white" };
    }
    return board;
  }

  function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "king" && piece.color === color) {
          return { r, c };
        }
      }
    }
    return null;
  }

  function isSquareAttacked(board, r, c, byColor) {
    const pawnDir = byColor === "white" ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir;
      const pc = c + dc;
      if (inBounds(pr, pc)) {
        const p = board[pr][pc];
        if (p && p.color === byColor && p.type === "pawn") return true;
      }
    }

    const knightDeltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of knightDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === "knight") return true;
    }

    const kingDeltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    for (const [dr, dc] of kingDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === "king") return true;
    }

    const rays = [
      { dr: -1, dc: 0, types: ["rook", "queen"] },
      { dr: 1, dc: 0, types: ["rook", "queen"] },
      { dr: 0, dc: -1, types: ["rook", "queen"] },
      { dr: 0, dc: 1, types: ["rook", "queen"] },
      { dr: -1, dc: -1, types: ["bishop", "queen"] },
      { dr: -1, dc: 1, types: ["bishop", "queen"] },
      { dr: 1, dc: -1, types: ["bishop", "queen"] },
      { dr: 1, dc: 1, types: ["bishop", "queen"] },
    ];
    for (const ray of rays) {
      let nr = r + ray.dr;
      let nc = c + ray.dc;
      while (inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === byColor && ray.types.includes(p.type)) return true;
          break;
        }
        nr += ray.dr;
        nc += ray.dc;
      }
    }

    return false;
  }

  function isKingInCheck(board, color) {
    const king = findKing(board, color);
    if (!king) return false;
    return isSquareAttacked(board, king.r, king.c, opposite(color));
  }

  function slidingMoves(board, r, c, color, directions) {
    const moves = [];
    for (const [dr, dc] of directions) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push({ r: nr, c: nc });
        } else {
          if (target.color !== color) moves.push({ r: nr, c: nc });
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  function pawnPseudoMoves(state, r, c, color) {
    const board = state.board;
    const moves = [];
    const dir = color === "white" ? -1 : 1;
    const startRank = color === "white" ? 6 : 1;
    const promoRank = color === "white" ? 0 : 7;
    const one = r + dir;

    if (inBounds(one, c) && !board[one][c]) {
      moves.push({ r: one, c, promotion: one === promoRank });
      const two = r + dir * 2;
      if (r === startRank && inBounds(two, c) && !board[two][c]) {
        moves.push({ r: two, c, doublePawn: true });
      }
    }

    for (const dc of [-1, 1]) {
      const nc = c + dc;
      if (!inBounds(one, nc)) continue;
      const target = board[one][nc];
      if (target && target.color !== color) {
        moves.push({ r: one, c: nc, promotion: one === promoRank });
      }
      if (
        state.enPassantTarget &&
        state.enPassantTarget.r === one &&
        state.enPassantTarget.c === nc
      ) {
        moves.push({ r: one, c: nc, enPassant: true });
      }
    }

    return moves;
  }

  function piecePseudoMoves(state, r, c) {
    const piece = state.board[r][c];
    if (!piece) return [];
    const { type, color } = piece;
    const board = state.board;

    if (type === "pawn") return pawnPseudoMoves(state, r, c, color);
    if (type === "knight") {
      const deltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      return deltas
        .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
        .filter(({ r: nr, c: nc }) => {
          if (!inBounds(nr, nc)) return false;
          const t = board[nr][nc];
          return !t || t.color !== color;
        });
    }
    if (type === "bishop") {
      return slidingMoves(board, r, c, color, [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ]);
    }
    if (type === "rook") {
      return slidingMoves(board, r, c, color, [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ]);
    }
    if (type === "queen") {
      return slidingMoves(board, r, c, color, [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ]);
    }
    if (type === "king") {
      const deltas = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
      ];
      const moves = deltas
        .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
        .filter(({ r: nr, c: nc }) => {
          if (!inBounds(nr, nc)) return false;
          const t = board[nr][nc];
          return !t || t.color !== color;
        });

      const rights = state.castling[color];
      const back = START_RANK[color].back;
      if (r === back && c === 4 && !isKingInCheck(board, color)) {
        if (rights.king && !board[back][5] && !board[back][6]) {
          const rook = board[back][7];
          if (rook && rook.type === "rook" && rook.color === color) {
            if (
              !isSquareAttacked(board, back, 5, opposite(color)) &&
              !isSquareAttacked(board, back, 6, opposite(color))
            ) {
              moves.push({ r: back, c: 6, castle: "king" });
            }
          }
        }
        if (rights.queen && !board[back][1] && !board[back][2] && !board[back][3]) {
          const rook = board[back][0];
          if (rook && rook.type === "rook" && rook.color === color) {
            if (
              !isSquareAttacked(board, back, 3, opposite(color)) &&
              !isSquareAttacked(board, back, 2, opposite(color))
            ) {
              moves.push({ r: back, c: 2, castle: "queen" });
            }
          }
        }
      }
      return moves;
    }
    return [];
  }

  function applyMoveToBoard(board, from, to, extras) {
    const next = clone(board);
    const piece = next[from.r][from.c];
    next[from.r][from.c] = null;

    if (extras.enPassant) {
      const capR = piece.color === "white" ? to.r + 1 : to.r - 1;
      next[capR][to.c] = null;
    }

    if (extras.castle === "king") {
      const back = from.r;
      next[back][7] = null;
      next[back][5] = { type: "rook", color: piece.color };
    }
    if (extras.castle === "queen") {
      const back = from.r;
      next[back][0] = null;
      next[back][3] = { type: "rook", color: piece.color };
    }

    const placed = extras.promotion
      ? { type: extras.promotion, color: piece.color }
      : piece;
    next[to.r][to.c] = placed;
    return next;
  }

  function capturedPieceForMove(state, from, to, extras) {
    if (extras.enPassant) {
      const capR = state.board[from.r][from.c].color === "white" ? to.r + 1 : to.r - 1;
      return state.board[capR][to.c];
    }
    return state.board[to.r][to.c];
  }

  function updateCastling(castling, from, to, moving, captured) {
    const next = clone(castling);
    if (moving.type === "king") {
      next[moving.color].king = false;
      next[moving.color].queen = false;
    }
    if (moving.type === "rook") {
      if (from.r === START_RANK[moving.color].back && from.c === 0) {
        next[moving.color].queen = false;
      }
      if (from.r === START_RANK[moving.color].back && from.c === 7) {
        next[moving.color].king = false;
      }
    }
    if (captured && captured.type === "rook") {
      const capColor = captured.color;
      if (to.r === START_RANK[capColor].back && to.c === 0) {
        next[capColor].queen = false;
      }
      if (to.r === START_RANK[capColor].back && to.c === 7) {
        next[capColor].king = false;
      }
    }
    return next;
  }

  function needsPromotion(piece, to) {
    return piece.type === "pawn" && (to.r === 0 || to.r === 7);
  }

  function sameMove(a, b) {
    return a.from.r === b.from.r && a.from.c === b.from.c && a.to.r === b.to.r && a.to.c === b.to.c;
  }

  function disambiguate(state, move, candidates) {
    const others = candidates.filter((m) => {
      const piece = state.board[m.from.r][m.from.c];
      return (
        piece &&
        piece.type === move.piece.type &&
        piece.color === move.piece.color &&
        m.to.r === move.to.r &&
        m.to.c === move.to.c &&
        !sameMove(m, move)
      );
    });
    if (others.length === 0) return "";
    const sameFile = others.some((m) => m.from.c === move.from.c);
    const sameRank = others.some((m) => m.from.r === move.from.r);
    if (!sameFile) return FILES[move.from.c];
    if (!sameRank) return String(8 - move.from.r);
    return FILES[move.from.c] + (8 - move.from.r);
  }

  function toSan(state, move, resultingState) {
    if (move.castle === "king") {
      return resultingState.inCheck
        ? resultingState.gameOver
          ? "O-O#"
          : "O-O+"
        : "O-O";
    }
    if (move.castle === "queen") {
      return resultingState.inCheck
        ? resultingState.gameOver
          ? "O-O-O#"
          : "O-O-O+"
        : "O-O-O";
    }

    const legal = getLegalMoves(state);
    let san = PIECE_LETTER[move.piece.type];
    if (move.piece.type !== "pawn") {
      san += disambiguate(state, move, legal);
    } else if (move.captured) {
      san += FILES[move.from.c];
    }
    if (move.captured) san += "x";
    if (move.piece.type === "pawn" && move.captured) {
      // pawn capture already has file
    }
    san += squareName(move.to.r, move.to.c);
    if (move.promotion) san += "=" + PIECE_LETTER[move.promotion];
    if (resultingState.gameOver && resultingState.winner !== "draw") san += "#";
    else if (resultingState.inCheck) san += "+";
    return san;
  }

  function countPieces(board) {
    const counts = {
      white: { total: 0, bishop: 0, knight: 0, other: 0, bishopSquares: [] },
      black: { total: 0, bishop: 0, knight: 0, other: 0, bishopSquares: [] },
    };
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.type === "king") continue;
        counts[p.color].total++;
        if (p.type === "bishop") {
          counts[p.color].bishop++;
          counts[p.color].bishopSquares.push((r + c) % 2);
        } else if (p.type === "knight") {
          counts[p.color].knight++;
        } else {
          counts[p.color].other++;
        }
      }
    }
    return counts;
  }

  function isInsufficientMaterial(board) {
    const c = countPieces(board);
    const w = c.white;
    const b = c.black;
    if (w.other || b.other) return false;
    if (w.total === 0 && b.total === 0) return true;
    if (w.total + b.total === 1 && (w.bishop + w.knight + b.bishop + b.knight === 1)) {
      return true;
    }
    if (w.total === 1 && b.total === 1 && w.bishop === 1 && b.bishop === 1) {
      return w.bishopSquares[0] === b.bishopSquares[0];
    }
    return false;
  }

  function getLegalMoves(state, fromSquare) {
    const color = state.turn;
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (fromSquare && (fromSquare.r !== r || fromSquare.c !== c)) continue;
        const piece = state.board[r][c];
        if (!piece || piece.color !== color) continue;
        const targets = piecePseudoMoves(state, r, c);
        for (const target of targets) {
          const extras = {
            castle: target.castle || null,
            enPassant: !!target.enPassant,
            promotion: target.promotion ? "queen" : null,
          };
          const nextBoard = applyMoveToBoard(state.board, { r, c }, target, extras);
          if (isKingInCheck(nextBoard, color)) continue;
          moves.push({
            from: { r, c },
            to: { r: target.r, c: target.c },
            piece,
            captured: capturedPieceForMove(state, { r, c }, target, extras),
            castle: extras.castle,
            enPassant: extras.enPassant,
            promotion: extras.promotion,
            needsPromotion: !!target.promotion,
          });
        }
      }
    }
    return moves;
  }

  function createState() {
    return {
      board: initialBoard(),
      turn: "white",
      castling: {
        white: { king: true, queen: true },
        black: { king: true, queen: true },
      },
      enPassantTarget: null,
      halfmoveClock: 0,
      fullmoveNumber: 1,
      inCheck: false,
      gameOver: false,
      winner: null,
      endReason: null,
      moveHistory: [],
      capturedByWhite: [],
      capturedByBlack: [],
    };
  }

  function evaluateEnd(state) {
    if (isInsufficientMaterial(state.board)) {
      state.gameOver = true;
      state.winner = "draw";
      state.endReason = "insufficient";
      return;
    }
    if (state.halfmoveClock >= 100) {
      state.gameOver = true;
      state.winner = "draw";
      state.endReason = "fifty-move";
      return;
    }
    const legal = getLegalMoves(state);
    state.inCheck = isKingInCheck(state.board, state.turn);
    if (legal.length === 0) {
      state.gameOver = true;
      if (state.inCheck) {
        state.winner = opposite(state.turn);
        state.endReason = "checkmate";
      } else {
        state.winner = "draw";
        state.endReason = "stalemate";
      }
    }
  }

  function makeMove(state, from, to, promotion) {
    if (state.gameOver) return { ok: false, error: "Game is over" };
    const legal = getLegalMoves(state, from);
    const match = legal.find((m) => m.to.r === to.r && m.to.c === to.c);
    if (!match) return { ok: false, error: "Illegal move" };

    if (match.needsPromotion) {
      if (!promotion || !["queen", "rook", "bishop", "knight"].includes(promotion)) {
        return { ok: false, error: "Promotion required", needsPromotion: true, move: match };
      }
      match.promotion = promotion;
    }

    const moving = state.board[from.r][from.c];
    const captured = match.captured;
    const extras = {
      castle: match.castle,
      enPassant: match.enPassant,
      promotion: match.promotion,
    };

    const next = clone(state);
    next.board = applyMoveToBoard(state.board, from, to, extras);
    next.castling = updateCastling(state.castling, from, to, moving, captured);
    next.enPassantTarget = null;
    if (moving.type === "pawn" && Math.abs(to.r - from.r) === 2) {
      next.enPassantTarget = { r: (from.r + to.r) / 2, c: from.c };
    }
    next.halfmoveClock = moving.type === "pawn" || captured ? 0 : state.halfmoveClock + 1;
    if (captured) {
      if (moving.color === "white") next.capturedByWhite.push(captured.type);
      else next.capturedByBlack.push(captured.type);
    }

    next.turn = opposite(state.turn);
    if (moving.color === "black") next.fullmoveNumber = state.fullmoveNumber + 1;

    const applied = {
      from,
      to,
      piece: moving,
      captured,
      castle: match.castle,
      enPassant: match.enPassant,
      promotion: match.promotion,
    };
    evaluateEnd(next);
    applied.san = toSan(state, applied, next);
    next.moveHistory = state.moveHistory.concat(applied);

    return { ok: true, state: next, move: applied };
  }

  function resign(state, color) {
    if (state.gameOver) return state;
    const next = clone(state);
    next.gameOver = true;
    next.winner = opposite(color);
    next.endReason = "resignation";
    return next;
  }

  function agreeDraw(state) {
    if (state.gameOver) return state;
    const next = clone(state);
    next.gameOver = true;
    next.winner = "draw";
    next.endReason = "agreement";
    return next;
  }

  function legalSquares(state, from) {
    return getLegalMoves(state, from).map((m) => m.to);
  }

  root.ChessEngine = {
    FILES,
    TYPES,
    createState,
    getLegalMoves,
    legalSquares,
    makeMove,
    resign,
    agreeDraw,
    isKingInCheck,
    squareName,
    parseSquare,
    opposite,
    clone,
  };
})(typeof window !== "undefined" ? window : globalThis);
