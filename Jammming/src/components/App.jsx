import React, { useState } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Playlist from './Playlist';
import Spotify from '../api/spotify';

const App = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [playlist, setPlaylist] = useState([]);

    const addTrackToPlaylist = (track) => {
        setPlaylist(prevPlaylist => [...prevPlaylist, track]);
    };

    const removeTrackFromPlaylist = (track) => {
        setPlaylist(prevPlaylist => prevPlaylist.filter(t => t.id !== track.id));
    };

    const searchTracks = async (term) => {
        const results = await Spotify.search(term);
        setSearchResults(results);
    };

    return (
        <div>
            <h1>Jammming</h1>
            <SearchBar onSearch={searchTracks} />
            <p>SearchBar is rendering!</p>
            <SearchResults 
                searchResults={searchResults} 
                onAdd={addTrackToPlaylist} 
            />
            <Playlist 
                playlist={playlist} 
                onRemove={removeTrackFromPlaylist} 
            />
        </div>
    );
};

export default App;