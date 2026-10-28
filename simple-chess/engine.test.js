// Node-only tests for the chess engine. Run with `node simple-chess/engine.test.js`.
// Exit code 0 means all assertions passed.

const E = require("./engine");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("  OK   " + name);
    passed += 1;
  } catch (err) {
    console.log("  FAIL " + name + ": " + err.message);
    failed += 1;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || "expected equal") + " — got " + JSON.stringify(a) + ", expected " + JSON.stringify(b));
}

function fileIdx(file) { return "abcdefgh".indexOf(file); }
function rankIdx(rank) { return 8 - Number(rank); }
function sq(s) { return [rankIdx(s[1]), fileIdx(s[0])]; }

function moveBySquares(state, fromSq, toSq, promotion) {
  const [fr, ff] = sq(fromSq);
  const [tr, tf] = sq(toSq);
  const legal = E.legalMovesFor(state, fr, ff);
  const m = legal.find((mv) =>
    mv.to[0] === tr && mv.to[1] === tf && (!promotion || mv.promotion === promotion)
  );
  if (!m) throw new Error("No legal move " + fromSq + "->" + toSq + (promotion ? "=" + promotion : ""));
  return m;
}

function play(state, pairs) {
  for (const p of pairs) {
    const [from, to, promo] = p;
    const m = moveBySquares(state, from, to, promo);
    E.applyMoveInPlace(state, m);
  }
}

// ---------------------------------------------------------------------------

test("initial state has 32 pieces, White to move", () => {
  const s = E.makeInitialState();
  let count = 0;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) if (s.board[r][f]) count++;
  eq(count, 32);
  eq(s.turn, "w");
});

test("initial legal move count: 20", () => {
  const s = E.makeInitialState();
  eq(E.allLegalMoves(s, "w").length, 20);
});

test("pawn two-step from start, blocked otherwise", () => {
  const s = E.makeInitialState();
  const e2 = E.legalMovesFor(s, 6, 4);
  eq(e2.length, 2);
  E.applyMoveInPlace(s, moveBySquares(s, "e2", "e4"));
  E.applyMoveInPlace(s, moveBySquares(s, "e7", "e5"));
  const e4 = E.legalMovesFor(s, 4, 4);
  eq(e4.length, 0, "e4 blocked by e5");
});

test("knight has 2 opening moves from b1", () => {
  const s = E.makeInitialState();
  eq(E.legalMovesFor(s, 7, 1).length, 2);
});

test("Scholar's mate: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#", () => {
  const s = E.makeInitialState();
  play(s, [
    ["e2", "e4"], ["e7", "e5"],
    ["f1", "c4"], ["b8", "c6"],
    ["d1", "h5"], ["g8", "f6"],
    ["h5", "f7"]
  ]);
  const outcome = E.checkGameState(s);
  eq(outcome.over, true);
  eq(outcome.result, "checkmate");
  eq(outcome.winner, "w");
});

test("Fool's mate: 1.f3 e5 2.g4 Qh4#", () => {
  const s = E.makeInitialState();
  play(s, [
    ["f2", "f3"], ["e7", "e5"],
    ["g2", "g4"], ["d8", "h4"]
  ]);
  const outcome = E.checkGameState(s);
  eq(outcome.over, true);
  eq(outcome.result, "checkmate");
  eq(outcome.winner, "b");
});

test("stalemate: K vs K+Q leading to stalemate", () => {
  // Classic stalemate: Black king on h8, White king on f7, White queen on g6.
  // Black to move; no legal moves and not in check.
  const s = E.makeInitialState();
  // Clear the board.
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) s.board[r][f] = null;
  s.board[0][7] = { c: "b", t: "k" }; // h8
  s.board[1][5] = { c: "w", t: "k" }; // f7
  s.board[2][6] = { c: "w", t: "q" }; // g6
  s.castling = { wK: false, wQ: false, bK: false, bQ: false };
  s.turn = "b";
  const outcome = E.checkGameState(s);
  eq(outcome.over, true);
  eq(outcome.result, "stalemate");
});

test("castling kingside is legal when path is clear and no checks", () => {
  const s = E.makeInitialState();
  // Clear bishop, knight, and pawn in front of king so castling kingside is possible.
  play(s, [
    ["e2", "e4"], ["e7", "e5"],
    ["g1", "f3"], ["g8", "f6"],
    ["f1", "c4"], ["f8", "c5"],
  ]);
  const kingMoves = E.legalMovesFor(s, 7, 4);
  const castle = kingMoves.find((m) => m.castle === "K");
  assert(castle, "expected O-O to be legal");
  E.applyMoveInPlace(s, castle);
  // Rook now on f1, king on g1.
  eq(s.board[7][6].t, "k");
  eq(s.board[7][5].t, "r");
});

test("castling is illegal through check", () => {
  const s = E.makeInitialState();
  // Set up: White king and rooks on original squares, Black rook on f8 attacks f1.
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) s.board[r][f] = null;
  s.board[7][4] = { c: "w", t: "k" };
  s.board[7][7] = { c: "w", t: "r" };
  s.board[7][0] = { c: "w", t: "r" };
  s.board[0][4] = { c: "b", t: "k" };
  s.board[0][5] = { c: "b", t: "r" }; // attacks f-file
  s.castling = { wK: true, wQ: true, bK: false, bQ: false };
  s.turn = "w";
  const kingMoves = E.legalMovesFor(s, 7, 4);
  assert(!kingMoves.some((m) => m.castle === "K"), "O-O should be blocked through check on f1");
});

test("en passant capture", () => {
  const s = E.makeInitialState();
  play(s, [
    ["e2", "e4"], ["a7", "a6"],
    ["e4", "e5"], ["d7", "d5"], // Black double-step next to White pawn
  ]);
  // White should have en passant available: e5 x d6
  const pawn = E.legalMovesFor(s, 3, 4);
  const ep = pawn.find((m) => m.enPassant);
  assert(ep, "e.p. move expected");
  eq(ep.to[0], 2); // r=2 is rank 6
  eq(ep.to[1], 3); // f=3 is d
  E.applyMoveInPlace(s, ep);
  // After en passant the Black pawn on d5 should be gone.
  assert(!s.board[3][3], "black d5 pawn should be captured by en passant");
  assert(s.board[2][3] && s.board[2][3].t === "p" && s.board[2][3].c === "w",
    "white pawn should be on d6");
});

test("promotion offers four pieces and promotes correctly", () => {
  const s = E.makeInitialState();
  // Setup: White pawn on g7, kings on far squares.
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) s.board[r][f] = null;
  s.board[1][6] = { c: "w", t: "p" }; // g7
  s.board[7][0] = { c: "w", t: "k" }; // a1
  s.board[0][0] = { c: "b", t: "k" }; // a8
  s.castling = { wK: false, wQ: false, bK: false, bQ: false };
  s.turn = "w";
  const moves = E.legalMovesFor(s, 1, 6);
  // One target square (g8) with 4 promotion choices.
  const g8 = moves.filter((m) => m.to[0] === 0 && m.to[1] === 6);
  eq(g8.length, 4);
  const choices = g8.map((m) => m.promotion).sort().join(",");
  eq(choices, "b,n,q,r");
  const queen = g8.find((m) => m.promotion === "q");
  E.applyMoveInPlace(s, queen);
  eq(s.board[0][6].t, "q");
  eq(s.board[0][6].c, "w");
});

test("SAN output: e4, Nf3, O-O, exd5, e8=Q+, mate suffix", () => {
  // 1.e4 e5
  const s = E.makeInitialState();
  const e4 = moveBySquares(s, "e2", "e4");
  eq(E.moveToSan(s, e4), "e4");
  E.applyMoveInPlace(s, e4);
  const e5 = moveBySquares(s, "e7", "e5");
  eq(E.moveToSan(s, e5), "e5");
  E.applyMoveInPlace(s, e5);
  // 2.Nf3
  const nf3 = moveBySquares(s, "g1", "f3");
  eq(E.moveToSan(s, nf3), "Nf3");

  // Check captures: setup where White pawn on e4 captures Black pawn on d5.
  const t = E.makeInitialState();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) t.board[r][f] = null;
  t.board[4][4] = { c: "w", t: "p" }; // e4
  t.board[3][3] = { c: "b", t: "p" }; // d5
  t.board[7][4] = { c: "w", t: "k" };
  t.board[0][4] = { c: "b", t: "k" };
  t.castling = { wK: false, wQ: false, bK: false, bQ: false };
  t.turn = "w";
  const cap = moveBySquares(t, "e4", "d5");
  eq(E.moveToSan(t, cap), "exd5");

  // Checkmate suffix via Fool's mate.
  const m = E.makeInitialState();
  play(m, [["f2", "f3"], ["e7", "e5"], ["g2", "g4"]]);
  const qh4 = moveBySquares(m, "d8", "h4");
  eq(E.moveToSan(m, qh4), "Qh4#");
});

test("undo returns state to exactly the previous position", () => {
  const s = E.makeInitialState();
  const serialize = (st) => JSON.stringify({
    board: st.board, turn: st.turn, castling: st.castling,
    ep: st.ep, halfmove: st.halfmove, fullmove: st.fullmove
  });
  const before = serialize(s);
  const m = moveBySquares(s, "e2", "e4");
  const snap = E.applyMoveInPlace(s, m);
  assert(serialize(s) !== before);
  E.undoMoveInPlace(s, snap);
  eq(serialize(s), before);
});

test("insufficient material: K vs K", () => {
  const s = E.makeInitialState();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) s.board[r][f] = null;
  s.board[7][4] = { c: "w", t: "k" };
  s.board[0][4] = { c: "b", t: "k" };
  s.castling = { wK: false, wQ: false, bK: false, bQ: false };
  const outcome = E.checkGameState(s);
  eq(outcome.over, true);
  eq(outcome.result, "insufficient");
});

test("pinned piece cannot move away from pin", () => {
  // White king on e1, white knight on e2, black rook on e8. Knight is pinned
  // and cannot move.
  const s = E.makeInitialState();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) s.board[r][f] = null;
  s.board[7][4] = { c: "w", t: "k" };
  s.board[6][4] = { c: "w", t: "n" };
  s.board[0][4] = { c: "b", t: "r" };
  s.board[0][0] = { c: "b", t: "k" };
  s.castling = { wK: false, wQ: false, bK: false, bQ: false };
  s.turn = "w";
  const knightMoves = E.legalMovesFor(s, 6, 4);
  eq(knightMoves.length, 0, "pinned knight must stay");
});

// ---------------------------------------------------------------------------

console.log("");
console.log("Passed: " + passed + ", Failed: " + failed);
process.exit(failed === 0 ? 0 : 1);
