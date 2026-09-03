const assert = require("assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const sandbox = { console, globalThis: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "chess-engine.js"), "utf8"), sandbox);
const { ChessEngine } = sandbox;

function play(sans) {
  let state = ChessEngine.createState();
  for (const san of sans) {
    const legal = ChessEngine.getLegalMoves(state);
    const match = legal.find((m) => {
      const result = ChessEngine.makeMove(state, m.from, m.to, m.needsPromotion ? "queen" : undefined);
      return result.ok && result.move.san.replace(/[+#]/g, "") === san.replace(/[+#]/g, "");
    });
    assert(match, `Could not play ${san} in ${state.moveHistory.map((m) => m.san).join(" ")}`);
    const promo = match.needsPromotion ? "queen" : undefined;
    const result = ChessEngine.makeMove(state, match.from, match.to, promo);
    assert(result.ok, result.error);
    state = result.state;
  }
  return state;
}

function move(state, from, to, promo) {
  const result = ChessEngine.makeMove(
    state,
    ChessEngine.parseSquare(from),
    ChessEngine.parseSquare(to),
    promo
  );
  if (!result.ok) {
    const legal = ChessEngine.getLegalMoves(state).map((m) => {
      return `${ChessEngine.squareName(m.from.r, m.from.c)}${ChessEngine.squareName(m.to.r, m.to.c)}${m.needsPromotion ? "=Q" : ""}`;
    });
    console.error("Failed", from, to, result, "legal:", legal);
    console.error("turn", state.turn, "history", state.moveHistory.map((m) => m.san));
  }
  assert(result.ok, result.error || `Failed ${from}${to}`);
  return result.state;
}

let state = ChessEngine.createState();
assert.strictEqual(ChessEngine.getLegalMoves(state).length, 20);

state = play(["f3", "e5", "g4", "Qh4"]);
assert.strictEqual(state.endReason, "checkmate");
assert.strictEqual(state.winner, "black");

state = play(["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7"]);
assert.strictEqual(state.endReason, "checkmate");
assert.strictEqual(state.winner, "white");

state = ChessEngine.createState();
state = move(state, "e2", "e4");
state = move(state, "e7", "e5");
state = move(state, "g1", "f3");
state = move(state, "b8", "c6");
state = move(state, "f1", "c4");
state = move(state, "g8", "f6");
state = move(state, "e1", "g1");
assert.strictEqual(state.moveHistory.at(-1).castle, "king");
assert.strictEqual(state.moveHistory.at(-1).san, "O-O");
assert.strictEqual(state.board[7][6].type, "king");
assert.strictEqual(state.board[7][5].type, "rook");

state = ChessEngine.createState();
state = move(state, "d2", "d4");
state = move(state, "a7", "a6");
state = move(state, "b1", "c3");
state = move(state, "a6", "a5");
state = move(state, "c1", "f4");
state = move(state, "a5", "a4");
state = move(state, "d1", "d2");
state = move(state, "a4", "a3");
state = move(state, "e1", "c1");
assert.strictEqual(state.moveHistory.at(-1).castle, "queen");
assert.strictEqual(state.moveHistory.at(-1).san, "O-O-O");
assert.strictEqual(state.board[7][2].type, "king");
assert.strictEqual(state.board[7][3].type, "rook");

state = ChessEngine.createState();
state = move(state, "e2", "e4");
state = move(state, "d7", "d5");
state = move(state, "e4", "d5");
state = move(state, "e7", "e5");
state = move(state, "d5", "e6");
assert.strictEqual(state.moveHistory.at(-1).enPassant, true);
assert.strictEqual(state.board[3][4], null);
assert.strictEqual(state.board[2][4].type, "pawn");
assert.strictEqual(state.board[2][4].color, "white");

state = ChessEngine.createState();
for (const [from, to, promo] of [
  ["a2", "a4"],
  ["b8", "c6"],
  ["a4", "a5"],
  ["c6", "b8"],
  ["a5", "a6"],
  ["b8", "c6"],
  ["a6", "b7"],
  ["g8", "f6"],
  ["b7", "b8", "queen"],
]) {
  state = move(state, from, to, promo);
}
assert.strictEqual(state.board[0][1].type, "queen");
assert.strictEqual(state.board[0][1].color, "white");
assert.strictEqual(state.moveHistory.at(-1).san.includes("=Q"), true);

state = ChessEngine.createState();
state = ChessEngine.resign(state, "white");
assert.strictEqual(state.winner, "black");
assert.strictEqual(state.endReason, "resignation");

state = ChessEngine.createState();
state = ChessEngine.agreeDraw(state);
assert.strictEqual(state.winner, "draw");
assert.strictEqual(state.endReason, "agreement");

state = play(["e3", "a5", "Qh5", "Ra6", "Qxa5", "h5", "h4", "Rah6", "Qxc7", "f6", "Qxd7", "Kf7", "Qxb7", "Qd3", "Qxb8", "Qh7", "Qxc8", "Kg6", "Qe6"]);
assert.strictEqual(state.endReason, "stalemate");
assert.strictEqual(state.winner, "draw");

const blocked = ChessEngine.createState();
const illegal = ChessEngine.makeMove(
  blocked,
  ChessEngine.parseSquare("e2"),
  ChessEngine.parseSquare("e5")
);
assert.strictEqual(illegal.ok, false);

function perft(state, depth) {
  if (depth === 0) return 1;
  const moves = ChessEngine.getLegalMoves(state);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const m of moves) {
    if (m.needsPromotion) {
      for (const piece of ["queen", "rook", "bishop", "knight"]) {
        const result = ChessEngine.makeMove(state, m.from, m.to, piece);
        nodes += perft(result.state, depth - 1);
      }
    } else {
      const result = ChessEngine.makeMove(state, m.from, m.to);
      nodes += perft(result.state, depth - 1);
    }
  }
  return nodes;
}

assert.strictEqual(perft(ChessEngine.createState(), 1), 20);
assert.strictEqual(perft(ChessEngine.createState(), 2), 400);
assert.strictEqual(perft(ChessEngine.createState(), 3), 8902);

console.log("All chess engine tests passed.");
