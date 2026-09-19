# FocusList

A clean, responsive to-do app built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no build step.

## Features

- Add, edit, and delete tasks
- Mark tasks complete/incomplete
- Set task priority (High / Medium / Low), shown as a colored tag on each task
- Search tasks by title
- Filter by status (All / Active / Completed) and by priority — combinable, updating live
- Live stats: total, completed, pending
- Data persists across refreshes via `localStorage`
- Light/dark theme toggle, fully responsive layout
- Accessible markup: ARIA labels on interactive controls, keyboard support (Enter to save an edit, Escape to cancel)

## Project structure

```
focuslist/
├── index.html          # Markup only — no inline styles or scripts
├── css/
│   └── style.css        # All styling, including light/dark theme tokens
├── js/
│   ├── logic.js          # Pure, DOM-free functions (filtering, stats, task creation, escaping)
│   └── app.js             # DOM rendering, event wiring, and localStorage persistence
├── tests/
│   └── logic.test.js      # Unit tests for js/logic.js, using Node's built-in test runner
└── package.json
```

The split between `logic.js` and `app.js` keeps the testable business logic (filtering, sorting, stats, task creation, HTML escaping) separate from DOM manipulation, so it can run — and be tested — outside a browser.

## Run locally

Just open `index.html` in a browser. No build tools or server required, though any static server works too, e.g.:

```
python3 -m http.server 8000
```

## Run tests

Requires Node.js 18+ (uses the built-in `node:test` runner, no dependencies to install):

```
npm test
```

## Deploy

Enable GitHub Pages on this repo (Settings → Pages → deploy from `main` branch, root folder) to get a live link.
