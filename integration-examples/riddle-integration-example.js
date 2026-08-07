/**
 * RIDDLE PUZZLES - Dashboard Integration Example
 * 
 * This example shows how to integrate the stats tracker into RIDDLE puzzles.
 * Add this code to your existing RIDDLE game script.
 */

// =============================================================================
// SLIDE PUZZLE INTEGRATION
// =============================================================================

let slidePuzzleStartTime;
let slideMoveCount = 0;
let slideBoardSize = 4; // 3 or 4

// 1. Track slide puzzle start
function startSlidePuzzle(boardSize) {
  slidePuzzleStartTime = Date.now();
  slideMoveCount = 0;
  slideBoardSize = boardSize;
  
  // ... rest of puzzle initialization
}

// 2. Track each move
function makeSlideMove(tile) {
  // ... your move logic
  
  slideMoveCount++;
  updateMoveDisplay(slideMoveCount);
}

// 3. Save stats when puzzle is solved
function onSlidePuzzleSolved() {
  const timeElapsed = Math.floor((Date.now() - slidePuzzleStartTime) / 1000);
  
  GameStatsTracker.saveSlidePuzzle({
    size: slideBoardSize, // 3 or 4
    moves: slideMoveCount,
    time: timeElapsed
  });
  
  // Show completion message
  showWinModal('Slide', `${slideMoveCount} moves in ${formatTime(timeElapsed)}`);
}

// 4. Handle shuffle button (reset stats but don't save)
document.getElementById('slide-shuffle')?.addEventListener('click', () => {
  slidePuzzleStartTime = Date.now();
  slideMoveCount = 0;
  // ... shuffle logic
});

// 5. Handle board size change
document.querySelectorAll('[data-slide-size]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    slideBoardSize = parseInt(e.target.dataset.slideSize);
    startSlidePuzzle(slideBoardSize);
  });
});

// =============================================================================
// MATCH PUZZLE INTEGRATION
// =============================================================================

let matchPuzzleStartTime;
let matchTries = 0;
let matchPairsFound = 0;

// 1. Track match puzzle start
function startMatchPuzzle() {
  matchPuzzleStartTime = Date.now();
  matchTries = 0;
  matchPairsFound = 0;
  
  // ... rest of puzzle initialization
}

// 2. Track each pair attempt
function onPairAttempt(card1, card2) {
  matchTries++;
  
  if (card1.matches(card2)) {
    matchPairsFound++;
    
    // Check if puzzle is complete
    if (matchPairsFound === 8) {
      onMatchPuzzleSolved();
    }
  }
}

// 3. Save stats when puzzle is solved
function onMatchPuzzleSolved() {
  const timeElapsed = Math.floor((Date.now() - matchPuzzleStartTime) / 1000);
  
  GameStatsTracker.saveMatchPuzzle({
    tries: matchTries,
    pairs: matchPairsFound,
    time: timeElapsed
  });
  
  // Show completion message
  const isPerfect = matchTries === 8;
  showWinModal('Match', isPerfect ? 'Perfect match!' : `${matchTries} tries`);
}

// 4. Handle restart button
document.getElementById('match-restart')?.addEventListener('click', () => {
  startMatchPuzzle();
});

// =============================================================================
// ECHO GAME INTEGRATION
// =============================================================================

let echoGameStartTime;
let echoCurrentLevel = 1;

// 1. Track echo game start
function startEchoGame() {
  echoGameStartTime = Date.now();
  echoCurrentLevel = 1;
  
  // ... rest of game initialization
}

// 2. Track level progression
function advanceEchoLevel() {
  echoCurrentLevel++;
  updateLevelDisplay(echoCurrentLevel);
  
  // ... show next pattern
}

// 3. Save stats when game ends (player fails)
function onEchoGameOver() {
  const durationMs = Date.now() - echoGameStartTime;
  const durationMinutes = Math.floor(durationMs / 60000) || 1;
  
  GameStatsTracker.saveEchoGame({
    level: echoCurrentLevel,
    duration: durationMinutes
  });
  
  // Show game over message
  showWinModal('Echo', `Reached level ${echoCurrentLevel}`);
}

// 4. Handle player mistake
function onPlayerMistake() {
  // Player failed to match pattern
  onEchoGameOver();
}

// 5. Handle start button
document.getElementById('echo-start')?.addEventListener('click', () => {
  startEchoGame();
});

// =============================================================================
// SHARED FUNCTIONALITY
// =============================================================================

// Format time for display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Show win modal with details
function showWinModal(puzzleType, detail) {
  const modal = document.getElementById('win');
  document.getElementById('win-title').textContent = `${puzzleType} Complete!`;
  document.getElementById('win-detail').textContent = detail;
  modal.hidden = false;
}

// Handle "Play Again" button
document.getElementById('win-again')?.addEventListener('click', () => {
  document.getElementById('win').hidden = true;
  
  // Restart current puzzle
  switch (currentPuzzle) {
    case 'slide':
      startSlidePuzzle(slideBoardSize);
      break;
    case 'match':
      startMatchPuzzle();
      break;
    case 'echo':
      startEchoGame();
      break;
  }
});

// Handle "All Puzzles" button (go to hub)
document.getElementById('win-hub')?.addEventListener('click', () => {
  document.getElementById('win').hidden = true;
  showHub();
});

// Add dashboard link on page load
document.addEventListener('DOMContentLoaded', () => {
  GameStatsTracker.addDashboardLink();
  
  // Optional: Display current stats
  const stats = GameStatsTracker.getRiddleStats();
  console.log('RIDDLE Statistics:', stats);
});

// =============================================================================
// NAVIGATION INTEGRATION
// =============================================================================

// Track which puzzle is active
let currentPuzzle = null;

// When switching puzzles
document.querySelectorAll('[data-play]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const puzzle = e.target.dataset.play;
    currentPuzzle = puzzle;
    
    // Initialize the selected puzzle
    switch (puzzle) {
      case 'slide':
        startSlidePuzzle(4);
        break;
      case 'match':
        startMatchPuzzle();
        break;
      case 'echo':
        startEchoGame();
        break;
    }
  });
});

/**
 * INTEGRATION CHECKLIST:
 * 
 * SLIDE PUZZLE:
 * [ ] 1. Track start time when puzzle begins
 * [ ] 2. Increment move count on each tile move
 * [ ] 3. Track board size (3x3 or 4x4)
 * [ ] 4. Call saveSlidePuzzle() when solved
 * 
 * MATCH PUZZLE:
 * [ ] 1. Track start time when puzzle begins
 * [ ] 2. Increment tries on each pair flip
 * [ ] 3. Track pairs found
 * [ ] 4. Call saveMatchPuzzle() when all pairs found
 * 
 * ECHO GAME:
 * [ ] 1. Track start time when game begins
 * [ ] 2. Track current level
 * [ ] 3. Increment level on success
 * [ ] 4. Call saveEchoGame() when player fails
 * 
 * GENERAL:
 * [ ] 5. Add <script src="game-stats-tracker.js"></script> to HTML
 * [ ] 6. Call GameStatsTracker.addDashboardLink() on page load
 * [ ] 7. Test each puzzle type and check dashboard
 */
