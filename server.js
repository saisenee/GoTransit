const express = require('express'); 
const path = require('path');

const app = express();
const PORT = 3000;
const apiKey = '30025820'; // my API key

// Serve static files from /public folder (useful when running Node locally, optional on Vercel).
app.use(express.static('public'))
// Define index.html as the root explicitly (useful on Vercel, optional when running Node locally).
app.get('/', (req, res) => { res.redirect('/index.html') })

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
