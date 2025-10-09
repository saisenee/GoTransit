# GOTransitAPI
API sourced from Metrolinx @ https://api.openmetrolinx.com/OpenDataAPI/Help/Index/en

# details

## Development

Quick start

1. Install dependencies (only once):

```powershell
npm install
```

2. Run in development (auto-restarts on changes):

```powershell
npm run dev
```

3. Or run production style (single-start):

```powershell
npm start
```

Notes

- `npm run dev` uses `nodemon` to restart the server when `server.js` or files under `public/` change.
- If CSS changes don't show, hard-refresh the browser (Ctrl+F5) or open DevTools and select "Disable cache" while reloading.
- To explicitly check the served CSS value from PowerShell:

```powershell
Invoke-WebRequest "http://localhost:3000/style.css?ts=$([int][double]::Parse((Get-Date -UFormat %s)))" -UseBasicParsing | Select-String -Pattern "background-color"
```

If you'd like automatic no-cache headers during development I can add a small middleware to `server.js`.