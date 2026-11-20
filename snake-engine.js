/**
 * Snake engine (pure logic, no DOM).
 * Coordinates are { x, y } with (0, 0) at the top-left.
 * status: ready | running | over | won
 */
(function (root) {
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const MAX_QUEUE = 3;

  function same(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function isOpposite(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
  }

  function freeCells(state) {
    const taken = new Set(state.snake.map((p) => p.x + "," + p.y));
    const free = [];
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (!taken.has(x + "," + y)) free.push({ x, y });
      }
    }
    return free;
  }

  /** Place food on a uniformly chosen free cell. Returns the food or null when the board is full. */
  function spawnFood(state) {
    const free = freeCells(state);
    if (free.length === 0) {
      state.food = null;
      return null;
    }
    const i = Math.min(free.length - 1, Math.floor(state.rng() * free.length));
    state.food = free[i];
    return state.food;
  }

  /** New game in the "ready" state: a 3-cell snake in the middle, heading right. */
  function createState(options) {
    const opts = options || {};
    const cols = opts.cols || 20;
    const rows = opts.rows || 20;
    const hx = Math.floor(cols / 2);
    const hy = Math.floor(rows / 2);
    const state = {
      cols,
      rows,
      rng: opts.rng || Math.random,
      snake: [
        { x: hx, y: hy },
        { x: hx - 1, y: hy },
        { x: hx - 2, y: hy },
      ],
      dir: DIRS.right,
      dirQueue: [],
      food: null,
      score: 0,
      status: "ready",
    };
    spawnFood(state);
    return state;
  }

  function start(state) {
    if (state.status === "ready") state.status = "running";
    return state;
  }

  /**
   * Queue a direction ("up" | "down" | "left" | "right" or a {x, y} vector).
   * It is compared with the last queued direction (or the current one when the
   * queue is empty), so fast key presses can never reverse the snake into itself.
   * Returns true when accepted.
   */
  function queueDirection(state, dir) {
    if (state.status === "over" || state.status === "won") return false;
    const d = typeof dir === "string" ? DIRS[dir] : dir;
    if (!d) return false;
    if (state.dirQueue.length >= MAX_QUEUE) return false;
    const last = state.dirQueue.length ? state.dirQueue[state.dirQueue.length - 1] : state.dir;
    if (same(d, last) || isOpposite(d, last)) return false;
    state.dirQueue.push(d);
    return true;
  }

  /** Advance one tick. Mutates and returns the state; a no-op unless status is "running". */
  function step(state) {
    if (state.status !== "running") return state;

    if (state.dirQueue.length) state.dir = state.dirQueue.shift();

    const head = state.snake[0];
    const next = { x: head.x + state.dir.x, y: head.y + state.dir.y };

    if (next.x < 0 || next.x >= state.cols || next.y < 0 || next.y >= state.rows) {
      state.status = "over";
      return state;
    }

    const eats = state.food !== null && same(next, state.food);
    // When not eating, the tail cell is vacated this tick, so moving into it is legal.
    const body = eats ? state.snake : state.snake.slice(0, -1);
    if (body.some((p) => same(p, next))) {
      state.status = "over";
      return state;
    }

    state.snake.unshift(next);
    if (eats) {
      state.score += 1;
      if (spawnFood(state) === null) state.status = "won";
    } else {
      state.snake.pop();
    }
    return state;
  }

  root.SnakeEngine = {
    DIRS,
    MAX_QUEUE,
    createState,
    start,
    queueDirection,
    step,
    spawnFood,
  };
})(typeof window !== "undefined" ? window : globalThis);
