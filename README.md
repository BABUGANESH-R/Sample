# RIDDLE — Simple Puzzles

A lightweight browser puzzle pack with three quick games:

- **Slide** — restore numbered tiles on a 3×3 or 4×4 board
- **Match** — flip cards and clear eight pairs
- **Echo** — watch a light pattern and repeat it

Completions are saved locally and show up in the [Games Dashboard](dashboard.html).

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

You can also jump straight into a puzzle:

- [Slide](index.html#slide)
- [Match](index.html#match)
- [Echo](index.html#echo)

## Controls

| Game | Input |
|------|--------|
| Slide | Click / tap a tile next to the blank, or use arrow keys / swipe |
| Match | Click / tap cards to flip them |
| Echo | Press **Start**, watch the pads, then tap them in order |

Best Echo level is saved in `localStorage`. Slide, Match, and Echo results are also written to the dashboard tracker.

## Files

- `index.html` — app shell and screens
- `riddle.html` — alias used by the dashboard Play button
- `style.css` — layout, atmosphere, and motion
- `script.js` — puzzle logic for Slide, Match, and Echo
- `favicon.svg` — app icon
- `game-stats-tracker.js` — saves results for the dashboard
- `dashboard.html` — stats overview for RIDDLE, Chess, and Snake

## Dashboard

Open `dashboard.html` to view puzzle history, personal bests, and recent games. See [DASHBOARD_INTEGRATION.md](DASHBOARD_INTEGRATION.md) if you want to reuse the tracker in another game.
