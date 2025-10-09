
const express = require('express'); 
const path = require('path');

const app = express();
const PORT = 3000;
const apiKey = '30025820'; // my API key
// API endpoint to proxy Metrolinx stops data
app.get('/api/stops', async (req, res) => {
  const url = `https://api.openmetrolinx.com/OpenDataAPI/api/V1/Stop/All?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching stops data:', err);
    res.status(500).json({ error: 'Server error', err: err });
  }
});
// API endpoint to proxy Metrolinx journey data
app.get('/api/journeys', async (req, res) => {
  const { date, from, to, start, max } = req.query;
  if (!date || !from || !to || !start || !max) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }
  const url = `https://api.openmetrolinx.com/OpenDataAPI/api/V1/Schedule/Journey/${date}/${from}/${to}/${start}/${max}?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching journey data:', err);
    res.status(500).json({ error: 'Server error', err:err });
  }
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // Pad single-digit numbers with a leading zero
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('liveClock').innerHTML = timeString;
}

// Call updateClock initially to display the time immediately
updateClock();

// Update the clock every second
setInterval(updateClock, 1000);
