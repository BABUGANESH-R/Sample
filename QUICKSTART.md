# Quick Start Guide

Get your game integrated with the dashboard in 5 minutes!

## For Developers

### Step 1: Add the Script

Add this line to your game's HTML, before your game script:

```html
<script src="game-stats-tracker.js"></script>
<script src="your-game.js"></script>
```

### Step 2: Track Your Game

Choose your game type and add the appropriate tracking code:

#### 🐍 Snake Game

```javascript
// When game ends:
GameStatsTracker.saveSnakeGame({
  score: currentScore,
  duration: Math.floor((Date.now() - startTime) / 60000) || 1
});
```

#### ♟️ Chess Game

```javascript
// When game ends:
GameStatsTracker.saveChessGame({
  winner: 'white', // or 'black' or 'draw'
  moves: moveCount,
  duration: Math.floor((Date.now() - startTime) / 60000) || 1
});
```

#### 🧩 RIDDLE - Slide Puzzle

```javascript
// When puzzle solved:
GameStatsTracker.saveSlidePuzzle({
  size: 4, // 3 or 4
  moves: moveCount,
  time: Math.floor((Date.now() - startTime) / 1000)
});
```

#### 🧩 RIDDLE - Match Puzzle

```javascript
// When all pairs matched:
GameStatsTracker.saveMatchPuzzle({
  tries: attemptCount,
  pairs: 8,
  time: Math.floor((Date.now() - startTime) / 1000)
});
```

#### ⚔ Military (Outpost Defense)

```javascript
// When the mission ends:
GameStatsTracker.saveMilitaryGame({
  score: currentScore,
  wave: currentWave,
  kills: currentKills,
  duration: Math.floor((Date.now() - startTime) / 60000) || 1
});
```

#### 🧩 RIDDLE - Echo Game

```javascript
// When player fails:
GameStatsTracker.saveEchoGame({
  level: currentLevel,
  duration: Math.floor((Date.now() - startTime) / 60000) || 1
});
```

### Step 3: Add Dashboard Link (Optional)

Add this when your page loads:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  GameStatsTracker.addDashboardLink();
});
```

This adds a floating "View Dashboard" button to your game.

### Step 4: Test It!

1. Play your game and complete it
2. Open `dashboard.html` in your browser
3. Check that your game stats appear!

## Complete Example

Here's a complete Snake game integration:

**snake.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Snake</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game"></canvas>
  
  <script src="game-stats-tracker.js"></script>
  <script src="snake-game.js"></script>
</body>
</html>
```

**snake-game.js:**
```javascript
let gameStartTime;
let score = 0;

function startGame() {
  gameStartTime = Date.now();
  score = 0;
  // ... your game logic
}

function gameOver() {
  const duration = Math.floor((Date.now() - gameStartTime) / 60000) || 1;
  
  GameStatsTracker.saveSnakeGame({
    score: score,
    duration: duration
  });
  
  // Show game over screen
}

// Add dashboard link
document.addEventListener('DOMContentLoaded', () => {
  GameStatsTracker.addDashboardLink();
});
```

That's it! Your game is now connected to the dashboard.

## What Gets Tracked?

### Snake
- Score
- Game duration
- High score (automatic)

### Chess
- Winner (white/black/draw)
- Move count
- Game duration
- Captured pieces

### RIDDLE Puzzles
- Completion time
- Move/try count
- Puzzle size/type
- Best scores

## Viewing Stats

Open `dashboard.html` to see:
- Overview of all games
- Individual game statistics
- Game history
- Leaderboards (Snake)
- Personal bests

## Getting Stats in Your Game

You can also retrieve current stats to display in your game:

```javascript
const stats = GameStatsTracker.getSnakeStats();
console.log(`High Score: ${stats.highScore}`);
console.log(`Games Played: ${stats.gamesPlayed}`);
```

## Troubleshooting

### Stats not showing up?

1. Check browser console for errors
2. Verify `game-stats-tracker.js` is loaded before your game script
3. Make sure you're calling the save method when game ends
4. Check that localStorage is enabled in your browser

### Dashboard link not appearing?

1. Make sure you called `GameStatsTracker.addDashboardLink()`
2. Check browser console for errors
3. Try calling it after page loads:
   ```javascript
   window.addEventListener('load', () => {
     GameStatsTracker.addDashboardLink();
   });
   ```

### Data not persisting?

1. Check that localStorage is enabled
2. Don't use private/incognito mode (localStorage may be cleared)
3. Check browser storage settings

## Next Steps

- Read [DASHBOARD_INTEGRATION.md](DASHBOARD_INTEGRATION.md) for detailed integration guide
- Check [integration-examples/](integration-examples/) for complete code examples
- Customize the dashboard styling in `dashboard-style.css`
- Add your own metrics and tracking

## Need Help?

Check the detailed guides:
- [DASHBOARD_INTEGRATION.md](DASHBOARD_INTEGRATION.md) - Complete integration documentation
- [integration-examples/chess-integration-example.js](integration-examples/chess-integration-example.js) - Chess example
- [integration-examples/riddle-integration-example.js](integration-examples/riddle-integration-example.js) - RIDDLE example
- [integration-examples/snake-integration-example.js](integration-examples/snake-integration-example.js) - Snake example
