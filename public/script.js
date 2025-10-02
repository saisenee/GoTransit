
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
      fetch('/api/journeys?date=20251002&from=oa&to=un&start=0900&max=5')
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

          const list = document.createElement('ul');

          data.SchJourneys[0].Services.forEach(service => {
            // Each service may have multiple trips
            const trips = service.Trips && service.Trips.Trip ? service.Trips.Trip : [];
            trips.forEach(trip => {
              // Get stops for this trip
              const stops = trip.Stops && trip.Stops.Stop ? trip.Stops.Stop : [];
              const departStop = stops[0];
              const arriveStop = stops[stops.length - 1];

              // Lookup stop names
              const departName = departStop && departStop.Code ? (codeToName[departStop.Code.toUpperCase()] || departStop.Code) : 'N/A';
              const arriveName = arriveStop && arriveStop.Code ? (codeToName[arriveStop.Code.toUpperCase()] || arriveStop.Code) : 'N/A';

              const li = document.createElement('li');
              li.innerHTML = `
                <strong>Trip ${trip.Number} (${trip.Display})</strong><br>
                Departure: <span style="color:green">${departStop?.Time || 'N/A'}</span> from <b>${departName}</b>
                &rarr; Arrival: <span style="color:blue">${arriveStop?.Time || 'N/A'}</span> at <b>${arriveName}</b>
                <br>Duration: ${service.Duration}
              `;
              list.appendChild(li);
            });
          });

          departuresDiv.appendChild(list);
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
});
  document.getElementById('loading').textContent = 'Loading...';
document.querySelector('.reddit-sans-body').textContent = 'Loading...';

  fetch('/api/journeys?date=20251002&from=oa&to=un&start=0900&max=5')
    .then(res => res.json())
    .then(data => {
      document.getElementById('loading').style.display = 'none';
      const departuresDiv = document.getElementById('departures');
      departuresDiv.innerHTML = '';
      if (!data || !data.journeys || data.journeys.length === 0) {
        departuresDiv.innerHTML = '<p>No departures found.</p>';
        return;
      }
      const list = document.createElement('ul');
      data.journeys.forEach(journey => {
        const depTime = journey.legs[0]?.departureTime || 'Unknown';
        const arrTime = journey.legs[journey.legs.length - 1]?.arrivalTime || 'Unknown';
        const route = journey.legs[0]?.routeName || 'Unknown Route';
        const li = document.createElement('li');
        li.textContent = `Route: ${route}, Departure: ${depTime}, Arrival: ${arrTime}`;
        list.appendChild(li);
      });
      departuresDiv.appendChild(list);
    })
    .catch(err => {
      document.getElementById('loading').textContent = 'Error loading departures.';
      console.error('Error fetching journey data:', err);
    });
// ...existing code ends here