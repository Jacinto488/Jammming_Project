import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Playlist from './Playlist';
import Spotify from '../api/spotify';
import '../styles.css';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use a more robust useEffect to handle the initial authentication check.
  useEffect(() => {
  const authenticateUser = async () => {
    try {
      const token = await Spotify.getAccessTokenFromUrl();
      if (token) {
        setIsAuthenticated(true);
      } else {
        // Not authenticated → start the login flow
        Spotify.authenticate(); //  Redirect to Spotify login
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  authenticateUser();
}, []);

  // Function to handle the search.
  const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const results = await Spotify.search(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error during search:', error);
      // You could add a user-facing error message here.
    }
  };

  // Function to add a track from the search results to the playlist.
  const addTrack = (trackToAdd) => {
    const isInPlaylist = playlist.some(track => track.id === trackToAdd.id);
    if (!isInPlaylist) {
      setPlaylist(prevPlaylist => [...prevPlaylist, trackToAdd]);
    }
  };

  // Function to remove a track from the playlist.
  const removeTrack = (trackToRemove) => {
    const newPlaylist = playlist.filter(track => track.id !== trackToRemove.id);
    setPlaylist(newPlaylist);
  };

  // Function to save the playlist to a Spotify account.
  const savePlaylist = async () => {
    if (playlist.length === 0 || playlistName === 'My Playlist') {
      // Use a custom alert message box instead of the native `alert()`
      const message = "Playlist is empty or has a default name. Please add tracks and a name.";
      // In a real app, you would render a modal or message box component here.
      console.log(message);
      return;
    }

    setIsSaving(true);
    const trackUris = playlist.map(track => track.uri);
    try {
      await Spotify.savePlaylist(playlistName, trackUris);
      // Use a custom alert message box instead of the native `alert()`
      console.log("Playlist saved successfully!");
      setPlaylist([]);
      setPlaylistName('My Playlist');
    } catch (error) {
      console.error('Error saving playlist:', error);
      // Use a custom alert message box instead of the native `alert()`
      console.log("Failed to save playlist. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
     <div className="App">
      {/* Header section */}
      <header className="App-header">
        <h1>Jammming</h1>
      </header>

      {/* Search Bar component */}
      <div className="App-search">
        <div className="Search-bar">
          <input
            type="text"
            className="App-search-input"
            placeholder="Enter a song, artist, or album"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button
            className="App-search-button"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {/* Main content area: Search Results and Playlist */}
      <div className="App-content">
        {/* Search Results component */}
        <div className="App-search">
          <h2>Results</h2>
          <div className="Track-list">
            {searchResults.length > 0 ? (
              searchResults.map(track => (
                <div key={track.id} className="Track">
                  <div className="Track-information">
                    <h3 className="Track-name">{track.name}</h3>
                    <p className="Track-artist">{track.artist} | <span className="Track-album">{track.album}</span></p>
                  </div>
                  <button
                    className="Track-action-button"
                    onClick={() => addTrack(track)}
                  >
                    +
                  </button>
                </div>
              ))
            ) : (
              <p>Start your search to see results here.</p>
            )}
          </div>
        </div>

        {/* Playlist component */}
        <div className="App-playlist">
          <div className="Playlist-container">
            <input
              type="text"
              className="Playlist-name-input"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <div className="Track-list">
              {playlist.length > 0 ? (
                playlist.map(track => (
                  <div key={track.id} className="Track">
                    <div className="Track-information">
                      <h3 className="Track-name">{track.name}</h3>
                      <p className="Track-artist">{track.artist} | <span className="Track-album">{track.album}</span></p>
                    </div>
                    <button
                      className="Track-action-button-remove"
                      onClick={() => removeTrack(track)}
                    >
                      -
                    </button>
                  </div>
                ))
              ) : (
                <p>Add tracks to your playlist here.</p>
              )}
            </div>
            <button
              className="App-save-button"
              onClick={savePlaylist}
            >
              Save to Spotify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;