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

      // Function to fetch journeys starting from the current time and render
      function getYYYYMMDD(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
      }

      function getHHMM(d) {
        return String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
      }

      function parseTimeString(t) {
        if (!t) return NaN;
        if (typeof t !== 'string') return NaN;
        if (t.includes(':')) {
          // assume HH:MM or H:MM
          const parts = t.split(':');
          const hh = parseInt(parts[0], 10);
          const mm = parseInt(parts[1], 10);
          return hh * 60 + mm;
        }
        // assume HHMM
        if (t.length === 4 && /^\d{4}$/.test(t)) {
          const hh = parseInt(t.slice(0, 2), 10);
          const mm = parseInt(t.slice(2), 10);
          return hh * 60 + mm;
        }
        return NaN;
      }

      function computeDelayMinutes(scheduledStr, actualStr) {
        const s = parseTimeString(scheduledStr);
        const a = parseTimeString(actualStr);
        if (isNaN(s) || isNaN(a)) return null;
        return a - s; // minutes (positive = delayed)
      }

      // track currently selected station code (default to 'union')
      let selectedStationCode = 'union';

      // helper to update selected station (called from button clicks)
      function setSelectedStation(code) {
        selectedStationCode = code;
        // update button styles
        document.querySelectorAll('.station-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.code === code);
        });
        // update SVG circle visuals (fill white for selected, restore others)
        try {
          const svg = document.getElementById('inlineLineSvg');
          if (svg) {
            svg.querySelectorAll('circle').forEach(c => {
              if (c.id === code) {
                c.setAttribute('data-selected', 'true');
                c.setAttribute('fill', 'white');
              } else {
                c.removeAttribute('data-selected');
                // restore default fill for unselected circles
                // default colour used in the SVG is #2A4D28 for most circles,
                // and one circle uses white with stroke — we won't change stroke here.
                if (c.id === 'port_credit') {
                  // port_credit originally had white fill and a stroke
                  c.setAttribute('fill', 'white');
                } else {
                  c.setAttribute('fill', '#2A4D28');
                }
              }
            });
          }
        } catch (e) {
          console.warn('Error updating inline SVG selection', e);
        }
      }

      // wire station buttons after DOM ready
      function wireStationButtons() {
        document.querySelectorAll('.station-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            setSelectedStation(code);
            // after selecting, refresh journeys to use new destination
            fetchAndRenderJourneys();
          });
        });
      }

      // Inline the SVG so we can modify its elements. Replace <img id="lineSvgImg"> with inline SVG contents
      async function inlineSvg() {
        const img = document.getElementById('lineSvgImg');
        if (!img) return;
        try {
          const res = await fetch(img.src);
          const text = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          if (!svg) return;
          // give the svg an id for easier selection
          svg.id = 'inlineLineSvg';
          // replace image with inline svg
          img.replaceWith(svg);
        } catch (e) {
          console.error('Failed to inline SVG', e);
        }
      }

      // initially wire buttons and inline svg
      inlineSvg().then(() => {
        wireStationButtons();
        // set initial selection to union
        setSelectedStation(selectedStationCode);
      });

      // map from our data-code to the two-letter Metrolinx API code
      const twoLetterOverrides = {
        // explicit overrides if the simple 'first two letters' rule doesn't match API codes
        // 'port_credit': 'pc', // example if needed
      };

      function toApiCode(stationCode) {
        if (!stationCode) return stationCode;
        if (twoLetterOverrides[stationCode]) return twoLetterOverrides[stationCode];
        // derive from the station name token before underscore (e.g., port_credit -> port)
        const token = stationCode.split('_')[0];
        // take first two letters
        return token.slice(0, 2).toLowerCase();
      }

      async function fetchAndRenderJourneys() {
        const now = new Date();
        const dateStr = getYYYYMMDD(now);
        const start = getHHMM(now);
        const max = 12; // show next 12 departures
        // convert our selectedStationCode to the API's two-letter code
        const toCode = toApiCode(selectedStationCode);
        const url = `/api/journeys?date=${dateStr}&from=oa&to=${toCode}&start=${start}&max=${max}`;

        try {
          const res = await fetch(url);
          const data = await res.json();
          document.getElementById('loading').style.display = 'none';
          const departuresDiv = document.getElementById('departures');
          departuresDiv.innerHTML = '';

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

          // table
          const table = document.createElement('table');
          table.id = 'departuresTable';
          const thead = table.createTHead();
          const headerRow = thead.insertRow();
          ['Destination', 'Departure', 'Status', 'Arrival', 'To', 'Duration'].forEach(h => {
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

              // status/delay detection
              const tdStatus = document.createElement('td');
              let statusText = 'On time';
              let statusClass = 'status-on';

              // Detect cancellation
              if (trip?.Cancelled || trip?.IsCancelled || service?.Cancelled) {
                statusText = 'Cancelled';
                statusClass = 'status-cancelled';
              } else {
                // try to find actual/estimated time fields
                const actual = departStop?.AdjustedTime || departStop?.EstimatedTime || departStop?.ActualTime || departStop?.TimeRT || departStop?.Realtime || departStop?.RealtimeEstimated;
                const scheduled = departStop?.Time;
                const delay = computeDelayMinutes(scheduled, actual);
                if (delay !== null) {
                  if (delay > 0) {
                    statusText = `Delayed ${delay}m`;
                    statusClass = 'status-delayed';
                  } else if (delay < 0) {
                    statusText = `Early ${Math.abs(delay)}m`;
                    statusClass = 'status-early';
                  } else {
                    statusText = 'On time';
                    statusClass = 'status-on';
                  }
                } else if (trip?.Status) {
                  statusText = trip.Status;
                }
              }

              tdStatus.textContent = statusText;
              tdStatus.className = statusClass;
              tr.appendChild(tdStatus);

              // const tdFrom = document.createElement('td');
              // tdFrom.textContent = departName;
              // tr.appendChild(tdFrom);

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
        } catch (err) {
          document.getElementById('loading').textContent = 'Error loading departures.';
          console.error('Error fetching journey data:', err);
        }
      }

      // initial fetch and poll every 60 seconds
      fetchAndRenderJourneys();
      setInterval(fetchAndRenderJourneys, 60 * 1000);
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