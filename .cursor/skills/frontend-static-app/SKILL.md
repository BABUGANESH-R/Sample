---
name: frontend-static-app
description: Build or update static browser apps using this repo's HTML, CSS, and JavaScript files. Use when creating games, demos, landing pages, or UI features in index.html, style.css, or script.js.
paths:
  - "**/*.html"
  - "**/*.css"
  - "**/*.js"
---

# Frontend static app

Create and maintain self-contained browser apps that run by opening `index.html` (or via a simple static server). Prefer the existing root stack: `index.html`, `style.css`, `script.js`.

## When to use

- Adding or changing a UI, game, or interactive demo in the browser
- Styling or layout work in CSS
- Client-side logic in plain JavaScript (no build step required)

## Instructions

1. Keep the app runnable without a bundler. Link CSS and JS from `index.html` with relative paths.
2. Put structure in HTML, presentation in CSS, and behavior in JavaScript. Avoid large inline scripts/styles unless the change is tiny.
3. Prefer vanilla JS APIs (`querySelector`, `addEventListener`, `localStorage`) over frameworks unless the user asks for a framework.
4. Make the first viewport one clear composition: brand/title, one short supporting line, and one primary action. Avoid dashboard clutter and card-heavy heroes.
5. Ensure the UI works on both desktop and mobile (touch targets, flexible layout, no horizontal overflow).
6. Persist lightweight user state with `localStorage` when it improves the experience (scores, theme, last mode).
7. Before finishing, verify the page loads cleanly and core interactions work. Serve with:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Conventions

- Keep selectors and IDs stable when possible so styles and scripts stay aligned.
- Use CSS variables for the main color/typography direction when introducing a visual theme.
- Prefer progressive enhancement: the page should still render if scripts fail.
- Do not introduce a package.json/build toolchain for simple static demos unless requested.
