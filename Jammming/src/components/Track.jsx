import React from 'react';

const Track = ({ track, onAdd, onRemove, isRemoval }) => {
    const handleClick = () => {
        if (isRemoval) {
            onRemove(track);
        } else {
            onAdd(track);
        }
    };

    return (
        <div className="Track">
            <div className="Track-information">
                <h3>{track.name}</h3>
                <p>{track.artists.map(artist => artist.name).join(', ')}</p>
                <p>{track.album.name}</p>
            </div>
            <button className="Track-action" onClick={handleClick}>
                {isRemoval ? '-' : '+'}
            </button>
        </div>
    );
};

export default Track;