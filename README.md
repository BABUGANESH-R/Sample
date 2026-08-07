# Games Dashboard System

A comprehensive dashboard system for tracking and visualizing game statistics across multiple browser-based games.

## 🎮 Supported Games

This dashboard system supports three games:

- **♟️ Chess** - Two-player chess with move tracking and game history
- **🧩 RIDDLE** - Three puzzle types: Slide, Match, and Echo
- **🐍 Snake** - Classic snake game with high score tracking

## 📊 Dashboard Features

- **Unified Statistics** - Track all games in one place
- **Game History** - View recent plays and outcomes
- **Best Scores** - Track high scores and personal bests
- **Visual Analytics** - Clean, modern UI with statistics cards
- **Local Storage** - All data stored locally in your browser
- **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### View the Dashboard

Simply open `dashboard.html` in your browser to see all your game statistics.

### Integrate Into Your Game

1. Add the stats tracker to your game's HTML:

```html
<script src="game-stats-tracker.js"></script>
```

2. Track game events in your JavaScript:

```javascript
// When game ends, save stats
GameStatsTracker.saveSnakeGame({
  score: 42,
  duration: 3
});
```

3. Add a dashboard link (optional):

```javascript
GameStatsTracker.addDashboardLink();
```

## 📁 File Structure

```
├── dashboard.html              # Main dashboard interface
├── dashboard-style.css         # Dashboard styling
├── dashboard.js                # Dashboard logic
├── game-stats-tracker.js       # Integration module
├── DASHBOARD_INTEGRATION.md    # Detailed integration guide
└── integration-examples/       # Example code for each game
    ├── chess-integration-example.js
    ├── riddle-integration-example.js
    └── snake-integration-example.js
```

## 📖 Documentation

- **[Integration Guide](DASHBOARD_INTEGRATION.md)** - Complete guide for integrating the dashboard into your games
- **[Examples](integration-examples/)** - Working code examples for each game type

## 🎯 Game-Specific Tracking

### Chess
- Total games played
- Wins by color (white/black)
- Draw count
- Average moves per game
- Captured pieces tracking

### RIDDLE Puzzles

**Slide Puzzle:**
- Completion count
- Best move count (3×3 and 4×4)
- Best completion time

**Match Puzzle:**
- Games completed
- Best tries (attempts to match all pairs)
- Perfect games (8 tries = 8 pairs)

**Echo Game:**
- Games played
- Best level reached
- Average level

### Snake
- High score
- Games played
- Average score
- Top 10 leaderboard
- Recent game history

## 💾 Data Storage

All statistics are stored in your browser's `localStorage`:

- `chess-stats` - Chess game history
- `riddle-stats` - RIDDLE puzzle completions
- `snake-stats` - Snake game history
- `snake-best` - Snake high score
- `echo-best` - Echo best level

Data persists between sessions and can be cleared using the "Clear All Data" button in the dashboard.

## 🛠️ Integration Example

Here's a minimal Snake game integration:

```javascript
let gameStartTime;
let currentScore = 0;

function startGame() {
  gameStartTime = Date.now();
  currentScore = 0;
  // ... game logic
}

function gameOver() {
  const duration = Math.floor((Date.now() - gameStartTime) / 60000) || 1;
  
  GameStatsTracker.saveSnakeGame({
    score: currentScore,
    duration: duration
  });
}

// Add dashboard link on page load
GameStatsTracker.addDashboardLink();
```

See the [integration-examples/](integration-examples/) folder for complete examples.

## 🎨 Features

- **Modern UI** - Dark theme with gradient accents
- **Real-time Stats** - Automatically updates when games are saved
- **Responsive Layout** - Sidebar navigation with content areas
- **Smooth Animations** - Fade transitions and hover effects
- **Empty States** - Helpful messages when no data exists
- **Notifications** - Toast notifications when games are saved
- **Data Management** - Easy data clearing with confirmation modal

## 🌐 Browser Compatibility

Works in all modern browsers with `localStorage` support:
- Chrome
- Firefox
- Safari
- Edge

## 📝 License

This dashboard system is open source and free to use.

## 🤝 Contributing

To add support for a new game:

1. Add tracking methods to `game-stats-tracker.js`
2. Create a new view in `dashboard.html`
3. Add data loading methods in `dashboard.js`
4. Update this README with the new game info

## 📞 Support

For integration help, see:
- [DASHBOARD_INTEGRATION.md](DASHBOARD_INTEGRATION.md) - Complete integration guide
- [integration-examples/](integration-examples/) - Working code examples