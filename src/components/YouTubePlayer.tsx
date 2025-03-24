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
  const lastRecordedPlaybackTimeRef = useRef<number | null>(null);
  
  // Add a flag to track user-initiated pauses
  const userPausedRef = useRef(false);
  // Track if we're in a system/auto pause vs user pause
  const systemPausedRef = useRef(false);
  
  // Added debug logs
  console.log('YouTubePlayer rendering with props:', {
    videoId,
    startTime,
    effectiveStartTime,
    endTime,
    autoPlayEnabled
  });
  
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
  
  // Configure player options with special settings for Chrome
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
      // Don't force mute in player options, we'll handle this manually
      // mute: isMobile.current ? 1 : 0,
      // Add playlist parameter to improve background playback
      playlist: videoId,
      // Add loop parameter - we'll handle our own loop mechanism though
      loop: 0
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

  // Update time interval to respect user pauses
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
            
            // Check if we need to manually end the video and trigger custom behavior
            // Only proceed if user hasn't explicitly paused
            if (endTime && time >= endTime && !userPausedRef.current) {
              if (autoPlayEnabled) {
                // In auto-play mode, trigger onEnd to go to next video
                if (onEnd) {
                  console.log('Time update: End time reached, advancing to next video');
                  onEnd();
                }
              } else {
                // In loop mode, loop back to start time
                console.log('Time update: End time reached, looping back to start');
                // @ts-ignore - Ignore TypeScript errors for YouTube API calls
                playerRef.current.seekTo(effectiveStartTime, true);
              }
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
  }, [isPlaying, endTime, effectiveStartTime, onEnd, autoPlayEnabled]);

  // More aggressive unmute helper function
  const ensureVideoUnmuted = useCallback(() => {
    if (!playerRef.current) return;
    
    try {
      // Try multiple times to ensure unmuting works
      const attemptUnmute = (attemptsLeft = 3) => {
        if (!playerRef.current) return;
        
        // @ts-ignore - Check if muted
        const isMuted = playerRef.current.isMuted();
        if (isMuted) {
          console.log('Ensuring video is unmuted, attempts left:', attemptsLeft);
          // @ts-ignore
          playerRef.current.unMute();
          // @ts-ignore - Set to reasonable volume
          playerRef.current.setVolume(80);
          
          // If this is not the last attempt, schedule another check
          if (attemptsLeft > 1) {
            setTimeout(() => attemptUnmute(attemptsLeft - 1), 500);
          }
        }
      };
      
      // Start unmute attempts
      attemptUnmute();
    } catch (err) {
      console.error('Error ensuring video is unmuted:', err);
    }
  }, []);

  // Update effect to watch videoId changes to handle autoplay transitions
  useEffect(() => {
    console.log('Video ID changed to:', videoId);
    
    // When video ID changes (like during autoplay), ensure it's unmuted
    if (!initialLoadRef.current && playerRef.current) {
      // Short delay to allow video to start loading
      setTimeout(() => {
        ensureVideoUnmuted();
      }, 1000);
    }
  }, [videoId, ensureVideoUnmuted]);

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
      ensureVideoUnmuted();
      initialLoadRef.current = false;
      
      // Start at beginning for initial load
      event.target.seekTo(effectiveStartTime, true);
    } else {
      // For non-initial loads (like autoplay), also ensure unmuted
      ensureVideoUnmuted();
    }
    
    // Try to force setting playback quality to handle background playback better
    try {
      // @ts-ignore - Setting to a lower quality might help with background playback
      event.target.setPlaybackQuality('small');
    } catch (err) {
      // Ignore errors
    }
  };

  // Modify onStateChange to handle user pauses
  const onStateChange = (event: YouTubeEvent) => {
    // Check player state and update isPlaying
    if (event.data === PLAYER_STATE.ENDED) {
      if (autoPlayEnabled && onEnd && !userPausedRef.current) {
        // Native YouTube ended event - move to next video
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
      
      // Only clear user pause flag if this play event wasn't triggered by our auto-play logic
      // We can determine this by checking if we were in system pause mode
      if (!systemPausedRef.current) {
        console.log('User explicitly resumed playback - clearing pause flag');
        userPausedRef.current = false;
      } else {
        // Reset system pause flag
        console.log('System resumed playback - maintaining user pause state');
        systemPausedRef.current = false;
      }
      
      // Use the more reliable unmute helper
      ensureVideoUnmuted();
      
      // When playback starts or resumes, also check if we're at the end time
      if (endTime && playerRef.current && !userPausedRef.current) {
        try {
          // @ts-ignore
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= endTime) {
            if (autoPlayEnabled && onEnd) {
              systemPausedRef.current = true; // Mark as system pause to preserve user pause state
              // Move to next video immediately if we're already past the end time
              onEnd();
            } else {
              systemPausedRef.current = true; // Mark as system pause to preserve user pause state
              // In loop mode, loop back to start
              // @ts-ignore
              playerRef.current.seekTo(effectiveStartTime, true);
            }
          }
        } catch (err) {
          // Ignore errors
        }
      }
    } else if (event.data === PLAYER_STATE.PAUSED) {
      setIsPlaying(false);
      
      // IMPORTANT: Only set user paused flag if not a system-initiated pause
      if (!systemPausedRef.current) {
        userPausedRef.current = true;
        console.log('User explicitly paused video - preventing auto advance');
      } else {
        // Reset system pause flag
        console.log('System paused video - not affecting user pause state');
        systemPausedRef.current = false;
      }
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

  // Handlers for play/pause buttons - update to handle the user pause flag
  const handlePlay = useCallback(() => {
    try {
      const player = playerRef.current;
      if (player) {
        // Clear user pause flag when play is explicitly pressed
        userPausedRef.current = false;
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
        // Set user pause flag when pause is explicitly pressed
        userPausedRef.current = true;
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