const express = require('express');
const axios = require('axios');
const cors = require('cors');
const qs = require('querystring');

const app = express();
app.use(cors());
app.use(express.json());

const clientId = 'a018e8b9d0d547aebb6ad62e885422cf';
const clientSecret = '4d22f801de074f478e952df4eac2f60e';
const redirectUri = 'http://127.0.0.1:3000/callback';

let refreshToken = ''; // will store it after login

// 1️⃣ User clicks Login → redirect to Spotify
app.get('/login', (req, res) => {
  const scope = 'user-read-currently-playing user-read-playback-state user-read-recently-played';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    qs.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
    });

  res.redirect(authUrl);
});

// 2️⃣ Spotify calls back → exchange code for tokens
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    });

    const accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token; // Save refresh token

    res.send('✅ Success! You can now close this window and the site will start working.');
    console.log('Tokens:', response.data);

  } catch (err) {
    console.error(err.response.data);
    res.send('Error during token exchange');
  }
});

// 3️⃣ Frontend calls this → backend uses refresh token → calls Spotify API → returns track info
app.get('/currently-playing', async (req, res) => {
  try {
    // Refresh access token
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Call Spotify Currently Playing API
    const trackResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json(trackResponse.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error getting currently playing track');
  }
});

// 4️⃣ Frontend calls this → backend returns LAST PLAYED track
app.get('/last-played', async (req, res) => {
  try {
    // Refresh access token
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Call Spotify Recently Played API (limit 1 = last played track)
    const trackResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json(trackResponse.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error getting last played track');
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://127.0.0.1:3000');
});
