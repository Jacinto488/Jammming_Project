// Spotify API Utility File
const clientId = '2705a4b7eb204711b4a7a8ea1d22a1e0';
const redirectUri = "https://jacinto488.github.io/Jammming_Project/";
const authorizationUrl = "https://accounts.spotify.com/authorize";
const tokenUrl = "https://accounts.spotify.com/api/token";
const scope = [
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
  'ugc-image-upload'
].join(' ');

// --- Helper functions ---
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

const base64urlencode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Safe response parser
const parseSpotifyResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

// Exchange code for token
const getAccessToken = async (code) => {
  const verifier = localStorage.getItem('verifier');
  if (!verifier) {
    console.error("No PKCE verifier found in localStorage.");
    return null;
  }

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

    const data = await result.json();
    console.log("Token exchange response:", data);

    if (!result.ok || !data.access_token) {
      console.error("Spotify token request failed:", data);
      return null;
    }

    const { access_token, expires_in } = data;
    const expiryTime = Date.now() + expires_in * 1000; // expiration in ms
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('token_expiry', expiryTime);
    localStorage.removeItem('verifier');

    // Remove code/state from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, document.title, url.toString());

    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// --- Spotify object ---
const Spotify = {

  authenticate: async () => {
    console.log("Redirecting user to Spotify login...");
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
    params.append('show_dialog', 'true'); // force login every time

    window.location.href = `${authorizationUrl}?${params.toString()}`;
  },

  getAccessTokenFromUrl: async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) return getAccessToken(code);

    // Check localStorage for token
    const token = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('token_expiry');

    if (!token || !expiry || Date.now() > expiry) {
      console.log("Token missing or expired, redirecting to Spotify login...");
      Spotify.authenticate();
      return null;
    }

    return token;
  },

  getProfile: async (accessToken) => {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await parseSpotifyResponse(response);
    if (!response.ok) {
      console.error("Spotify profile error:", data);
      throw new Error(`${response.status} - Profile request failed`);
    }
    return data;
  },

  search: async (term) => {
    let accessToken = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('token_expiry');

    if (!accessToken || Date.now() > expiry) {
      console.log('Token missing or expired, redirecting to Spotify login...');
      Spotify.authenticate();
      return [];
    }

    const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await parseSpotifyResponse(response);
    if (!response.ok) {
      console.error("Spotify search error:", data);
      throw new Error(`${response.status} - Search request failed`);
    }

    return data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      uri: track.uri
    }));
  },

  savePlaylist: async (name, trackUris) => {
    let accessToken = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('token_expiry');

    if (!accessToken || Date.now() > expiry) {
      console.log('Token missing or expired, redirecting to Spotify login...');
      Spotify.authenticate();
      return [];
    }

    const profile = await Spotify.getProfile(accessToken);
    if (!profile) throw new Error("Could not fetch user profile");
    const userId = profile.id;

    // Create playlist
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, public: false })
    });
    const playlistData = await parseSpotifyResponse(createResponse);
    if (!createResponse.ok) {
      console.error("Spotify create playlist error:", playlistData);
      throw new Error(`${createResponse.status} - Create playlist failed`);
    }

    // Add tracks
    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: trackUris })
    });
    const addData = await parseSpotifyResponse(addResponse);
    if (!addResponse.ok) {
      console.error("Spotify add tracks error:", addData);
      throw new Error(`${addResponse.status} - Add tracks failed`);
    }

    console.log('Playlist saved successfully!');
  }
};

export default Spotify;
