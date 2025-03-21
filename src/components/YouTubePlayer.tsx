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
  autoPlayEnabled?: boolean;
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
  autoPlayEnabled = false
}) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const effectiveStartTime = startTime || 0;
  const isMobile = window.innerWidth <= 768;

  // Configure player options - improved for mobile
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1, // Try autoplay by default
      playsinline: 1, // Essential for iOS
      controls: 1,
      start: effectiveStartTime,
      enablejsapi: 1,
      origin: window.location.origin,
      modestbranding: 1,
      rel: 0,
      fs: 1, // Allow fullscreen
      mute: isMobile ? 1 : 0, // Start muted on mobile (helps with autoplay)
    },
  };

  // Force player to play when mounted on mobile
  useEffect(() => {
    const handlePlay = () => {
      try {
        if (playerRef.current) {
          // @ts-ignore
          playerRef.current.playVideo();
          
          if (isMobile) {
            // For mobile, try to unmute after starting playback
            setTimeout(() => {
              try {
                // @ts-ignore
                playerRef.current?.unMute();
                // @ts-ignore
                playerRef.current?.setVolume(100);
              } catch (err) {
                console.error('Failed to unmute after autoplay:', err);
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Failed to auto-play video:', err);
      }
    };

    // Try playing when component mounts
    const timer = setTimeout(handlePlay, 1000);
    
    return () => clearTimeout(timer);
  }, [videoId, isMobile]);

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

    // Set up interval if we have an end time and player is playing
    if (endTime && isPlaying) {
      intervalRef.current = setInterval(() => {
        try {
          const player = playerRef.current;
          if (player) {
            // @ts-ignore - Ignore TypeScript errors for YouTube API calls
            const currentTime = player.getCurrentTime();
            
            // Check if we've reached or passed the end time
            if (currentTime >= endTime) {
              if (autoPlayEnabled) {
                // In auto-play mode, trigger onEnd to go to next video
                if (onEnd) {
                  onEnd();
                }
              } else {
                // In loop mode, loop back to start time
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
  }, [endTime, effectiveStartTime, isPlaying, onEnd, autoPlayEnabled]);

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
    // Clear any previous errors
    setPlayerError(null);
    
    // Force play on mobile devices
    if (isMobile) {
      try {
        event.target.playVideo();
      } catch (err) {
        console.error('Failed to play on ready:', err);
      }
    }
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
  
  const onPlayerError = (event: { data: number }) => {
    // Handle player errors
    setPlayerError(`Video playback error: ${event.data}`);
    console.error(`YouTube player error: ${event.data}`);
    
    // Retry loading the video after a short delay
    setTimeout(() => {
      try {
        if (playerRef.current) {
          // @ts-ignore
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: effectiveStartTime,
          });
        }
      } catch (err) {
        console.error('Failed to reload video after error:', err);
      }
    }, 3000);
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
    position: 'relative',
    marginBottom: '10px',
    paddingBottom: '56.25%', // 16:9 aspect ratio for container (use paddingBottom instead of paddingTop)
    height: 0, // Important: Set height to 0 for proper aspect ratio
    backgroundColor: '#000'
  };

  const playerWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#2d3748',
    borderRadius: '5px',
    marginBottom: '20px'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4a5568',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isMobile ? '80px' : '100px'
  };

  const timeDisplayStyle: React.CSSProperties = {
    color: '#ccc',
    fontSize: '14px'
  };

  const errorMessageStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    zIndex: 10,
    display: playerError ? 'block' : 'none'
  };

  return (
    <div>
      <div style={containerStyle}>
        <div style={playerWrapperStyle}>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            onError={onPlayerError}
            className="youtube-player"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
          {playerError && (
            <div style={errorMessageStyle}>
              {playerError}. Retrying...
            </div>
          )}
        </div>
      </div>
      
      <div style={controlsStyle}>
        <div style={buttonGroupStyle}>
          {isPlaying ? (
            <button style={{...buttonStyle, backgroundColor: '#e53e3e'}} onClick={handlePause}>
              ⏸️ Pause
            </button>
          ) : (
            <button style={{...buttonStyle, backgroundColor: '#38a169'}} onClick={handlePlay}>
              ▶️ Play
            </button>
          )}
          <button style={buttonStyle} onClick={handleSeekToStart}>
            ⏮️ Restart
          </button>
        </div>
        <div style={timeDisplayStyle}>
          {formatTime(currentTime)} {endTime ? `/ ${formatTime(endTime)}` : ''}
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer; 