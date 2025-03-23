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
  
  // Add a ref to track if video ended while page was not visible
  const pendingAutoPlayRef = useRef(false);
  
  // Add refs to track video timeline independently of YouTube player
  const videoStartedAtRef = useRef<number | null>(null);
  const expectedDurationRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityChangeTimeRef = useRef<number>(Date.now());
  const shouldAdvanceVideoRef = useRef<boolean>(false);
  
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

  // Create a special visibility change handler for auto play
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentTimestamp = Date.now();
      const wasHidden = document.visibilityState !== 'visible';
      
      // Always track the time of the visibility change
      lastVisibilityChangeTimeRef.current = currentTimestamp;
      
      if (document.visibilityState === 'visible') {
        console.log('Page became visible');
        
        // Check if we need to advance to the next video
        if (shouldAdvanceVideoRef.current) {
          console.log('Auto play: Detected we should advance to next video');
          shouldAdvanceVideoRef.current = false;
          
          // Execute after a short delay to ensure player is ready
          setTimeout(() => {
            if (onEnd) {
              console.log('Auto play: Advancing to next video after visibility change');
              onEnd();
            }
          }, 100);
        }
        
        // Resume normal playback for non-auto play scenarios
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
        // If we have auto play enabled and this video has a defined end time
        if (autoPlayEnabled && endTime && isPlaying) {
          try {
            // Check current time and calculate expected finish time
            if (playerRef.current) {
              // @ts-ignore
              const currentVideoTime = playerRef.current.getCurrentTime();
              const timeRemainingInSeconds = endTime - currentVideoTime;
              
              console.log('Auto play: Video should end in', timeRemainingInSeconds, 'seconds');
              
              // Set flag to check when page becomes visible again
              if (timeRemainingInSeconds <= 0) {
                // Should advance immediately
                shouldAdvanceVideoRef.current = true;
              } else {
                // Schedule the check for when we return
                const expectedEndTimestamp = currentTimestamp + (timeRemainingInSeconds * 1000);
                
                // Store the fact that we need to check this when tab becomes visible again
                localStorage.setItem('video_expected_end_' + videoId, expectedEndTimestamp.toString());
                localStorage.setItem('video_last_playing', videoId);
              }
            }
          } catch (err) {
            console.error('Error calculating auto play timing on visibility change:', err);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, autoPlayEnabled, endTime, onEnd, videoId]);
  
  // Check for pending auto play when component mounts or video ID changes
  useEffect(() => {
    try {
      const lastPlayingVideoId = localStorage.getItem('video_last_playing');
      if (lastPlayingVideoId === videoId && autoPlayEnabled) {
        const expectedEndTimestampStr = localStorage.getItem('video_expected_end_' + videoId);
        if (expectedEndTimestampStr) {
          const expectedEndTimestamp = parseInt(expectedEndTimestampStr, 10);
          const currentTimestamp = Date.now();
          
          // If the expected end time has passed while we were away
          if (currentTimestamp > expectedEndTimestamp) {
            console.log('Auto play: Video ended while page was hidden, advancing now');
            shouldAdvanceVideoRef.current = true;
          }
        }
      }
      
      // Clean up storage
      localStorage.removeItem('video_expected_end_' + videoId);
    } catch (err) {
      console.error('Error checking for pending auto play:', err);
    }
  }, [videoId, autoPlayEnabled]);
  
  // For robustness, set up a heartbeat check that runs even when tab is inactive
  useEffect(() => {
    // Create a broadcast channel for cross-tab communication
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('video_heartbeat');
      
      broadcastChannel.onmessage = (event) => {
        // If we receive a heartbeat and we're supposed to advance
        if (event.data.type === 'heartbeat' && shouldAdvanceVideoRef.current && onEnd) {
          console.log('Auto play: Advancing to next video after heartbeat');
          shouldAdvanceVideoRef.current = false;
          onEnd();
        }
      };
      
      // Create a worker to send heartbeats that won't be throttled as much
      const workerCode = `
        setInterval(() => {
          self.postMessage({type: 'heartbeat', timestamp: Date.now()});
        }, 1000);
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (event) => {
        if (event.data.type === 'heartbeat') {
          broadcastChannel?.postMessage({
            type: 'heartbeat',
            timestamp: event.data.timestamp,
            videoId
          });
          
          // Also check if we need to advance video based on our calculations
          if (autoPlayEnabled && endTime && isPlaying) {
            try {
              // Only check if we've been away for a while
              const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeTimeRef.current;
              if (document.visibilityState !== 'visible' && timeSinceVisibilityChange > 1000) {
                // @ts-ignore
                const currentVideoTime = playerRef.current?.getCurrentTime() || 0;
                if (currentVideoTime >= endTime) {
                  console.log('Auto play: Detected end time reached during heartbeat');
                  shouldAdvanceVideoRef.current = true;
                }
              }
            } catch (err) {
              // Ignore errors during background checks
            }
          }
        }
      };
      
      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        broadcastChannel?.close();
      };
    } catch (err) {
      // Browser might not support Workers or BroadcastChannel
      console.error('Error setting up background heartbeat:', err);
      
      // Fallback to regular interval
      const heartbeatInterval = setInterval(() => {
        if (autoPlayEnabled && endTime && isPlaying && document.visibilityState !== 'visible') {
          try {
            // @ts-ignore
            const currentVideoTime = playerRef.current?.getCurrentTime() || 0;
            if (currentVideoTime >= endTime) {
              shouldAdvanceVideoRef.current = true;
            }
          } catch (err) {
            // Ignore errors during background checks
          }
        }
      }, 1000);
      
      return () => {
        clearInterval(heartbeatInterval);
      };
    }
  }, [videoId, autoPlayEnabled, endTime, isPlaying, onEnd]);

  // Reset timers when video ID changes
  useEffect(() => {
    // Reset timing references when video changes
    videoStartedAtRef.current = null;
    expectedDurationRef.current = null;
    
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, [videoId]);

  // Add back the time update interval
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
            
            // Check end time logic now handled in other effects
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
  }, [isPlaying]);
  
  // Check end time with local checking logic
  const checkEndTime = useCallback(() => {
    try {
      const player = playerRef.current;
      if (player && endTime && isPlaying) {
        // @ts-ignore - Ignore TypeScript errors for YouTube API calls
        const time = player.getCurrentTime();
        
        // Check if we've reached or passed the end time
        if (time >= endTime) {
          if (autoPlayEnabled) {
            // In auto-play mode, trigger onEnd to go to next video
            if (onEnd) {
              onEnd();
            }
          } else {
            // In loop mode, loop back to start time
            // @ts-ignore - Ignore TypeScript errors for YouTube API calls
            player.seekTo(effectiveStartTime, true);
            // Ensure player continues playing after seeking
            // @ts-ignore
            player.playVideo();
          }
        }
      }
    } catch (err) {
      console.error('Error checking video time:', err);
    }
  }, [endTime, effectiveStartTime, isPlaying, onEnd, autoPlayEnabled]);

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
      // When playing starts or resumes, update our tracking
      if (autoPlayEnabled && endTime) {
        // Calculate expected duration
        const videoDuration = endTime - effectiveStartTime;
        expectedDurationRef.current = videoDuration;
        
        // Record when we started or resumed playing
        videoStartedAtRef.current = Date.now();
        
        // Clear any existing timer
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current);
        }
        
        // Set a timer for when this video should end
        autoPlayTimerRef.current = setTimeout(() => {
          console.log('Auto play timer fired - moving to next video');
          
          // Clean up
          videoStartedAtRef.current = null;
          expectedDurationRef.current = null;
          
          // Go to next video
          if (onEnd) {
            onEnd();
          }
        }, (videoDuration * 1000) + 500); // Add a small buffer
      }
      
      // Reset pending auto play flag when playback starts
      pendingAutoPlayRef.current = false;
      setIsPlaying(true);
    } else if (event.data === PLAYER_STATE.PAUSED) {
      // If manually paused, clear the auto play timer
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      
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