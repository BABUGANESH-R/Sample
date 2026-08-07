/**
 * CHESS GAME - Dashboard Integration Example
 * 
 * This example shows how to integrate the stats tracker into a chess game.
 * Add this code to your existing chess game script.
 */

// 1. Track game start time and move count
let gameStartTime;
let moveCount = 0;
let capturedByWhite = [];
let capturedByBlack = [];

// 2. Initialize tracking when a new game starts
function initNewGame() {
  gameStartTime = Date.now();
  moveCount = 0;
  capturedByWhite = [];
  capturedByBlack = [];
  
  // ... rest of your game initialization
}

// 3. Track each move
function makeMove(from, to) {
  // ... your move logic
  
  moveCount++;
  
  // Track captures
  if (capturedPiece) {
    if (currentPlayer === 'white') {
      capturedByWhite.push(capturedPiece.type);
    } else {
      capturedByBlack.push(capturedPiece.type);
    }
  }
}

// 4. Save stats when game ends
function endGame(winner) {
  const durationMs = Date.now() - gameStartTime;
  const durationMinutes = Math.floor(durationMs / 60000) || 1;
  
  // Save to dashboard
  GameStatsTracker.saveChessGame({
    winner: winner, // 'white', 'black', or 'draw'
    moves: moveCount,
    duration: durationMinutes,
    capturedByWhite: capturedByWhite,
    capturedByBlack: capturedByBlack
  });
  
  // Show game over message
  showEndGameMessage(winner);
}

// 5. Handle different game end scenarios

// Checkmate
function handleCheckmate(winningColor) {
  endGame(winningColor); // 'white' or 'black'
}

// Stalemate
function handleStalemate() {
  endGame('draw');
}

// Resignation
function handleResignation(resigningColor) {
  const winner = resigningColor === 'white' ? 'black' : 'white';
  endGame(winner);
}

// Draw by agreement
function handleDrawAgreement() {
  endGame('draw');
}

// 6. Add dashboard link when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Add floating dashboard button
  GameStatsTracker.addDashboardLink();
  
  // Optional: Display current stats in your UI
  const stats = GameStatsTracker.getChessStats();
  console.log('Chess Statistics:', stats);
  // You could display stats.totalGames, stats.whiteWins, etc. in your UI
});

// 7. Optional: Add "New Game" button handler
document.getElementById('new-game').addEventListener('click', () => {
  initNewGame();
});

// 8. Optional: Add "Undo" button that decrements move count
function handleUndo() {
  if (moveCount > 0) {
    moveCount--;
    
    // If the undone move captured a piece, remove it from the list
    if (lastMoveCaptured) {
      if (lastMovePlayer === 'white') {
        capturedByWhite.pop();
      } else {
        capturedByBlack.pop();
      }
    }
  }
  
  // ... rest of undo logic
}

/**
 * INTEGRATION CHECKLIST:
 * 
 * [ ] 1. Add <script src="game-stats-tracker.js"></script> to HTML
 * [ ] 2. Initialize gameStartTime when new game starts
 * [ ] 3. Track moveCount on each move
 * [ ] 4. Track captured pieces (optional)
 * [ ] 5. Call GameStatsTracker.saveChessGame() when game ends
 * [ ] 6. Call GameStatsTracker.addDashboardLink() on page load
 * [ ] 7. Test by playing a complete game and checking dashboard
 */
