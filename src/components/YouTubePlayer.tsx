import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
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

// Using memo to prevent unnecessary re-renders
const YouTubePlayer: React.FC<YouTubePlayerProps> = memo(({
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
  const effectiveStartTime = startTime || 0;
  
  // Track time when window focus changes
  const lastRecordedPlaybackTimeRef = useRef<number | null>(null);
  
  // Store player state for orientation changes
  const playerStateRef = useRef({
    currentTime: effectiveStartTime,
    isPlaying: false,
    pendingOrientationChange: false
  });
  
  // Keep track of initial player load
  const initialLoadRef = useRef(true);
  
  // Device detection - only calculate once
  const isMobile = useRef(window.innerWidth <= 768);
  
  // Added debug logs
  console.log('YouTubePlayer rendering with props:', {
    videoId,
    startTime,
    effectiveStartTime,
    endTime,
    autoPlayEnabled
  });
  
  // Save player state when orientation changes
  useEffect(() => {
    // Save current playback state before orientation change
    const handleBeforeOrientationChange = () => {
      if (playerRef.current && !playerStateRef.current.pendingOrientationChange) {
        try {
          // @ts-ignore
          const currentTime = playerRef.current.getCurrentTime();
          // @ts-ignore
          const isPlaying = playerRef.current.getPlayerState() === PLAYER_STATE.PLAYING;
          
          // Store the values
          playerStateRef.current = {
            currentTime,
            isPlaying,
            pendingOrientationChange: true
          };
          
          console.log('Orientation change detected - saved state:', 
            { time: currentTime, playing: isPlaying });
        } catch (err) {
          console.error('Failed to save state before orientation change:', err);
        }
      }
    };
    
    // Listen for both orientation change events
    window.addEventListener('orientationchange', handleBeforeOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleBeforeOrientationChange);
    };
  }, []);
  
  // Configure player options
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      playsinline: 1, // Essential for iOS
      controls: 1,
      start: Math.floor(effectiveStartTime),
      enablejsapi: 1,
      origin: window.location.origin,
      modestbranding: 1,
      rel: 0,
      fs: 1,
      mute: isMobile.current ? 1 : 0,
    },
  };
  
  // Add CSS to ensure the iframe fills the container
  useEffect(() => {
    // Create style element for the YouTube player iframe
    const style = document.createElement('style');
    style.innerHTML = `
      .youtube-player {
        position: absolute;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
      }
      .youtube-player iframe {
        width: 100% !important;
        height: 100% !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update player when startTime or endTime props change
  useEffect(() => {
    // Don't seek if we don't have a player yet or we're handling orientation change
    if (!playerRef.current || playerStateRef.current.pendingOrientationChange) {
      console.log('YouTubePlayer - Player not ready or orientation change in progress, skipping seek');
      return;
    }
    
    console.log('YouTubePlayer - Start time changed to:', effectiveStartTime);
    
    try {
      // Force reload the video to respect start time - this is the most reliable way
      if (playerRef.current && 'loadVideoById' in playerRef.current) {
        console.log('YouTubePlayer - Reloading video with start time:', effectiveStartTime);
        // @ts-ignore
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: effectiveStartTime
        });
      } else {
        // @ts-ignore
        playerRef.current.seekTo(effectiveStartTime, true);
        console.log('YouTubePlayer - Fallback: seekTo used instead of reload');
      }
    } catch (err) {
      console.error('YouTubePlayer - Error handling start time change:', err);
    }
  }, [videoId, effectiveStartTime]); // React to both videoId and effectiveStartTime changes
  
  // Also update when endTime changes
  useEffect(() => {
    if (playerRef.current && typeof endTime === 'number') {
      console.log('YouTubePlayer - End time updated to:', endTime);
    }
  }, [endTime]);

  // Update player state ref with current values (so we can access them in orientation change)
  useEffect(() => {
    playerStateRef.current.currentTime = currentTime;
    playerStateRef.current.isPlaying = isPlaying;
  }, [currentTime, isPlaying]);

  // Create a focused visibility change handler for the YouTube player
  useEffect(() => {
    // Save playlist state data to localStorage to make it persist
    const savePlaybackStateToStorage = () => {
      try {
        if (playerRef.current && autoPlayEnabled && isPlaying) {
          // @ts-ignore
          const currentVideoTime = playerRef.current.getCurrentTime() || 0;
          
          // Calculate expected duration for this video segment
          const segmentDuration = endTime ? (endTime - currentVideoTime) : null;
          
          // Store current information for when focus is regained
          const playbackState = {
            videoId,
            startedAt: Date.now(),
            currentVideoTime,
            segmentDuration,
            timestamp: Date.now()
          };
          
          // Save to localStorage so it persists across tab/window changes
          localStorage.setItem('misterlooperz_playback_state', JSON.stringify(playbackState));
        }
      } catch (error) {
        console.error('Error saving playback state:', error);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible');
        
        // Check if we need to advance videos based on elapsed time
        try {
          if (autoPlayEnabled) {
            const storedStateStr = localStorage.getItem('misterlooperz_playback_state');
            if (storedStateStr) {
              const storedState = JSON.parse(storedStateStr);
              
              // Only process if it's the same video and auto play is enabled
              if (storedState.videoId === videoId && autoPlayEnabled) {
                // Calculate elapsed time since visibility state was stored
                const elapsedSeconds = (Date.now() - storedState.startedAt) / 1000;
                console.log('Elapsed time since tab lost focus:', elapsedSeconds, 'seconds');
                
                // If we have a segment duration and enough time has passed
                if (storedState.segmentDuration && elapsedSeconds > storedState.segmentDuration) {
                  console.log('Auto play: Enough time has passed, advancing to next video');
                  
                  // Calculate how many videos should have played during this time
                  // For now, we'll just advance by one, but this could be enhanced to advance multiple videos
                  if (onEnd) {
                    // Small delay to make sure everything is ready
                    setTimeout(() => {
                      onEnd();
                    }, 100);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stored playback state:', error);
        }
      
        // Resume playback if it was playing before
        if (isPlaying && playerRef.current) {
          try {
            // @ts-ignore
            playerRef.current.playVideo();
          } catch (err) {
            console.error('Error resuming playback after visibility change:', err);
          }
        }
      } else if (document.visibilityState === 'hidden') {
        console.log('Page became hidden');
        
        // Save current playback state for when focus returns
        savePlaybackStateToStorage();
      }
    };
    
    // When auto play is toggled, update the stored state
    if (autoPlayEnabled && isPlaying && playerRef.current) {
      savePlaybackStateToStorage();
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, autoPlayEnabled, endTime, onEnd, videoId]);
  
  // Handle page unload to save state before the page closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (playerRef.current && autoPlayEnabled && isPlaying) {
          // @ts-ignore
          const currentVideoTime = playerRef.current.getCurrentTime() || 0;
          
          // Calculate expected duration for this video segment
          const segmentDuration = endTime ? (endTime - currentVideoTime) : null;
          
          // Store current information for when the page is reopened
          const playbackState = {
            videoId,
            startedAt: Date.now(),
            currentVideoTime,
            segmentDuration,
            timestamp: Date.now()
          };
          
          // Save to localStorage so it persists even if the page is closed
          localStorage.setItem('misterlooperz_playback_state', JSON.stringify(playbackState));
        }
      } catch (error) {
        // Ignore errors during page unload
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoId, autoPlayEnabled, isPlaying, endTime]);

  // Add back the time update interval and check for auto play
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying) {
      // Use a less frequent interval to reduce performance impact
      intervalRef.current = setInterval(() => {
        try {
          if (playerRef.current) {
            // @ts-ignore
            const time = playerRef.current.getCurrentTime();
            setCurrentTime(time);
            lastRecordedPlaybackTimeRef.current = time;
            
            // Check if we need to advance to the next video (end time reached)
            if (autoPlayEnabled && endTime && time >= endTime) {
              console.log('Time update: End time reached, advancing to next video');
              if (onEnd) {
                onEnd();
              }
            } else if (!autoPlayEnabled && endTime && time >= endTime) {
              // In loop mode, loop back to start time
              console.log('Time update: End time reached, looping back to start');
              // @ts-ignore
              playerRef.current.seekTo(effectiveStartTime, true);
            }
          }
        } catch (err) {
          console.error('Error in player interval:', err);
        }
      }, 1000); // Check once per second
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, autoPlayEnabled, endTime, effectiveStartTime, onEnd]);
  
  // Event handlers
  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    // Clear any previous errors
    setPlayerError(null);
    
    // If we have a pending orientation change, restore the state
    if (playerStateRef.current.pendingOrientationChange) {
      try {
        console.log('Restoring state after orientation change:', 
          { time: playerStateRef.current.currentTime, playing: playerStateRef.current.isPlaying });
        
        // Seek to the saved position
        event.target.seekTo(playerStateRef.current.currentTime, true);
        
        // Restore play state after a short delay
        setTimeout(() => {
          try {
            if (playerStateRef.current.isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          } catch (err) {
            console.error('Error restoring play state:', err);
          }
          
          // Reset the orientation change flag
          playerStateRef.current.pendingOrientationChange = false;
        }, 500);
      } catch (err) {
        console.error('Failed to restore state after orientation change:', err);
        playerStateRef.current.pendingOrientationChange = false;
      }
    } 
    // Handle initial load
    else if (initialLoadRef.current) {
      // For mobile, try to unmute after starting playback
      if (isMobile.current) {
        setTimeout(() => {
          try {
            // @ts-ignore
            event.target.unMute();
            // @ts-ignore
            event.target.setVolume(100);
          } catch (err) {
            console.error('Failed to unmute after autoplay:', err);
          }
        }, 1000);
      }
      
      initialLoadRef.current = false;
      
      // Start at beginning for initial load
      event.target.seekTo(effectiveStartTime, true);
    }
  };

  const onStateChange = (event: YouTubeEvent) => {
    // Check player state and update isPlaying
    if (event.data === PLAYER_STATE.ENDED) {
      if (autoPlayEnabled && onEnd) {
        // If auto play is enabled, move to next video
        onEnd();
      } else if (!autoPlayEnabled) {
        // When not in autoplay mode and video ends, loop back to start
        try {
          // @ts-ignore
          event.target.seekTo(effectiveStartTime, true);
          // Ensure playback continues
          // @ts-ignore
          event.target.playVideo();
        } catch (err) {
          console.error('Error looping video after end:', err);
        }
      } else {
        // Only mark as not playing if we don't have a custom end time 
        // (since our interval will handle the loop)
        setIsPlaying(false);
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
  const handlePlay = useCallback(() => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.playVideo();
      }
    } catch (err) {
      console.error('Failed to play video:', err);
    }
  }, []);

  const handlePause = useCallback(() => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.pauseVideo();
      }
    } catch (err) {
      console.error('Failed to pause video:', err);
    }
  }, []);

  const handleSeekToStart = useCallback(() => {
    try {
      const player = playerRef.current;
      if (player) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        player.seekTo(effectiveStartTime, true);
      }
    } catch (err) {
      console.error('Failed to seek to start:', err);
    }
  }, [effectiveStartTime]);

  // Style objects - moved outside the render for better performance
  const containerStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #444',
    borderRadius: '5px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '10px',
    paddingBottom: '56.25%', // 16:9 aspect ratio for container
    height: 0,
    backgroundColor: '#000'
  };

  const playerWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const youtubeContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
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
    minWidth: isMobile.current ? '80px' : '100px'
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
          <div style={youtubeContainerStyle}>
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onStateChange}
              onError={onPlayerError}
              className="youtube-player"
            />
          </div>
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
              Pause
            </button>
          ) : (
            <button style={{...buttonStyle, backgroundColor: '#38a169'}} onClick={handlePlay}>
              Play
            </button>
          )}
          <button style={buttonStyle} onClick={handleSeekToStart}>
            Restart
          </button>
        </div>
        <div style={timeDisplayStyle}>
          {formatTime(currentTime)} {endTime ? `/ ${formatTime(endTime)}` : ''}
        </div>
      </div>
    </div>
  );
});

export default YouTubePlayer; 