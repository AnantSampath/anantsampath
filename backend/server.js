require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors()); // So frontend can access this backend

let access_token = '';
let refresh_token = '';

app.get('/', (req, res) => {
  const authUrl = 'https://accounts.spotify.com/authorize?' + qs.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: 'user-read-currently-playing',
    redirect_uri: process.env.REDIRECT_URI
  });

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  }));

  access_token = tokenResponse.data.access_token;
  refresh_token = tokenResponse.data.refresh_token;

  res.send('✅ Authenticated! Now open /now-playing');
});

app.get('/now-playing', async (req, res) => {
  if (!access_token) return res.status(401).send('Unauthorized');

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      const refreshResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }));

      access_token = refreshResponse.data.access_token;
      return res.redirect('/now-playing');
    } else {
      res.status(500).send('Error fetching now playing');
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
