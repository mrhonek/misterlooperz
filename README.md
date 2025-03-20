# MisterLooperz

A web application that allows users to loop specific sections of YouTube videos, create playlists, and play through them either sequentially or individually.

## Features

- Embed YouTube videos using the YouTube IFrame Player API
- Loop specific sections of videos by setting start and end times
- Create and manage playlists
- Play videos sequentially or individually
- Persistent playlist storage using LocalStorage
- Modern, responsive UI built with React and Tailwind CSS

## Tech Stack

- React.js with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- YouTube IFrame Player API
- LocalStorage for data persistence

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mrhonek/misterlooperz.git
cd misterlooperz
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Enter a YouTube URL in the input field
2. Optionally set start and end times in MM:SS format
3. Click "Add to Playlist" to add the video
4. Use the playlist controls to:
   - Play individual videos
   - Play through the entire playlist
   - Remove videos from the playlist

## Deployment

This project is configured for deployment on Railway. The frontend is served as a static site.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
