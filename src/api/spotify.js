// Spotify API Utility File

const clientId = '2705a4b7eb204711b4a7a8ea1d22a1e0'; // Replace with your Spotify client ID
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

    if (!result.ok) {
      console.error("Spotify token request failed:", data);
      return null;
    }

    const { access_token, expires_in } = data;

    if (!access_token) {
      console.error("No access_token returned from Spotify:", data);
      return null;
    }

    localStorage.setItem('access_token', access_token);
    localStorage.removeItem('verifier');

    // Remove the `code` and `state` parameters from the URL after success
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.pushState({}, document.title, url.toString());

    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

const parseSpotifyResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text); // try JSON
  } catch {
    return { error: text }; // fallback to plain text
  }
};

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
    return getAccessToken(code);
  }

  // ✅ Fallback: try to use stored token
  const storedToken = localStorage.getItem('access_token');
  if (storedToken) {
    return storedToken;
  }

  return null; // no code and no stored token → must re-authenticate
},


  // Fetches a user's profile
  getProfile: async (accessToken) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const data = await parseSpotifyResponse(response);

      if (!response.ok) {
        console.error("Spotify profile error:", data);
        throw new Error(`Profile request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // Searches for tracks
  search: async (term) => {
    const accessToken = await Spotify.getAccessTokenFromUrl();
    console.log("Using access token:", accessToken);

    if (!accessToken) {
      console.error('Access token is missing.');
      throw new Error('Access token is missing'); // now throws, triggers redirect
    }

    if (!response.ok) {
      const data = await parseSpotifyResponse(response);
      console.error("Spotify search error:", data);
      throw new Error(`${response.status} - Search request failed`);
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await parseSpotifyResponse(response);

      if (!response.ok) {
        console.error("Spotify search error:", data);
        throw new Error(`Search request failed: ${response.status}`);
      }

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
    const accessToken = await Spotify.getAccessTokenFromUrl();
    if (!accessToken) {
      console.error("Unable to get a valid access token.");
      return;
    }

    try {
      // Fetch profile to get user ID
      const profile = await Spotify.getProfile(accessToken);
      if (!profile) {
        console.error("Could not fetch user profile");
        return;
      }
      const userId = profile.id;

      // Create a new playlist
      const createResponse = await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, public: false })
        }
      );

      const playlistData = await parseSpotifyResponse(createResponse);
      if (!createResponse.ok) {
        console.error("Spotify create playlist error:", playlistData);
        throw new Error(`Create playlist failed: ${createResponse.status}`);
      }

      const playlistId = playlistData.id;

      // Add tracks to the playlist
      const addResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: trackUris })
        }
      );

      const addData = await parseSpotifyResponse(addResponse);
      if (!addResponse.ok) {
        console.error("Spotify add tracks error:", addData);
        throw new Error(`Add tracks failed: ${addResponse.status}`);
      }

      console.log('Playlist saved successfully!');
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  }
};

export default Spotify;
