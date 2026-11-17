# DevOps Academy

A personal, offline-first learning platform for a 30-week DevOps curriculum. No server, no account, no internet required (except optional web fonts).

## Open the app

1. Build once: `npm install && npm run build`
2. Open `dist/DevOps-Academy.html` in Chrome, Edge or Firefox (double-click or File → Open).
3. For development: `npm run dev`

## Where your data lives

- **This browser:** IndexedDB database `devops-academy` (progress, answers, grades, uploaded files).
- **Optional folder (Chrome/Edge):** Settings → “Save my progress to a folder”. Writes `progress.json` and a `files/` folder, autosaved about every 2 seconds.
- **Manual backup:** Settings → Export backup / Import backup (one `.json` file including files as base64).

## Back up

Export a backup from Settings at least weekly. If folder sync or a backup is older than 7 days and you have progress, a reminder banner appears.

## Update the app

Replace `DevOps-Academy.html` with a newer build. Your IndexedDB data stays in the browser. If you use folder sync, reconnect the same folder after updating.

## Tests

```bash
npm run build
npx playwright install chromium
npm test
```

## Stack

Vite, TypeScript, Preact, lucide icons, hash routing, `vite-plugin-singlefile`.
