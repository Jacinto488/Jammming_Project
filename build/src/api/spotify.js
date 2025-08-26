// Spotify API Utility File

const clientId = '2705a4b7eb204711b4a7a8ea1d22a1e0'; // Replace with your Spotify client ID
const redirectUri = "https://jacinto488.github.io/Jammming_Project";
const authorizationUrl = "https://accounts.spotify.com/authorize";
const tokenUrl = "https://accounts.spotify.com/api/token";
const scope = [
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
  'ugc-image-upload'
].join(' ');

// Generates a random string to use for state and code verifier
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Hashes the code verifier to create the code challenge
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Converts a hash to a Base64URL-encoded string
const base64urlencode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const getAccessToken = async (code) => {
  const verifier = localStorage.getItem('verifier');
  if (!verifier) return null;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("code_verifier", verifier);

  try {
    const result = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const { access_token, expires_in } = await result.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('expires_in', Date.now() + expires_in * 1000);
    localStorage.removeItem('verifier');
    
    // --- THIS IS THE KEY CHANGE ---
    // Remove the `code` and `state` parameters from the URL after getting the token.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.pushState({}, document.title, url.toString());
    // ----------------------------

    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

const Spotify = {
  // Initiates the PKCE authentication flow
  authenticate: async () => {
    const verifier = generateRandomString(128);
    const challenge = await sha256(verifier);
    const code_challenge = base64urlencode(challenge);

    localStorage.setItem('verifier', verifier);

    const params = new URLSearchParams();
    params.append('response_type', 'code');
    params.append('client_id', clientId);
    params.append('scope', scope);
    params.append('redirect_uri', redirectUri);
    params.append('state', generateRandomString(16));
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', code_challenge);

    window.location.href = `${authorizationUrl}?${params.toString()}`;
  },

  // Retrieves the access token from the URL if a code is present
  getAccessTokenFromUrl: async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // The redirect URL is now the root, so we handle the code here.
      return getAccessToken(code);
    }
    
    // Check for an existing token in local storage
    const storedToken = localStorage.getItem('access_token');
    const expiresIn = localStorage.getItem('expires_in');
    if (storedToken && Date.now() < expiresIn) {
      return storedToken;
    }
    
    return null;
  },

  // Fetches a user's profile
  getProfile: async (accessToken) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // Searches for tracks
  search: async (term) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error('Access token is missing.');
      return [];
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      return data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        uri: track.uri
      }));
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  },

  // Saves a playlist
  savePlaylist: async (name, trackUris) => {
    const accessToken = localStorage.getItem('access_token');
    const profile = await Spotify.getProfile(accessToken);
    const userId = profile.id;

    if (!accessToken || !userId) {
      console.error('Access token or user ID is missing.');
      return;
    }

    try {
      // Create a new playlist
      const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, public: false })
      });
      const playlist = await createPlaylistResponse.json();
      const playlistId = playlist.id;

      // Add tracks to the new playlist
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });

      console.log('Playlist saved successfully!');
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  }
};

export default Spotify;
