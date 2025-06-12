async function getCurrentlyPlayingTrack() {
  try {
    const response = await fetch('http://127.0.0.1:3000/currently-playing');
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    const track = data.item;

    if (!track) {
      console.log('No track playing — fetching last played track...');
      getLastPlayedTrack(); // fallback to last played
      return;
    }

    const albumImage = track.album.images[0].url || '';
    const trackName = track.name || 'Unknown';
    const artists = track.artists.map(artist => artist.name).join(', ') || 'Unknown Artist';
    const trackUrl = track.external_urls.spotify || '#';

    const html = `
      <img src="${albumImage}" width="100" style="border-radius:8px; display:block; margin-bottom:10px;" /><br/>
      <strong>${trackName}</strong><br/>
      by ${artists}<br/>
      <a href="${trackUrl}" target="_blank" style="color:#1DB954; text-decoration:none;">Open in Spotify (Currently Playing)</a>
    `;

    document.getElementById('spotify-player').innerHTML = html;

  } catch (error) {
    console.error('Error fetching currently playing track:', error);
    document.getElementById('spotify-player').innerHTML = '<p>Error fetching track.</p>';
  }
}

async function getLastPlayedTrack() {
  try {
    const response = await fetch('http://127.0.0.1:3000/last-played');
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    const track = data.items[0].track;

    const albumImage = track.album.images[0].url || '';
    const trackName = track.name || 'Unknown';
    const artists = track.artists.map(artist => artist.name).join(', ') || 'Unknown Artist';
    const trackUrl = track.external_urls.spotify || '#';

    const html = `
      <img src="${albumImage}" width="100" style="border-radius:8px; display:block; margin-bottom:10px;" /><br/>
      <strong>${trackName}</strong><br/>
      by ${artists}<br/>
      <a href="${trackUrl}" target="_blank" style="color:#1DB954; text-decoration:none;">Open in Spotify (Last Played)</a>
    `;

    document.getElementById('spotify-player').innerHTML = html;

  } catch (error) {
    console.error('Error fetching last played track:', error);
    document.getElementById('spotify-player').innerHTML = '<p>Error fetching last played track.</p>';
  }
}

// Auto-refresh every 10s
setInterval(getCurrentlyPlayingTrack, 10000);

// Initial call
getCurrentlyPlayingTrack();
