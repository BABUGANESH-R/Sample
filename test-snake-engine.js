const assert = require("assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const sandbox = { console, globalThis: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "snake-engine.js"), "utf8"), sandbox);
const { SnakeEngine } = sandbox;

function seeded(seed) {
  let a = seed;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function running(opts) {
  const s = SnakeEngine.createState(Object.assign({ rng: seeded(1) }, opts));
  SnakeEngine.start(s);
  return s;
}

function cells(s) {
  return JSON.parse(JSON.stringify(s.snake));
}

// Initial state
{
  const s = SnakeEngine.createState({ cols: 10, rows: 8, rng: seeded(7) });
  assert.strictEqual(s.status, "ready");
  assert.strictEqual(s.snake.length, 3);
  assert.deepStrictEqual(cells(s)[0], { x: 5, y: 4 });
  assert.strictEqual(s.score, 0);
  assert.ok(s.food);
  // step does nothing until started
  SnakeEngine.step(s);
  assert.deepStrictEqual(cells(s)[0], { x: 5, y: 4 });
  SnakeEngine.start(s);
  assert.strictEqual(s.status, "running");
}

// Movement in each direction (length stays the same)
for (const [dir, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["right", 1, 0]]) {
  const s = running();
  s.food = { x: 0, y: 0 };
  const h = cells(s)[0];
  if (dir !== "right") assert.ok(SnakeEngine.queueDirection(s, dir));
  SnakeEngine.step(s);
  assert.deepStrictEqual(cells(s)[0], { x: h.x + dx, y: h.y + dy }, dir);
  assert.strictEqual(s.snake.length, 3);
}
{
  // left is only possible after turning (it is the reverse of the start direction)
  const s = running();
  s.food = { x: 0, y: 0 };
  s.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }];
  s.dir = SnakeEngine.DIRS.up;
  assert.ok(SnakeEngine.queueDirection(s, "left"));
  SnakeEngine.step(s);
  assert.deepStrictEqual(cells(s)[0], { x: 4, y: 5 });
}

// Eating grows by one and scores one point; new food is not on the snake
{
  const s = running();
  const h = s.snake[0];
  s.food = { x: h.x + 1, y: h.y };
  SnakeEngine.step(s);
  assert.strictEqual(s.snake.length, 4);
  assert.strictEqual(s.score, 1);
  assert.ok(!s.snake.some((p) => p.x === s.food.x && p.y === s.food.y));
  assert.strictEqual(s.status, "running");
}

// Wall collisions on all four edges
{
  const edges = [
    ["up", { x: 3, y: 0 }],
    ["down", { x: 3, y: 4 }],
    ["left", { x: 0, y: 2 }],
    ["right", { x: 4, y: 2 }],
  ];
  for (const [dir, head] of edges) {
    const s = running({ cols: 5, rows: 5 });
    const d = SnakeEngine.DIRS[dir];
    s.snake = [head, { x: head.x - d.x, y: head.y - d.y }];
    s.dir = d;
    s.food = { x: 2, y: 2 };
    if (head.x === 2 && head.y === 2) s.food = { x: 1, y: 1 };
    SnakeEngine.step(s);
    assert.strictEqual(s.status, "over", "wall " + dir);
  }
}

// Self collision
{
  const s = running({ cols: 10, rows: 10 });
  // Head at (3,3) heading right with the body curled so (4,3) is a body cell.
  s.snake = [
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 5, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 2 },
  ];
  s.dir = SnakeEngine.DIRS.right;
  s.food = { x: 9, y: 9 };
  SnakeEngine.step(s);
  assert.strictEqual(s.status, "over");
}

// Moving into the tail cell on a non-eating move is allowed
{
  const s = running({ cols: 5, rows: 5 });
  s.snake = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 1 }];
  s.dir = SnakeEngine.DIRS.right;
  s.food = { x: 4, y: 4 };
  SnakeEngine.step(s);
  assert.strictEqual(s.status, "running");
  assert.deepStrictEqual(cells(s), [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }]);
}

// Reversing is rejected
{
  const s = running();
  assert.strictEqual(SnakeEngine.queueDirection(s, "left"), false);
  assert.strictEqual(SnakeEngine.queueDirection(s, "right"), false); // same direction
  assert.strictEqual(s.dirQueue.length, 0);
  SnakeEngine.step(s);
  assert.strictEqual(s.status, "running");
}

// Two quick turns between ticks (up then left while moving right) do not kill the snake
{
  const s = running();
  s.food = { x: 0, y: 0 };
  assert.ok(SnakeEngine.queueDirection(s, "up"));
  assert.ok(SnakeEngine.queueDirection(s, "left"));
  const h = cells(s)[0];
  SnakeEngine.step(s);
  assert.deepStrictEqual(cells(s)[0], { x: h.x, y: h.y - 1 });
  SnakeEngine.step(s);
  assert.deepStrictEqual(cells(s)[0], { x: h.x - 1, y: h.y - 1 });
  assert.strictEqual(s.status, "running");
  // "up, down" in one tick: down is the reverse of the last queued direction
  const t = running();
  assert.ok(SnakeEngine.queueDirection(t, "up"));
  assert.strictEqual(SnakeEngine.queueDirection(t, "down"), false);
}

// Queue is capped at 3
{
  const s = running();
  assert.ok(SnakeEngine.queueDirection(s, "up"));
  assert.ok(SnakeEngine.queueDirection(s, "left"));
  assert.ok(SnakeEngine.queueDirection(s, "down"));
  assert.strictEqual(SnakeEngine.queueDirection(s, "right"), false);
  assert.strictEqual(s.dirQueue.length, 3);
}

// Food never lands on the snake
{
  const rng = seeded(42);
  const s = running({ cols: 6, rows: 6, rng });
  for (let i = 0; i < 500; i++) {
    s.snake = [];
    const n = 1 + Math.floor(rng() * 30);
    for (let k = 0; k < n; k++) s.snake.push({ x: k % 6, y: Math.floor(k / 6) });
    const f = SnakeEngine.spawnFood(s);
    assert.ok(f, "free cell exists");
    assert.ok(!s.snake.some((p) => p.x === f.x && p.y === f.y));
    assert.ok(f.x >= 0 && f.x < 6 && f.y >= 0 && f.y < 6);
  }
}

// Filling the board is a win
{
  const s = running({ cols: 3, rows: 2 });
  // 5 of 6 cells filled; head about to eat the last free cell.
  s.snake = [{ x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
  s.dir = SnakeEngine.DIRS.down;
  s.food = { x: 2, y: 1 };
  SnakeEngine.step(s);
  assert.strictEqual(s.status, "won");
  assert.strictEqual(s.snake.length, 6);
  assert.strictEqual(s.score, 1);
  assert.strictEqual(s.food, null);
}

// After game over, step and queueDirection are no-ops
{
  const s = running({ cols: 5, rows: 5 });
  s.snake = [{ x: 4, y: 2 }, { x: 3, y: 2 }];
  s.dir = SnakeEngine.DIRS.right;
  s.food = { x: 0, y: 0 };
  SnakeEngine.step(s);
  assert.strictEqual(s.status, "over");
  const before = JSON.stringify(s.snake);
  SnakeEngine.step(s);
  assert.strictEqual(JSON.stringify(s.snake), before);
  assert.strictEqual(SnakeEngine.queueDirection(s, "up"), false);
  assert.strictEqual(s.status, "over");
}

console.log("All snake engine tests passed.");
