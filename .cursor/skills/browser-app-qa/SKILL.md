---
name: browser-app-qa
description: Manually QA browser apps in this repo with a static server, screenshots, and short gameplay or interaction recordings. Use when testing UI flows, verifying demos, or gathering visual proof before a PR summary.
paths:
  - "**/*.html"
  - "**/*.css"
  - "**/*.js"
---

# Browser app QA

Validate static web apps by running them locally and exercising the real UI, not only by reading code.

## When to use

- After building or changing a browser demo/game/todo UI
- When the user asks to test, verify, or record the app
- Before writing a PR walkthrough that needs screenshots or a demo video

## Instructions

1. Serve the app from the repo root (or the app folder if one exists):

```bash
python3 -m http.server 8080
```

2. Open the app in a browser and confirm the first screen renders without console-breaking errors.
3. Walk the critical path end to end (start → main interaction → success/empty/error state).
4. Check desktop and a narrow mobile width for layout breakage and unusable controls.
5. Capture at least:
   - One start/home screenshot
   - One in-progress interaction screenshot
   - One completion or key result screenshot when applicable
6. For interactive apps (games, editors), record a short demo of the happy path.
7. Note defects with reproduction steps; fix blockers before calling QA done.

## What good looks like

- Primary CTA is obvious and works on first click/tap
- Keyboard and pointer controls both work when both are advertised
- No horizontal scroll on common phone widths
- State resets cleanly (new game / clear list / restart) without a full reload when expected
