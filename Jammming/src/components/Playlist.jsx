import React from 'react';

const Playlist = ({ playlist, onRemoveTrack, onSave }) => {
    const handleRemoveTrack = (track) => {
        onRemoveTrack(track);
    };

    const handleSave = () => {
        onSave(playlist);
    };

    return (
        <div className="playlist">
            <h2>Your Playlist</h2>
            <ul>
                {playlist.tracks.map((track) => (
                    <li key={track.id}>
                        <span>{track.name} - {track.artist}</span>
                        <button onClick={() => handleRemoveTrack(track)}>Remove</button>
                    </li>
                ))}
            </ul>
            <button onClick={handleSave}>Save to Spotify</button>
        </div>
    );
};

export default Playlist;