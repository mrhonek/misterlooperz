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

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!playerRef.current) return 0;
    try {
      // @ts-ignore
      const duration = playerRef.current.getDuration();
      if (!duration) return 0;
      return (currentTime / duration) * 100;
    } catch {
      return 0;
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-xl bg-gray-800 border border-gray-700">
      <div className="relative">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          className="w-full"
        />
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-700 w-full">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
      </div>
      
      <div className="px-4 py-3 flex items-center justify-between player-controls">
        <div className="flex items-center space-x-3">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="text-white bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Pause"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button
            onClick={handleSeekToStart}
            className="text-white bg-gray-600 hover:bg-gray-700 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Back to Start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="text-sm text-gray-300">
            {formatTime(currentTime)}
            {endTime ? ` / ${formatTime(endTime || 0)}` : ''}
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-400">
          {startTime !== null && <span>Start: {formatTime(startTime)}</span>}
          {startTime !== null && endTime !== null && <span className="mx-2">|</span>}
          {endTime !== null && <span>End: {formatTime(endTime || 0)}</span>}
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer; 