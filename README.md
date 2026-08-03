# SHIFT — Sliding Puzzle

A browser-based sliding-tile puzzle. Shuffle the board, slide tiles into the empty space, and restore numerical order.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## How to play

1. Choose **3×3**, **4×4**, or **5×5**.
2. Click / tap a tile next to the empty space to slide it (or use arrow keys / swipe).
3. Restore tiles to ascending order with the blank in the bottom-right.
4. Use **Hint** to pulse a suggested move, **Shuffle** to restart.

Moves, time, and per-size best scores are tracked (best scores saved in `localStorage`).

## Files

- `index.html` — app shell
- `style.css` — layout and visuals
- `script.js` — puzzle logic (solvable shuffles, controls, win state)
