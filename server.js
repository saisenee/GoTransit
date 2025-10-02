<<<<<<< HEAD

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


=======
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

const apiURL = 'https://api.openmetrolinx.com/OpenDataAPI/api/V1/Gtfs/Feed/VehiclePosition';
const apiKey = '30025820'; // Replace with your actual API key if needed

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// API endpoint to proxy Metrolinx data
app.get('/api/vehicles', async (req, res) => {
  try {
    const response = await fetch(apiURL, {
      headers: { 'x-api-key': apiKey }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
>>>>>>> aef3afa51e758fad077ff5eaaafb9a0fb307943e
