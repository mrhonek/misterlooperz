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
    height: '100%',
    width: '100%',
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

  const containerStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #444',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '20px'
  };

  const playerContainerStyle: React.CSSProperties = {
    width: '100%',
    position: 'relative',
    paddingTop: '56.25%' // 16:9 aspect ratio
  };

  const youtubeContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  };

  const controlsStyle: React.CSSProperties = {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#333',
    color: 'white'
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    width: '100%'
  };

  const playButtonStyle: React.CSSProperties = {
    backgroundColor: isPlaying ? '#e53e3e' : '#3182ce',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const backButtonStyle: React.CSSProperties = {
    backgroundColor: '#4a5568',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const timeDisplayStyle: React.CSSProperties = {
    fontSize: '14px',
    marginTop: '5px',
    display: 'flex',
    gap: '15px'
  };

  return (
    <div style={containerStyle}>
      <div style={playerContainerStyle}>
        <div style={youtubeContainerStyle}>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            style={{ width: '100%', height: '100%' }}
            className="youtube-player"
          />
        </div>
      </div>
      
      <div style={controlsStyle}>
        <div style={buttonRowStyle}>
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            style={playButtonStyle}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={handleSeekToStart}
            style={backButtonStyle}
          >
            Back to Start
          </button>
        </div>
        
        <div style={timeDisplayStyle}>
          <div>Current: {formatTime(currentTime)}</div>
          {startTime !== null && <div>Start: {formatTime(startTime)}</div>}
          {endTime !== null && <div>End: {formatTime(endTime || 0)}</div>}
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer; 