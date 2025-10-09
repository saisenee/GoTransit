document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loading').textContent = 'Loading...';

  // Fetch all stops from our server relay and build a code-to-name lookup
  fetch('/api/stops')
    .then(res => res.json())
    .then(stopsData => {
      // Build a lookup: code (uppercased) => name
      const codeToName = {};
      if (stopsData && stopsData.Stations && Array.isArray(stopsData.Stations.Station)) {
        stopsData.Stations.Station.forEach(station => {
          // Use two-letter code if possible, else LocationCode
          // We'll try to match OA, UN, etc. to LocationName
          if (station.LocationName && station.LocationCode) {
            // Some LocationCodes are numbers, but for GO stations, the two-letter code is often in the name (e.g., "Oakville GO")
            // We'll map by uppercase code if possible
            // You may want to enhance this mapping if you have a better code source
            codeToName[station.LocationCode.toUpperCase()] = station.LocationName;
          }
        });
      }

      // Now fetch journeys and display departures
      fetch('/api/journeys?date=20251009&from=oa&to=un&start=0900&max=10')
        .then(res => res.json())
        .then(data => {
          document.getElementById('loading').style.display = 'none';
          const departuresDiv = document.getElementById('departures');
          departuresDiv.innerHTML = '';

          // Check for SchJourneys and Services
          if (
            !data ||
            !data.SchJourneys ||
            !Array.isArray(data.SchJourneys) ||
            data.SchJourneys.length === 0 ||
            !data.SchJourneys[0].Services ||
            !Array.isArray(data.SchJourneys[0].Services) ||
            data.SchJourneys[0].Services.length === 0
          ) {
            departuresDiv.innerHTML = '<p>No departures found.</p>';
            return;
          }

          // Build a semantic table for departures so styling is controlled via CSS
          const table = document.createElement('table');
          table.id = 'departuresTable';

          const thead = table.createTHead();
          const headerRow = thead.insertRow();
          ['Trip', 'Departure', 'From', 'Arrival', 'To', 'Duration'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
          });

          const tbody = document.createElement('tbody');
          table.appendChild(tbody);

          data.SchJourneys[0].Services.forEach(service => {
            const trips = service.Trips && service.Trips.Trip ? service.Trips.Trip : [];
            trips.forEach(trip => {
              const stops = trip.Stops && trip.Stops.Stop ? trip.Stops.Stop : [];
              const departStop = stops[0];
              const arriveStop = stops[stops.length - 1];

              const departName = departStop && departStop.Code ? (codeToName[departStop.Code.toUpperCase()] || departStop.Code) : 'N/A';
              const arriveName = arriveStop && arriveStop.Code ? (codeToName[arriveStop.Code.toUpperCase()] || arriveStop.Code) : 'N/A';

              const tr = document.createElement('tr');

              const tdTrip = document.createElement('td');
              tdTrip.innerHTML = `<strong>${trip.Display || ('Trip ' + (trip.Number || ''))}</strong>`;
              tr.appendChild(tdTrip);

              const tdDep = document.createElement('td');
              const depSpan = document.createElement('span');
              depSpan.className = 'time-depart';
              depSpan.textContent = departStop?.Time || 'N/A';
              tdDep.appendChild(depSpan);
              tr.appendChild(tdDep);

              const tdFrom = document.createElement('td');
              tdFrom.textContent = departName;
              tr.appendChild(tdFrom);

              const tdArr = document.createElement('td');
              const arrSpan = document.createElement('span');
              arrSpan.className = 'time-arrive';
              arrSpan.textContent = arriveStop?.Time || 'N/A';
              tdArr.appendChild(arrSpan);
              tr.appendChild(tdArr);

              const tdTo = document.createElement('td');
              tdTo.textContent = arriveName;
              tr.appendChild(tdTo);

              const tdDur = document.createElement('td');
              tdDur.textContent = service.Duration || '';
              tr.appendChild(tdDur);

              tbody.appendChild(tr);
            });
          });

          departuresDiv.appendChild(table);
        })
        .catch(err => {
          document.getElementById('loading').textContent = 'Error loading departures.';
          console.error('Error fetching journey data:', err);
        });
    })
    .catch(err => {
      document.getElementById('loading').textContent = 'Error loading stops.';
      console.error('Error fetching stops data:', err);
    });

  // Live clock: update #liveClock every second with user's local time
  const liveClockEl = document.getElementById('liveClock');
  const clockToggle = document.getElementById('clockToggle');

  // Load saved preference ("24" or "12"). Default to 12h.
  let clockFormat = localStorage.getItem('clockFormat') || '12';
  function applyToggleState() {
    if (!clockToggle) return;
    clockToggle.setAttribute('aria-pressed', clockFormat === '24' ? 'true' : 'false');
    clockToggle.textContent = clockFormat === '24' ? '24H' : '12H';
  }

  function formatTime(date) {
    if (!date) return '';
    if (clockFormat === '24') {
      // 24-hour, ensure zero-padded hours: 00-23
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    } else {
      // 12-hour w/ AM/PM
      const opts = { hour: 'numeric', minute: '2-digit', second: '2-digit' };
      return date.toLocaleTimeString([], opts);
    }
  }

  if (clockToggle) {
    clockToggle.addEventListener('click', () => {
      clockFormat = clockFormat === '24' ? '12' : '24';
      localStorage.setItem('clockFormat', clockFormat);
      applyToggleState();
      // update immediately
      if (liveClockEl) liveClockEl.textContent = formatTime(new Date());
    });
  }

  applyToggleState();

  function updateClock() {
    if (!liveClockEl) return;
    liveClockEl.textContent = formatTime(new Date());
  }

  updateClock();
  setInterval(updateClock, 1000);
});

// End of script: all fetching handled inside DOMContentLoaded handler above