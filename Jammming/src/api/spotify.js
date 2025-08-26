const Spotify = {
  clientId : '2705a4b7eb204711b4a7a8ea1d22a1e0',
  redirectUri : 'https://jacinto488.github.io/Jammming_Project/',
  AUTH_ENDPOINT : 'https://accounts.spotify.com/authorize',
  accessToken: '',

   // Method to get the Spotify access token.
  // It first checks if the token is already available in the session.
  // If not, it checks the URL hash for a new token from a redirect.
  // If no token is found, it redirects the user to the Spotify authorization page.
  getAccessToken() {
    // If we already have a token, return it immediately.
    if (this.accessToken) {
      return this.accessToken;
    }

    // Check for access token in the URL hash.
    const accessTokenMatch = window.location.hash.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.hash.match(/expires_in=([^&]*)/);

    // If an access token and expiration time are found in the URL.
    if (accessTokenMatch && expiresInMatch) {
      this.accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);

      // Set a timeout to clear the access token when it expires.
      // This forces a new token to be requested.
      window.setTimeout(() => this.accessToken = '', expiresIn * 1000);
      // Clear the URL to hide the token from the browser history.
      window.history.pushState('Access Token', null, this.redirectUri);
      return this.accessToken;
    } else {
      // If no access token is found in the URL or in memory,
      // redirect the user to the Spotify authorization page.
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&scope=playlist-modify-public%20playlist-modify-private&redirect_uri=${this.redirectUri}`;
      window.location = accessUrl;
    }
  },

  search(term) {
    const accessToken = this.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(jsonResponse => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri,
        }));
      });
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      return;
    }

    const accessToken = this.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    return fetch('https://api.spotify.com/v1/me', { headers: headers })
      .then(response => response.json())
      .then(jsonResponse => {
        userId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ name: name }),
        });
      })
      .then(response => response.json())
      .then(jsonResponse => {
        const playlistId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackUris }),
        });
      });
  },
};

export default Spotify;