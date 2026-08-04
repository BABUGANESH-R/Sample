# RIDDLE — Simple Puzzles

A lightweight browser puzzle pack with three quick games:

- **Slide** — restore numbered tiles on a 3×3 or 4×4 board
- **Match** — flip cards and clear eight pairs
- **Echo** — watch a light pattern and repeat it

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Controls

| Game | Input |
|------|--------|
| Slide | Click / tap a tile next to the blank, or use arrow keys / swipe |
| Match | Click / tap cards to flip them |
| Echo | Press **Start**, watch the pads, then tap them in order |

Best Echo level is saved in `localStorage`.

## Files

- `index.html` — app shell and screens
- `style.css` — layout, atmosphere, and motion
- `script.js` — puzzle logic for Slide, Match, and Echo
- `favicon.svg` — app icon
