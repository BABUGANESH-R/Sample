# RIDDLE — Puzzle Game Dashboard

A simple browser puzzle pack with a stats dashboard.

## Play

Open `index.html` (or serve the folder with `python3 -m http.server 8080`).

- **Slide** — restore a 3×3 or 4×4 numbered grid (click, arrows, or swipe)
- **Match** — find eight hidden pairs
- **Echo** — repeat a growing light pattern

Completions save to `localStorage` and show up on `dashboard.html`.

## Dashboard

`dashboard.html` is the puzzle app dashboard:

- Overview of puzzles solved, streak, Echo best, and play time
- Weekly activity and personal records
- Dedicated Slide, Match, and Echo history
- Chess and Snake stats if those games have been tracked
- **Load demo data** fills the board for a preview
- **Clear all data** wipes local stats after confirmation

`riddle.html` redirects to the puzzle hub so existing Play RIDDLE links keep working.

## Files

```
index.html              Puzzle hub + games
riddle.html             Alias to the hub
script.js / style.css   Game logic and styling
dashboard.html          Puzzle dashboard
dashboard.js            Dashboard UI
dashboard-stats.js      Shared stats helpers
game-stats-tracker.js   Save API used by the games
```

## Tests

```bash
node puzzle-logic.test.js
node dashboard-stats.test.js
```
