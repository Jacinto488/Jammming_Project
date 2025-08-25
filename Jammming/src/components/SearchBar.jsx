import React from 'react';

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: ''
    };

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
  }

  handleSearch(event) {
    event.preventDefault();
    this.props.onSearch(this.state.searchTerm);
  }

  handleTermChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  render() {
    return (
      <div className="SearchBar">
        <input
          placeholder="Enter A Song, Album, or Artist"
          onChange={this.handleTermChange}
          value={this.state.searchTerm}
        />
        <button onClick={this.handleSearch}>SEARCH</button>
      </div>
    );
  }
}

export default SearchBar;