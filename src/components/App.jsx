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
          setIsAuthenticated(false);
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
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 flex flex-col items-center">
      <header className="w-full text-center py-8">
        <h1 className="text-6xl font-extrabold text-green-400 drop-shadow-md">Jammming</h1>
      </header>

      {/* Show a loading state while checking authentication */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          {/* Display the main content if authenticated */}
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-96">
              <p className="text-lg mb-4 text-center">Please connect to Spotify to begin.</p>
              <button
                className="p-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-md"
                onClick={() => Spotify.authenticate()}
              >
                Connect to Spotify
              </button>
            </div>
          ) : (
            <>
              {/* Search Bar component */}
              <div className="w-full max-w-4xl p-4 bg-gray-800 rounded-xl shadow-lg mb-8">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="text"
                    className="flex-grow p-3 rounded-lg border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
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
                    className="w-full sm:w-auto p-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-md"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Main content area: Search Results and Playlist */}
              <div className="flex flex-col md:flex-row w-full max-w-6xl gap-8">
                {/* Search Results component */}
                <div className="flex-1 bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h2 className="text-3xl font-bold mb-4 text-center text-green-400">Results</h2>
                  <div className="space-y-4">
                    {searchResults.length > 0 ? (
                      searchResults.map(track => (
                        <div key={track.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg shadow-inner transition-transform transform hover:scale-105">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                            <p className="text-sm text-gray-400">{track.artist} | {track.album}</p>
                          </div>
                          <button
                            className="p-2 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition-colors"
                            onClick={() => addTrack(track)}
                          >
                            +
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 mt-8">Start your search to see results here.</p>
                    )}
                  </div>
                </div>

                {/* Playlist component */}
                <div className="flex-1 bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      className="w-full p-3 mb-4 rounded-lg border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                    />
                    <div className="w-full space-y-4 mb-4">
                      {playlist.length > 0 ? (
                        playlist.map(track => (
                          <div key={track.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg shadow-inner transition-transform transform hover:scale-105">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                              <p className="text-sm text-gray-400">{track.artist} | {track.album}</p>
                            </div>
                            <button
                              className="p-2 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                              onClick={() => removeTrack(track)}
                            >
                              -
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 mt-8">Add tracks to your playlist here.</p>
                      )}
                    </div>
                    <button
                      className="w-full p-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-md disabled:bg-green-800"
                      onClick={savePlaylist}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save to Spotify'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;