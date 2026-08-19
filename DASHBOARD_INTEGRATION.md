# Game Dashboard Integration Guide

This guide explains how to integrate the dashboard system into each game.

## Overview

The dashboard system tracks statistics for four games:
- **Chess**: Game outcomes, move counts, captures
- **RIDDLE**: Puzzle completion times, scores for Slide/Match/Echo
- **Snake**: High scores, game history, averages
- **Military**: Outpost Defense scores, waves, and kills

## Files

- `dashboard.html` - Main dashboard interface
- `dashboard-style.css` - Dashboard styling
- `dashboard.js` - Dashboard logic and data display
- `game-stats-tracker.js` - Integration module for games

## Integration Steps

### 1. Include the Stats Tracker

Add this to your game's HTML file (before your game's script):

```html
<script src="game-stats-tracker.js"></script>
```

### 2. Add Dashboard Link (Optional)

To show a "View Dashboard" button in your game:

```javascript
// Call this after your game loads
GameStatsTracker.addDashboardLink();
```

### 3. Track Game Events

#### Chess Integration

When a chess game ends:

```javascript
GameStatsTracker.saveChessGame({
  winner: 'white', // or 'black' or 'draw'
  moves: 45, // total move count
  duration: 15, // game duration in minutes
  capturedByWhite: ['pawn', 'knight', 'bishop'], // optional
  capturedByBlack: ['pawn', 'pawn', 'rook'] // optional
});
```

**Example Integration:**

```javascript
function endGame(winner) {
  const moveCount = moveHistory.length;
  const durationMinutes = Math.floor((Date.now() - gameStartTime) / 60000);
  
  GameStatsTracker.saveChessGame({
    winner: winner, // 'white', 'black', or 'draw'
    moves: moveCount,
    duration: durationMinutes,
    capturedByWhite: capturedPieces.white,
    capturedByBlack: capturedPieces.black
  });
}
```

#### RIDDLE Integration

**Slide Puzzle:**

```javascript
GameStatsTracker.saveSlidePuzzle({
  size: 4, // 3 or 4
  moves: 156, // move count
  time: 245 // time in seconds
});
```

**Match Puzzle:**

```javascript
GameStatsTracker.saveMatchPuzzle({
  tries: 12, // number of attempts
  pairs: 8, // pairs matched
  time: 87 // time in seconds
});
```

**Echo Game:**

```javascript
GameStatsTracker.saveEchoGame({
  level: 7, // level reached
  duration: 5 // duration in minutes
});
```

**Example Slide Integration:**

```javascript
function onPuzzleSolved() {
  const timeElapsed = Math.floor((Date.now() - puzzleStartTime) / 1000);
  
  GameStatsTracker.saveSlidePuzzle({
    size: currentBoardSize, // 3 or 4
    moves: moveCounter,
    time: timeElapsed
  });
  
  // Show win modal or continue game...
}
```

#### Snake Integration

When a Snake game ends:

```javascript
GameStatsTracker.saveSnakeGame({
  score: 42, // final score
  duration: 3 // game duration in minutes
});
```

**Example Integration:**

```javascript
function gameOver() {
  const durationMinutes = Math.floor((Date.now() - gameStartTime) / 60000);
  
  GameStatsTracker.saveSnakeGame({
    score: currentScore,
    duration: durationMinutes || 1
  });
  
  // Show game over screen...
}
```

#### Military Integration (Outpost Defense)

When a mission ends:

```javascript
GameStatsTracker.saveMilitaryGame({
  score: 240,
  wave: 4,
  kills: 18,
  duration: 2
});
```

**Example Integration:**

```javascript
function gameOver() {
  const durationMinutes = Math.floor((Date.now() - gameStartTime) / 60000) || 1;

  GameStatsTracker.saveMilitaryGame({
    score: currentScore,
    wave: currentWave,
    kills: currentKills,
    duration: durationMinutes
  });
}
```

## Getting Current Stats

You can retrieve current statistics to display in your game:

```javascript
// Chess stats
const chessStats = GameStatsTracker.getChessStats();
console.log(`Total games: ${chessStats.totalGames}`);
console.log(`White wins: ${chessStats.whiteWins}`);

// RIDDLE stats
const riddleStats = GameStatsTracker.getRiddleStats();
console.log(`Slide puzzles: ${riddleStats.slideCompleted}`);
console.log(`Echo best: ${riddleStats.echoBest}`);

// Snake stats
const snakeStats = GameStatsTracker.getSnakeStats();
console.log(`High score: ${snakeStats.highScore}`);
console.log(`Games played: ${snakeStats.gamesPlayed}`);

// Military stats
const militaryStats = GameStatsTracker.getMilitaryStats();
console.log(`High score: ${militaryStats.highScore}`);
console.log(`Best wave: ${militaryStats.bestWave}`);
```

## Customization

### Custom Dashboard Link Position

```javascript
// Bottom left
GameStatsTracker.addDashboardLink('body');

// Or add to a specific container
GameStatsTracker.addDashboardLink('#my-container');
```

### Custom Notifications

The tracker automatically shows notifications when games are saved. These appear in the top-right corner and disappear after 3 seconds.

## Data Storage

All game statistics are stored in browser `localStorage`:

- `chess-stats`: Chess game history (last 100 games)
- `riddle-stats`: RIDDLE puzzle completions (last 50 per type)
- `snake-stats`: Snake game history (last 100 games)
- `snake-best`: Snake high score
- `echo-best`: Echo best level
- `military-stats`: Outpost Defense mission history (last 100 games)
- `military-best`: Outpost Defense high score

## Testing

To test the integration:

1. Play a game and complete it
2. Check browser console for any errors
3. Open the dashboard (`dashboard.html`)
4. Verify your game statistics appear
5. Play multiple games to see history building

## Clearing Data

Users can clear all statistics from the dashboard using the "Clear All Data" button in the sidebar.

## File Names for Each Game

The dashboard expects these file names for the game links:

- Chess: `chess.html`
- RIDDLE: `riddle.html`
- Snake: `snake.html`
- Military: `military.html`

If your game files have different names, update the links in `dashboard.html`:

```html
<!-- Update these href values -->
<a href="your-chess-game.html" class="quick-link-card">
<a href="your-riddle-game.html" class="quick-link-card">
<a href="your-snake-game.html" class="quick-link-card">
```

## Example Complete Integration

Here's a minimal example of integrating into a Snake game:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Snake</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game"></canvas>
  
  <!-- Include stats tracker -->
  <script src="game-stats-tracker.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

```javascript
// In your script.js
let gameStartTime;
let currentScore = 0;

function startGame() {
  gameStartTime = Date.now();
  currentScore = 0;
  // ... game initialization
}

function gameOver() {
  const durationMinutes = Math.floor((Date.now() - gameStartTime) / 60000) || 1;
  
  // Save to dashboard
  GameStatsTracker.saveSnakeGame({
    score: currentScore,
    duration: durationMinutes
  });
  
  // Show game over UI
  showGameOverScreen();
}

// Add dashboard link when game loads
window.addEventListener('DOMContentLoaded', () => {
  GameStatsTracker.addDashboardLink();
});
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Ensure game-stats-tracker.js is loaded before your game script
4. Check that data structure matches the expected format
