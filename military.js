/**
 * Outpost Defense — a small top-down military survival game.
 * WASD to move, mouse to aim, click or Space to fire.
 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const touchControls = document.getElementById("touch-controls");

const hud = {
  score: document.getElementById("hud-score"),
  wave: document.getElementById("hud-wave"),
  kills: document.getElementById("hud-kills"),
  best: document.getElementById("hud-best"),
  health: document.getElementById("hud-health"),
};

const STATE = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  OVER: "over",
};

const ENEMY_TYPES = {
  infantry: { hp: 1, speed: 52, radius: 14, score: 10, color: "#8b3a2a" },
  runner: { hp: 1, speed: 86, radius: 12, score: 15, color: "#c45c2a" },
  heavy: { hp: 3, speed: 36, radius: 18, score: 30, color: "#4a2a22" },
};

const world = { w: 960, h: 640 };
const keys = Object.create(null);
const mouse = { x: 480, y: 320, down: false };

const game = {
  state: STATE.MENU,
  score: 0,
  wave: 0,
  kills: 0,
  health: 100,
  maxHealth: 100,
  startTime: 0,
  saved: false,
  player: null,
  bullets: [],
  enemies: [],
  particles: [],
  pickups: [],
  waveTimer: 0,
  spawnQueue: [],
  spawnCooldown: 0,
  invuln: 0,
  rapidFire: 0,
  terrain: [],
};

let lastTime = 0;
let rafId = 0;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function resizeCanvas() {
  const stage = canvas.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(stage.clientWidth, 320);
  const height = Math.max(stage.clientHeight, 420);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.w = width;
  world.h = height;
  if (game.player) {
    game.player.x = clamp(game.player.x, 24, world.w - 24);
    game.player.y = clamp(game.player.y, 24, world.h - 24);
  }
  buildTerrain();
}

function buildTerrain() {
  game.terrain = [];
  const count = Math.floor((world.w * world.h) / 18000);
  for (let i = 0; i < count; i += 1) {
    game.terrain.push({
      x: rand(20, world.w - 20),
      y: rand(20, world.h - 20),
      r: rand(8, 22),
      shade: rand(0.04, 0.12),
    });
  }
}

function createPlayer() {
  return {
    x: world.w / 2,
    y: world.h / 2,
    angle: -Math.PI / 2,
    speed: 210,
    radius: 14,
    cooldown: 0,
  };
}

function showOverlay(kicker, title, text, buttonLabel) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonLabel;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function updateHud() {
  hud.score.textContent = String(game.score);
  hud.wave.textContent = String(Math.max(game.wave, 1));
  hud.kills.textContent = String(game.kills);
  hud.best.textContent = String(getBestScore());
  hud.health.style.width = `${clamp((game.health / game.maxHealth) * 100, 0, 100)}%`;
}

function getBestScore() {
  if (typeof GameStatsTracker !== "undefined") {
    return GameStatsTracker.getMilitaryStats().highScore;
  }
  return parseInt(localStorage.getItem("military-best") || "0", 10);
}

function resetGame() {
  game.score = 0;
  game.wave = 0;
  game.kills = 0;
  game.health = game.maxHealth;
  game.startTime = Date.now();
  game.saved = false;
  game.player = createPlayer();
  game.bullets = [];
  game.enemies = [];
  game.particles = [];
  game.pickups = [];
  game.waveTimer = 2.2;
  game.spawnQueue = [];
  game.spawnCooldown = 0;
  game.invuln = 2;
  game.rapidFire = 0;
  updateHud();
}

function startGame() {
  resetGame();
  game.state = STATE.PLAYING;
  hideOverlay();
}

function pauseGame() {
  if (game.state !== STATE.PLAYING) return;
  game.state = STATE.PAUSED;
  showOverlay("Hold Position", "Paused", "Press P or Deploy to resume the fight.", "Resume");
}

function resumeGame() {
  if (game.state !== STATE.PAUSED) return;
  game.state = STATE.PLAYING;
  hideOverlay();
}

function endGame() {
  if (game.state === STATE.OVER) return;
  game.state = STATE.OVER;
  saveStats();
  const best = getBestScore();
  const record = game.score >= best && game.score > 0;
  showOverlay(
    record ? "Citation Issued" : "Mission Failed",
    record ? "New Record" : "Outpost Lost",
    `Score ${game.score} · Wave ${game.wave} · ${game.kills} hostiles down. Best ${best}.`,
    "Redeploy"
  );
}

function saveStats() {
  if (game.saved) return;
  game.saved = true;
  const duration = Math.floor((Date.now() - game.startTime) / 60000) || 1;
  if (typeof GameStatsTracker !== "undefined") {
    GameStatsTracker.saveMilitaryGame({
      score: game.score,
      wave: game.wave,
      kills: game.kills,
      duration,
    });
  }
}

function queueWave() {
  game.wave += 1;
  const infantry = 2 + Math.floor(game.wave * 0.7);
  const runners = Math.max(0, Math.floor((game.wave - 2) / 2));
  const heavies = Math.max(0, Math.floor((game.wave - 3) / 3));
  game.spawnQueue = [];
  for (let i = 0; i < infantry; i += 1) game.spawnQueue.push("infantry");
  for (let i = 0; i < runners; i += 1) game.spawnQueue.push("runner");
  for (let i = 0; i < heavies; i += 1) game.spawnQueue.push("heavy");
  game.spawnCooldown = 0.2;
  updateHud();
}

function spawnPoint() {
  const edge = Math.floor(Math.random() * 4);
  const pad = 28;
  if (edge === 0) return { x: rand(pad, world.w - pad), y: -pad };
  if (edge === 1) return { x: rand(pad, world.w - pad), y: world.h + pad };
  if (edge === 2) return { x: -pad, y: rand(pad, world.h - pad) };
  return { x: world.w + pad, y: rand(pad, world.h - pad) };
}

function spawnEnemy(typeName) {
  const type = ENEMY_TYPES[typeName];
  const point = spawnPoint();
  game.enemies.push({
    type: typeName,
    x: point.x,
    y: point.y,
    hp: type.hp,
    radius: type.radius,
    speed: type.speed * (0.92 + Math.random() * 0.16),
    hitFlash: 0,
  });
}

function spawnBurst(x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const vel = rand(20, speed);
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel,
      life: rand(0.25, 0.55),
      maxLife: 0.55,
      size: rand(1.5, 3.5),
      color,
    });
  }
}

function maybeDropPickup(x, y) {
  if (game.wave < 2 || Math.random() > 0.18) return;
  game.pickups.push({
    x,
    y,
    kind: Math.random() > 0.45 ? "medkit" : "rapid",
    life: 9,
  });
}

function fireBullet() {
  if (game.state !== STATE.PLAYING) return;
  const player = game.player;
  if (!player || player.cooldown > 0) return;
  player.cooldown = game.rapidFire > 0 ? 0.07 : 0.12;
  const muzzle = 20;
  const x = player.x + Math.cos(player.angle) * muzzle;
  const y = player.y + Math.sin(player.angle) * muzzle;
  game.bullets.push({
    x,
    y,
    vx: Math.cos(player.angle) * 640,
    vy: Math.sin(player.angle) * 640,
    life: 0.9,
  });
  spawnBurst(x, y, "#f4d27a", 6, 90);
}

function damagePlayer(amount) {
  if (game.invuln > 0) return;
  game.health -= amount;
  game.invuln = 0.8;
  spawnBurst(game.player.x, game.player.y, "#d9783a", 10, 140);
  updateHud();
  if (game.health <= 0) {
    game.health = 0;
    endGame();
  }
}

function updatePlayer(dt) {
  const player = game.player;
  let ax = 0;
  let ay = 0;
  if (keys.KeyW || keys.ArrowUp) ay -= 1;
  if (keys.KeyS || keys.ArrowDown) ay += 1;
  if (keys.KeyA || keys.ArrowLeft) ax -= 1;
  if (keys.KeyD || keys.ArrowRight) ax += 1;
  if (ax !== 0 || ay !== 0) {
    const length = Math.hypot(ax, ay);
    player.x += (ax / length) * player.speed * dt;
    player.y += (ay / length) * player.speed * dt;
  }
  player.x = clamp(player.x, player.radius, world.w - player.radius);
  player.y = clamp(player.y, player.radius, world.h - player.radius);
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.cooldown = Math.max(0, player.cooldown - dt);
  if (mouse.down || keys.Space) fireBullet();
}

function updateWaves(dt) {
  if (game.spawnQueue.length > 0) {
    game.spawnCooldown -= dt;
    if (game.spawnCooldown <= 0) {
      spawnEnemy(game.spawnQueue.shift());
      game.spawnCooldown = Math.max(0.28, 0.75 - game.wave * 0.04);
    }
    return;
  }
  if (game.enemies.length === 0) {
    game.waveTimer -= dt;
    if (game.waveTimer <= 0) {
      queueWave();
      game.waveTimer = 1.6;
    }
  }
}

function updateEnemies(dt) {
  const player = game.player;
  for (const enemy of game.enemies) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    if (dist(enemy, player) < enemy.radius + player.radius - 2) {
      damagePlayer(enemy.type === "heavy" ? 12 : 8);
    }
  }
}

function updateBullets(dt) {
  for (const bullet of game.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  for (const bullet of game.bullets) {
    if (bullet.life <= 0) continue;
    for (const enemy of game.enemies) {
      if (enemy.hp <= 0) continue;
      if (dist(bullet, enemy) < enemy.radius + 10) {
        bullet.life = 0;
        enemy.hp -= 1;
        enemy.hitFlash = 0.08;
        spawnBurst(bullet.x, bullet.y, "#f0e2b0", 6, 110);
        if (enemy.hp <= 0) {
          const type = ENEMY_TYPES[enemy.type];
          game.score += type.score + game.wave * 2;
          game.kills += 1;
          spawnBurst(enemy.x, enemy.y, type.color, 14, 160);
          maybeDropPickup(enemy.x, enemy.y);
          updateHud();
        }
        break;
      }
    }
  }

  game.bullets = game.bullets.filter((bullet) => bullet.life > 0);
  game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
}

function updatePickups(dt) {
  for (const pickup of game.pickups) {
    pickup.life -= dt;
    if (dist(pickup, game.player) < 22) {
      if (pickup.kind === "medkit") {
        game.health = clamp(game.health + 28, 0, game.maxHealth);
      } else {
        game.rapidFire = 5;
      }
      pickup.life = 0;
      spawnBurst(pickup.x, pickup.y, "#8fa34c", 10, 90);
      updateHud();
    }
  }
  game.pickups = game.pickups.filter((pickup) => pickup.life > 0);
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function update(dt) {
  if (game.state !== STATE.PLAYING) return;
  game.invuln = Math.max(0, game.invuln - dt);
  game.rapidFire = Math.max(0, game.rapidFire - dt);
  updatePlayer(dt);
  updateWaves(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateParticles(dt);
}

function drawGround() {
  ctx.fillStyle = "#1a2216";
  ctx.fillRect(0, 0, world.w, world.h);

  ctx.strokeStyle = "rgba(107, 124, 58, 0.12)";
  ctx.lineWidth = 1;
  const step = 48;
  ctx.beginPath();
  for (let x = 0; x <= world.w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.h);
  }
  for (let y = 0; y <= world.h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(world.w, y);
  }
  ctx.stroke();

  for (const patch of game.terrain) {
    ctx.fillStyle = `rgba(40, 52, 28, ${patch.shade})`;
    ctx.beginPath();
    ctx.arc(patch.x, patch.y, patch.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = world.w / 2;
  const cy = world.h / 2;
  ctx.fillStyle = "#2b2414";
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c4b07a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#6b7c3a";
  ctx.fillRect(cx - 2, cy - 28, 4, 36);
  ctx.fillStyle = "#a13d2a";
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 28);
  ctx.lineTo(cx + 18, cy - 20);
  ctx.lineTo(cx + 2, cy - 12);
  ctx.fill();
}

function drawSoldier(x, y, angle, color, radius, flash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = flash ? "#f4e2c0" : color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b1f16";
  ctx.fillRect(radius - 2, -3, 14, 6);
  ctx.fillStyle = "#2c2416";
  ctx.beginPath();
  ctx.arc(-2, -1, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawGround();

  for (const pickup of game.pickups) {
    ctx.fillStyle = pickup.kind === "medkit" ? "#8fa34c" : "#d4a017";
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#11150e";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pickup.kind === "medkit" ? "+" : "R", pickup.x, pickup.y + 3);
  }

  for (const bullet of game.bullets) {
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x - bullet.vx * 0.04, bullet.y - bullet.vy * 0.04);
    ctx.stroke();
    ctx.fillStyle = "#fff4c2";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of game.enemies) {
    const type = ENEMY_TYPES[enemy.type];
    drawSoldier(enemy.x, enemy.y, Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x), type.color, enemy.radius, enemy.hitFlash > 0);
  }

  if (game.player) {
    const blink = game.invuln > 0 && Math.floor(game.invuln * 14) % 2 === 0;
    if (!blink) {
      drawSoldier(game.player.x, game.player.y, game.player.angle, "#6b7c3a", game.player.radius, false);
    }
  }

  for (const particle of game.particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  }

  if (game.state === STATE.PLAYING && game.enemies.length === 0 && game.spawnQueue.length === 0) {
    ctx.fillStyle = "rgba(196, 176, 122, 0.85)";
    ctx.font = "700 28px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`WAVE ${game.wave + 1} INBOUND`, world.w / 2, 48);
  }
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;
  update(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * world.w,
    y: ((event.clientY - rect.top) / rect.height) * world.h,
  };
}

function setTouchControls() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  touchControls.hidden = !coarse;
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    if (event.code === "Space") event.preventDefault();
    if (event.code === "KeyP") {
      if (game.state === STATE.PLAYING) pauseGame();
      else if (game.state === STATE.PAUSED) resumeGame();
    }
    if (event.code === "Enter" && game.state !== STATE.PLAYING) {
      if (game.state === STATE.PAUSED) resumeGame();
      else startGame();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  canvas.addEventListener("mousemove", (event) => {
    const point = canvasPoint(event);
    mouse.x = point.x;
    mouse.y = point.y;
  });

  canvas.addEventListener("mousedown", (event) => {
    const point = canvasPoint(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.down = true;
    if (game.state === STATE.PLAYING) fireBullet();
  });

  window.addEventListener("mouseup", () => {
    mouse.down = false;
  });

  startBtn.addEventListener("click", () => {
    if (game.state === STATE.PAUSED) resumeGame();
    else startGame();
  });

  document.querySelectorAll("[data-dir]").forEach((button) => {
    const map = {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
    };
    const code = map[button.dataset.dir];
    const press = (event) => {
      event.preventDefault();
      keys[code] = true;
    };
    const release = (event) => {
      event.preventDefault();
      keys[code] = false;
    };
    button.addEventListener("touchstart", press, { passive: false });
    button.addEventListener("touchend", release, { passive: false });
    button.addEventListener("mousedown", press);
    button.addEventListener("mouseup", release);
    button.addEventListener("mouseleave", release);
  });

  const fireBtn = document.getElementById("fire-btn");
  const fireOn = (event) => {
    event.preventDefault();
    keys.Space = true;
  };
  const fireOff = (event) => {
    event.preventDefault();
    keys.Space = false;
  };
  fireBtn.addEventListener("touchstart", fireOn, { passive: false });
  fireBtn.addEventListener("touchend", fireOff, { passive: false });
  fireBtn.addEventListener("mousedown", fireOn);
  fireBtn.addEventListener("mouseup", fireOff);
}

document.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  setTouchControls();
  game.player = createPlayer();
  updateHud();
  bindEvents();
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);

  if (typeof GameStatsTracker !== "undefined") {
    GameStatsTracker.addDashboardLink();
  }
});

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(rafId);
});
