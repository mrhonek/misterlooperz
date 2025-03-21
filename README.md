# MisterLooperz

A web application that allows users to loop specific sections of YouTube videos, create playlists, and play through them either sequentially or individually.

## Features

- Embed YouTube videos using the YouTube IFrame Player API
- Optional video section looping with customizable start and end times
- Dynamic time input fields with flexible M:SS format
- Automatic video looping when end time is set
- Create and manage playlists with individual video controls
- Play videos sequentially or individually from any point in the playlist
- Persistent playlist storage using LocalStorage
- Clean, responsive UI with inline CSS styling

## Tech Stack

- React.js with TypeScript
- Vite for build tooling
- Inline CSS for styling
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
2. Optionally set start and end times in M:SS format (e.g., "1:30" for 1 minute and 30 seconds)
   - Leave time fields empty to play the full video
   - Set only start time to begin from a specific point
   - Set both times to loop a specific section
3. Click "Add to Playlist" to add the video
4. Use the playlist controls to:
   - Play individual videos from the playlist
   - Modify start and end times for each video
   - Remove videos from the playlist
   - Videos will automatically loop between start and end times when set

## Deployment

This project is configured for deployment on Railway. The frontend is served as a static site.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
