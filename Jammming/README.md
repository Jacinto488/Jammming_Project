# Jammming

Jammming is a web application that allows users to search for songs, create playlists, and manage their music library using the Spotify API. This project is built with React and provides a user-friendly interface for music enthusiasts.

## Technologies Used

- React
- Spotify API
- JavaScript
- HTML
- CSS

## Features

- Search for songs using the Spotify API.
- View search results and add tracks to a playlist.
- Manage and export playlists to the user's Spotify account.
- Responsive design for a seamless user experience.

## Getting Started

To get a local copy up and running, follow these simple steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Jammming.git
   ```

2. Navigate to the project directory:
   ```
   cd Jammming
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your Spotify API credentials:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_client_id
   REACT_APP_SPOTIFY_REDIRECT_URI=your_redirect_uri
   ```

5. Start the development server:
   ```
   npm start
   ```

## Deployment

To deploy the application, run the following command:
```
sh deploy.sh
```

## Future Work

- Implement user authentication to allow users to log in with their Spotify accounts.
- Enhance the UI with additional styling and animations.
- Add more features such as song previews and album details.

## Acknowledgments

- Special thanks to the Spotify API documentation for providing the necessary resources to integrate music search functionality.