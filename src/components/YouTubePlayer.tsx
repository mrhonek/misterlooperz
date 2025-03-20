import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';

// Define player state constants to avoid using window.YT directly
const PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2
};

interface YouTubePlayerProps {
  videoId: string;
  startTime?: number | null;
  endTime?: number | null;
  onEnd?: () => void;
}

// Define YouTube event interface
interface YouTubeEvent {
  target: any;
  data: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  startTime = 0,
  endTime,
  onEnd,
}) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configure player options
  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
      start: startTime || 0,
      end: endTime || undefined,
    },
  };

  // Handle start time changes
  useEffect(() => {
    const player = playerRef.current;
    if (player && startTime !== null) {
      try {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.seekTo(startTime || 0, true);
      } catch (err) {
        console.error('Failed to seek to time:', err);
      }
    }
  }, [startTime]);

  // Set up the looping interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up the interval if we have an end time and the player is playing
    if (endTime && isPlaying) {
      intervalRef.current = setInterval(() => {
        try {
          const player = playerRef.current;
          if (player) {
            // @ts-ignore - Ignore TypeScript errors for YouTube API calls
            const currentTime = player.getCurrentTime();
            if (currentTime >= endTime) {
              // @ts-ignore - Ignore TypeScript errors for YouTube API calls
              player.seekTo(startTime || 0, true);
            }
          }
        } catch (err) {
          console.error('Error checking video time:', err);
        }
      }, 1000); // Check every second
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime, startTime, isPlaying]);

  // Event handlers
  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: YouTubeEvent) => {
    // Check player state and update isPlaying
    if (event.data === PLAYER_STATE.ENDED) {
      setIsPlaying(false);
      if (onEnd) {
        onEnd();
      }
    } else if (event.data === PLAYER_STATE.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === PLAYER_STATE.PAUSED) {
      setIsPlaying(false);
    }
  };

  // Handlers for play/pause buttons
  const handlePlay = () => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.playVideo();
      }
    } catch (err) {
      console.error('Failed to play video:', err);
    }
  };

  const handlePause = () => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.pauseVideo();
      }
    } catch (err) {
      console.error('Failed to pause video:', err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        className="rounded-lg shadow-lg"
      />
      <div className="mt-4 space-x-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Play
        </button>
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayer; 