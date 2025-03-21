import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import { formatTime } from '../utils/timeUtils';

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
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const effectiveStartTime = startTime || 0;

  // Configure player options
  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
      start: effectiveStartTime,
      // Don't set the end parameter as we want to handle looping ourselves
      enablejsapi: 1,
      origin: window.location.origin,
      modestbranding: 1,
      rel: 0,
    },
  };

  // Handle start time changes
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      try {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.seekTo(effectiveStartTime, true);
      } catch (err) {
        console.error('Failed to seek to time:', err);
      }
    }
  }, [effectiveStartTime]);

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
            
            // Check if we've reached or passed the end time
            if (currentTime >= endTime) {
              // @ts-ignore - Ignore TypeScript errors for YouTube API calls
              player.seekTo(effectiveStartTime, true);
              // Ensure video continues playing after seeking
              setTimeout(() => {
                try {
                  // @ts-ignore
                  player.playVideo();
                } catch (err) {
                  console.error('Failed to play video after seeking:', err);
                }
              }, 100);
            }
          }
        } catch (err) {
          console.error('Error checking video time:', err);
        }
      }, 500); // Check more frequently (every 500ms)
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime, effectiveStartTime, isPlaying]);

  // Effect to auto-play the video when the videoId changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playerRef.current) {
        try {
          // @ts-ignore
          playerRef.current.playVideo();
        } catch (err) {
          console.error('Failed to auto-play new video:', err);
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [videoId]);

  // Effect to update current time display
  useEffect(() => {
    if (timeUpdateRef.current) {
      clearInterval(timeUpdateRef.current);
    }

    if (isPlaying) {
      timeUpdateRef.current = setInterval(() => {
        try {
          if (playerRef.current) {
            // @ts-ignore
            const time = playerRef.current.getCurrentTime();
            setCurrentTime(time);
          }
        } catch (err) {
          console.error('Error updating time display:', err);
        }
      }, 1000);
    }

    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
    };
  }, [isPlaying]);

  // Event handlers
  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: YouTubeEvent) => {
    // Check player state and update isPlaying
    if (event.data === PLAYER_STATE.ENDED) {
      // When video ends naturally, loop back to start time if we have an end time set
      if (endTime) {
        try {
          // @ts-ignore
          event.target.seekTo(effectiveStartTime, true);
          // Restart playback after a short delay
          setTimeout(() => {
            try {
              // @ts-ignore
              event.target.playVideo();
              setIsPlaying(true);
            } catch (err) {
              console.error('Failed to restart video after end:', err);
            }
          }, 100);
        } catch (err) {
          console.error('Failed to seek to start time after end:', err);
        }
      } else {
        setIsPlaying(false);
        if (onEnd) {
          onEnd();
        }
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

  const handleSeekToStart = () => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.seekTo(effectiveStartTime, true);
      }
    } catch (err) {
      console.error('Failed to seek to start:', err);
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        className="w-full"
      />
      
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between bg-gray-700">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={`${isPlaying ? 'bg-red-500' : 'bg-blue-500'} text-white font-bold py-2 px-4 rounded`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={handleSeekToStart}
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Back to Start
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center text-white text-sm">
          <div className="mb-2 sm:mb-0 sm:mr-4">
            Current: {formatTime(currentTime)}
          </div>
          {startTime !== null && (
            <div className="mb-2 sm:mb-0 sm:mr-4">
              Start: {formatTime(startTime)}
            </div>
          )}
          {endTime !== null && (
            <div>
              End: {formatTime(endTime || 0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer; 