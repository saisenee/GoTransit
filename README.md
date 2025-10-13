# GOTransitAPI
API sourced from Metrolinx @ https://api.openmetrolinx.com/OpenDataAPI/Help/Index/en

# details

The website created would be displayed at the Oakville Go transit station serving as a departures board and kiosk for the Lakeshore West line that runs through the station. Be default it shows the next 10-15 scheduled lines to Union from Oakville GO. Using the buttons on the right they can choose a specific station on the LW to customize their experience and determine transit times on the fly. 

## Development

(cheat sheet for node.js created by AI co-pilot)

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
