/**
 * SNAKE GAME - Dashboard Integration Example
 * 
 * This example shows how to integrate the stats tracker into a Snake game.
 * Add this code to your existing Snake game script.
 */

// =============================================================================
// GAME STATE TRACKING
// =============================================================================

let gameStartTime;
let currentScore = 0;
let gameActive = false;

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

// 1. Initialize game state when starting
function startGame() {
  gameStartTime = Date.now();
  currentScore = 0;
  gameActive = true;
  
  // Reset snake and food
  initSnake();
  spawnFood();
  
  // Hide overlay
  document.getElementById('overlay').hidden = true;
  
  // Start game loop
  gameLoop();
}

// =============================================================================
// SCORE TRACKING
// =============================================================================

// 2. Update score when snake eats food
function onFoodEaten() {
  currentScore++;
  
  // Update score display
  document.getElementById('score').textContent = currentScore;
  
  // Check and update best score display
  const bestScore = parseInt(localStorage.getItem('snake-best') || '0');
  if (currentScore > bestScore) {
    document.getElementById('best').textContent = currentScore;
  }
  
  // Spawn new food
  spawnFood();
  
  // Grow snake
  growSnake();
}

// =============================================================================
// GAME OVER HANDLING
// =============================================================================

// 3. Handle game over and save stats
function gameOver() {
  gameActive = false;
  
  // Calculate game duration
  const durationMs = Date.now() - gameStartTime;
  const durationMinutes = Math.floor(durationMs / 60000) || 1;
  
  // Save game to dashboard
  GameStatsTracker.saveSnakeGame({
    score: currentScore,
    duration: durationMinutes
  });
  
  // Update best score in local storage (tracker handles this too)
  const bestScore = parseInt(localStorage.getItem('snake-best') || '0');
  if (currentScore > bestScore) {
    localStorage.setItem('snake-best', currentScore);
    document.getElementById('best').textContent = currentScore;
  }
  
  // Show game over overlay
  showGameOverOverlay();
}

// 4. Show game over overlay with score
function showGameOverOverlay() {
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const startBtn = document.getElementById('start-btn');
  
  const bestScore = parseInt(localStorage.getItem('snake-best') || '0');
  const isNewRecord = currentScore === bestScore && currentScore > 0;
  
  overlayTitle.textContent = isNewRecord ? '🏆 New Record!' : 'Game Over';
  overlayText.textContent = `Score: ${currentScore}${isNewRecord ? '' : ` · Best: ${bestScore}`}`;
  startBtn.textContent = 'Play Again';
  
  overlay.hidden = false;
}

// =============================================================================
// COLLISION DETECTION
// =============================================================================

// 5. Check for collisions (walls or self)
function checkCollisions() {
  const head = snake[0];
  
  // Wall collision
  if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
    gameOver();
    return true;
  }
  
  // Self collision
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// GAME LOOP
// =============================================================================

// 6. Main game loop
function gameLoop() {
  if (!gameActive) return;
  
  // Move snake
  moveSnake();
  
  // Check collisions
  if (checkCollisions()) {
    return; // Game over
  }
  
  // Check if food eaten
  const head = snake[0];
  if (head.x === food.x && head.y === food.y) {
    onFoodEaten();
  }
  
  // Render
  render();
  
  // Continue loop
  setTimeout(gameLoop, gameSpeed);
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

// 7. Start/Restart button handler
document.getElementById('start-btn').addEventListener('click', () => {
  startGame();
});

// 8. Control buttons
document.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const direction = e.target.dataset.dir;
    changeDirection(direction);
  });
});

// 9. Keyboard controls
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      changeDirection('up');
      e.preventDefault();
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      changeDirection('down');
      e.preventDefault();
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      changeDirection('left');
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      changeDirection('right');
      e.preventDefault();
      break;
    case ' ':
      togglePause();
      e.preventDefault();
      break;
  }
});

// =============================================================================
// PAUSE FUNCTIONALITY (Optional)
// =============================================================================

let isPaused = false;

function togglePause() {
  if (!gameActive) return;
  
  isPaused = !isPaused;
  
  if (isPaused) {
    // Show pause overlay
    const overlay = document.getElementById('overlay');
    document.getElementById('overlay-title').textContent = 'Paused';
    document.getElementById('overlay-text').textContent = 'Press Space to continue';
    overlay.hidden = false;
  } else {
    // Hide overlay and resume
    document.getElementById('overlay').hidden = true;
    gameLoop();
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// 10. Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add dashboard link
  GameStatsTracker.addDashboardLink();
  
  // Load and display best score
  const bestScore = localStorage.getItem('snake-best') || '0';
  document.getElementById('best').textContent = bestScore;
  
  // Optional: Display current stats in console
  const stats = GameStatsTracker.getSnakeStats();
  console.log('Snake Statistics:', stats);
  console.log(`High Score: ${stats.highScore}`);
  console.log(`Games Played: ${stats.gamesPlayed}`);
  console.log(`Average Score: ${stats.avgScore}`);
});

// =============================================================================
// ADDITIONAL FEATURES (Optional)
// =============================================================================

// Show stats in game UI
function displayStatsInGame() {
  const stats = GameStatsTracker.getSnakeStats();
  
  // You could add this info to your game UI
  const statsPanel = document.createElement('div');
  statsPanel.className = 'stats-panel';
  statsPanel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
    ">
      <div>Games: ${stats.gamesPlayed}</div>
      <div>Avg: ${stats.avgScore}</div>
      <div>Best: ${stats.highScore}</div>
    </div>
  `;
  document.body.appendChild(statsPanel);
}

// Track longest snake length
let maxSnakeLength = 0;

function updateMaxLength() {
  if (snake.length > maxSnakeLength) {
    maxSnakeLength = snake.length;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function initSnake() {
  // Initialize snake in center
  snake = [
    { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) }
  ];
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
}

function spawnFood() {
  // Spawn food at random position (not on snake)
  do {
    food = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function moveSnake() {
  // Update direction
  direction = { ...nextDirection };
  
  // Calculate new head position
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };
  
  // Add new head
  snake.unshift(newHead);
  
  // Remove tail (unless growing)
  if (!growing) {
    snake.pop();
  }
  growing = false;
}

function growSnake() {
  growing = true;
}

function changeDirection(dir) {
  // Prevent reversing into self
  switch (dir) {
    case 'up':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case 'down':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case 'left':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case 'right':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
  }
}

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw snake
  snake.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';
    ctx.fillRect(
      segment.x * cellSize,
      segment.y * cellSize,
      cellSize - 1,
      cellSize - 1
    );
  });
  
  // Draw food
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(
    food.x * cellSize,
    food.y * cellSize,
    cellSize - 1,
    cellSize - 1
  );
}

/**
 * INTEGRATION CHECKLIST:
 * 
 * [ ] 1. Add <script src="game-stats-tracker.js"></script> to HTML
 * [ ] 2. Track gameStartTime when game starts
 * [ ] 3. Track currentScore (increment on food eaten)
 * [ ] 4. Call GameStatsTracker.saveSnakeGame() in gameOver()
 * [ ] 5. Call GameStatsTracker.addDashboardLink() on page load
 * [ ] 6. Load and display best score from localStorage
 * [ ] 7. Test by playing complete game and checking dashboard
 * [ ] 8. Verify high score updates correctly
 * 
 * OPTIONAL ENHANCEMENTS:
 * [ ] Display stats in-game UI
 * [ ] Track additional metrics (longest snake, time played, etc.)
 * [ ] Add achievement notifications
 */
