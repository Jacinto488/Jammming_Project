import React from 'react';
import Track from './Track';

const SearchResults = ({ searchResults, onAdd }) => {
    return (
        <div className="SearchResults">
            <h2>Results</h2>
            {searchResults.length > 0 ? (
                <div>
                    {searchResults.map(track => (
                        <Track key={track.id} track={track} onAdd={onAdd} />
                    ))}
                </div>
            ) : (
                <p>No results found</p>
            )}
        </div>
    );
};

export default SearchResults;