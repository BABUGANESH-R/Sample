/**
 * MILITARY GAME - Dashboard Integration Example
 *
 * Shows how Outpost Defense saves missions to the dashboard.
 */

let gameStartTime;
let currentScore = 0;
let currentWave = 0;
let currentKills = 0;
let gameActive = false;

function startGame() {
  gameStartTime = Date.now();
  currentScore = 0;
  currentWave = 1;
  currentKills = 0;
  gameActive = true;
}

function onEnemyDefeated(points) {
  currentScore += points;
  currentKills += 1;
}

function gameOver() {
  gameActive = false;

  const durationMinutes = Math.floor((Date.now() - gameStartTime) / 60000) || 1;

  GameStatsTracker.saveMilitaryGame({
    score: currentScore,
    wave: currentWave,
    kills: currentKills,
    duration: durationMinutes
  });
}

document.addEventListener('DOMContentLoaded', () => {
  GameStatsTracker.addDashboardLink();

  const stats = GameStatsTracker.getMilitaryStats();
  console.log('Military Statistics:', stats);
});
