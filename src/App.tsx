import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import YouTubePlayer from './components/YouTubePlayer';
import VideoInput from './components/VideoInput';
import Playlist from './components/Playlist';
import { Video } from './types.ts';
import { fetchVideoInfo } from './utils/youtubeUtils';
import { truncateText } from './utils/stringUtils';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [layout, setLayout] = useState(window.innerWidth <= 768 ? 'mobile' : 'desktop');
  
  // Use a ref for isMobile state to avoid causing unnecessary player re-renders
  const isMobileRef = useRef(window.innerWidth <= 768);

  // Add background play tracking system
  const [backgroundPlayTimerId, setBackgroundPlayTimerId] = useState<number | null>(null);
  const backgroundPlayStateRef = useRef<{
    videoEndTimestamp: number | null;
    currentVideoId: string | null;
    videoIndex: number | null;
    lastCheckTime: number;
    catchupMode: boolean;
  }>({
    videoEndTimestamp: null,
    currentVideoId: null,
    videoIndex: null,
    lastCheckTime: Date.now(),
    catchupMode: false
  });
  
  // Detect browser for Chrome-specific optimizations
  const [isChrome, setIsChrome] = useState(false);
  
  // Detect if we're using Chrome
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChromeBrowser = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent) && !/opr|opera/.test(userAgent);
    setIsChrome(isChromeBrowser);
    console.log('Browser detection:', isChromeBrowser ? 'Chrome' : 'Other browser');
  }, []);

  useEffect(() => {
    const savedVideos = localStorage.getItem('videos');
    const savedAutoPlay = localStorage.getItem('autoPlayEnabled');
    
    if (savedVideos) {
      try {
        const parsedVideos = JSON.parse(savedVideos);
        setVideos(parsedVideos);
        if (parsedVideos.length > 0 && !currentVideo) {
          setCurrentVideo(parsedVideos[0]);
        }
      } catch (e) {
        console.error('Failed to parse saved videos:', e);
        localStorage.removeItem('videos');
      }
    }
    
    if (savedAutoPlay) {
      try {
        setAutoPlayEnabled(JSON.parse(savedAutoPlay));
      } catch (e) {
        console.error('Failed to parse auto play setting:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('videos', JSON.stringify(videos));
  }, [videos]);
  
  useEffect(() => {
    localStorage.setItem('autoPlayEnabled', JSON.stringify(autoPlayEnabled));
  }, [autoPlayEnabled]);

  // Add window resize listener to handle layout changes
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      
      // Only update layout state (which affects rendering)
      // This won't cause the YouTube player to re-render
      setLayout(newIsMobile ? 'mobile' : 'desktop');
      
      // Update the ref value (doesn't trigger re-renders)
      isMobileRef.current = newIsMobile;
    };

    // Use a debounced version of resize to avoid handling orientation changes
    // This gives our orientation change handler in the YouTube component time to work
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 300);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const handleAddVideo = async (videoUrl: string, startTime: number | null, endTime: number | null) => {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    console.log('App - Adding video with times:', { startTime, endTime });
    
    setLoading(true);
    try {
      // Fetch video info from YouTube
      const videoInfo = await fetchVideoInfo(videoId);
      
      const newVideo: Video = {
        id: uuidv4(),
        videoId,
        url: videoUrl,
        title: videoInfo.title,
        startTime,
        endTime,
      };

      console.log('App - Created new video object:', newVideo);
      
      setVideos(prev => [...prev, newVideo]);
      if (!currentVideo) {
        setCurrentVideo(newVideo);
      }
    } catch (error) {
      console.error('Error adding video:', error);
      
      // Fallback to adding with unknown title
      const newVideo: Video = {
        id: uuidv4(),
        videoId,
        url: videoUrl,
        title: 'Unknown Title',
        startTime,
        endTime,
      };

      console.log('App - Created fallback video object:', newVideo);
      
      setVideos(prev => [...prev, newVideo]);
      if (!currentVideo) {
        setCurrentVideo(newVideo);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = (id: string) => {
    const newVideos = videos.filter(video => video.id !== id);
    setVideos(newVideos);

    if (currentVideo && currentVideo.id === id) {
      setCurrentVideo(newVideos.length > 0 ? newVideos[0] : null);
    }
  };

  const handlePlayVideo = (video: Video) => {
    setCurrentVideo(video);
    setTimeout(() => {
      const player = document.querySelector('iframe')?.contentWindow;
      if (player) {
        try {
          // @ts-ignore
          player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (err) {
          console.error('Failed to play video after selection:', err);
        }
      }
    }, 300);
  };

  const handleTimeChange = (id: string, type: 'startTime' | 'endTime', value: number | null) => {
    console.log(`App - Changing ${type} for video ${id} to:`, value);
    
    const newVideos = videos.map(video => {
      if (video.id === id) {
        const updatedVideo = { ...video, [type]: value };
        console.log('App - Updated video:', updatedVideo);
        return updatedVideo;
      }
      return video;
    });
    
    setVideos(newVideos);

    if (currentVideo && currentVideo.id === id) {
      const updatedVideo = newVideos.find(v => v.id === id);
      if (updatedVideo) {
        console.log('App - Updating current video to:', updatedVideo);
        setCurrentVideo(updatedVideo);
      }
    }
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleVideoEnd = () => {
    // If we have a current video and playlist
    if (currentVideo && videos.length > 0) {
      // Only advance to next video when autoPlayEnabled is true
      if (autoPlayEnabled) {
        const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
        if (currentIndex < videos.length - 1) {
          // Play next video
          handlePlayVideo(videos[currentIndex + 1]);
        } else {
          // Loop back to first video if at the end
          handlePlayVideo(videos[0]);
        }
      }
    }
  };

  // Set up background play worker with Chrome-specific optimizations
  useEffect(() => {
    // Clean up any existing timer
    if (backgroundPlayTimerId) {
      window.clearTimeout(backgroundPlayTimerId);
    }
    
    // Only set up the timer if we have auto play enabled, a current video with end time, and videos in the playlist
    if (autoPlayEnabled && currentVideo && currentVideo.endTime && videos.length > 0) {
      try {
        // Calculate when this video should end
        const now = Date.now();
        const videoStartTime = currentVideo.startTime || 0;
        const videoEndTime = currentVideo.endTime;
        const videoDuration = videoEndTime - videoStartTime;
        
        // Store the video that's currently playing and when it should end
        const videoEndTimestamp = now + (videoDuration * 1000);
        backgroundPlayStateRef.current = {
          videoEndTimestamp,
          currentVideoId: currentVideo.videoId,
          videoIndex: videos.findIndex(v => v.id === currentVideo.id),
          lastCheckTime: now,
          catchupMode: false
        };
        
        console.log('Background play: Setting up timer for', videoDuration, 'seconds');
        
        // Store current video state in localStorage to survive tab reloads and browser restarts
        const persistentState = {
          videoId: currentVideo.videoId,
          startedAt: now,
          endTimestamp: videoEndTimestamp,
          videoIndex: videos.findIndex(v => v.id === currentVideo.id)
        };
        localStorage.setItem('misterlooperz_bg_state', JSON.stringify(persistentState));
        
        // Chrome optimization - use shorter intervals for more accurate timing
        if (isChrome) {
          // For Chrome, we'll use a heartbeat interval instead of setTimeout
          // This is more reliable in Chrome's background tab throttling
          const heartbeatId = window.setInterval(() => {
            // Current time
            const currentTime = Date.now();
            
            // Check if video should have ended
            if (currentTime >= backgroundPlayStateRef.current.videoEndTimestamp!) {
              console.log('Chrome background play: Heartbeat detected video should end');
              
              // Check if the document is visible
              if (document.visibilityState === 'visible') {
                handleVideoEnd();
                // Clear this interval
                window.clearInterval(heartbeatId);
              } else {
                // Mark that we need to advance when tab becomes visible
                backgroundPlayStateRef.current.catchupMode = true;
                // Keep the interval running to check again
              }
            }
          }, 1000); // Check every second
          
          // Store the timer ID
          setBackgroundPlayTimerId(heartbeatId as unknown as number);
        } else {
          // For other browsers, the setTimeout approach works fine
          const timerId = window.setTimeout(() => {
            console.log('Background play: Timer fired, checking if video should advance');
            
            // When the timer fires, check if the same video is playing
            if (currentVideo && 
                currentVideo.videoId === backgroundPlayStateRef.current.currentVideoId) {
              console.log('Background play: Same video still playing, advancing to next video');
              handleVideoEnd();
            }
          }, videoDuration * 1000);
          
          // Store the timer ID for cleanup
          setBackgroundPlayTimerId(timerId);
        }
      } catch (error) {
        console.error('Error setting up background play timer:', error);
      }
    }
    
    return () => {
      // Clean up timer on unmount or when dependencies change
      if (backgroundPlayTimerId) {
        if (isChrome) {
          window.clearInterval(backgroundPlayTimerId);
        } else {
          window.clearTimeout(backgroundPlayTimerId);
        }
      }
    };
  }, [autoPlayEnabled, currentVideo, videos, backgroundPlayTimerId, isChrome]);
  
  // Add a visibility change handler to check if a video should have advanced while tab was hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only check when tab becomes visible
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        
        // Check local storage for persistent state (helps across page reloads)
        try {
          const persistentStateStr = localStorage.getItem('misterlooperz_bg_state');
          if (persistentStateStr) {
            const persistentState = JSON.parse(persistentStateStr);
            
            // If the end timestamp has passed
            if (now > persistentState.endTimestamp) {
              console.log('Background play: Detected via localStorage that video should have ended');
              
              // See if this is the same playlist position
              const currentIndex = currentVideo ? videos.findIndex(v => v.id === currentVideo.id) : -1;
              
              // If we're still on the same video that should have ended
              if (currentVideo?.videoId === persistentState.videoId || 
                  currentIndex === persistentState.videoIndex) {
                handleVideoEnd();
              }
            }
          }
        } catch (err) {
          console.error('Error checking persistent state:', err);
        }
        
        // Chrome-specific catch-up mechanism
        if (isChrome && backgroundPlayStateRef.current.catchupMode) {
          console.log('Chrome background play: Catch-up mode detected, advancing video');
          backgroundPlayStateRef.current.catchupMode = false;
          handleVideoEnd();
        }
        
        // Regular timestamp check (backup)
        if (autoPlayEnabled && 
            backgroundPlayStateRef.current.videoEndTimestamp && 
            currentVideo) {
          
          // Check if this video should have ended while the tab was hidden
          if (now > backgroundPlayStateRef.current.videoEndTimestamp) {
            console.log('Background play: Video should have ended while tab was hidden, advancing now');
            
            // Advance to the next video
            handleVideoEnd();
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoPlayEnabled, currentVideo, videos, isChrome]);
  
  // Do an immediate check on mount to handle case where video should have played while page was closed
  useEffect(() => {
    if (autoPlayEnabled && currentVideo) {
      // Check localStorage for any videos that should have played
      try {
        const persistentStateStr = localStorage.getItem('misterlooperz_bg_state');
        if (persistentStateStr) {
          const persistentState = JSON.parse(persistentStateStr);
          const now = Date.now();
          
          // If more than the video duration has passed
          if (persistentState.endTimestamp && now > persistentState.endTimestamp) {
            // Only if autoplay is enabled and this is the same video
            if (autoPlayEnabled && currentVideo.videoId === persistentState.videoId) {
              console.log('Initial check: Video should have ended while page was closed');
              // Use a short delay to ensure everything is ready
              setTimeout(() => {
                handleVideoEnd();
              }, 1000);
            }
          }
        }
      } catch (err) {
        console.error('Error in initial state check:', err);
      }
    }
  }, [autoPlayEnabled, currentVideo, handleVideoEnd]);

  const toggleAutoPlay = () => {
    setAutoPlayEnabled(!autoPlayEnabled);
  };

  const appStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#1a202c',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const headerContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  };

  const logoStyle: React.CSSProperties = {
    width: '100px',
    height: '100px',
    marginRight: '20px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#ccc'
  };

  const mainContentStyle: React.CSSProperties = {
    display: layout === 'mobile' ? 'flex' : 'grid',
    gridTemplateColumns: '2fr 1fr',
    flexDirection: layout === 'mobile' ? 'column' : 'row' as 'column' | 'row',
    gap: '20px',
    width: '100%'
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#2d3748',
    padding: '20px',
    borderRadius: '5px'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px'
  };

  const nowPlayingStyle: React.CSSProperties = {
    marginTop: '15px',
    backgroundColor: '#2d3748',
    padding: '15px',
    borderRadius: '5px'
  };

  const footerStyle: React.CSSProperties = {
    marginTop: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  };

  const playlistHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  };

  const autoPlayToggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center'
  };

  const toggleLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    marginRight: '8px',
    color: '#ccc'
  };

  const toggleButtonStyle: React.CSSProperties = {
    backgroundColor: autoPlayEnabled ? '#38a169' : '#4a5568',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  return (
    <div style={appStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <img src="/images/logo.png" alt="MisterLooperz Logo" style={logoStyle} />
          <div style={headerContentStyle}>
            <h1 style={titleStyle}>
              MisterLooperz
            </h1>
            <p style={subtitleStyle}>Loop and play your favorite YouTube videos</p>
          </div>
        </header>

        <div style={mainContentStyle}>
          <div style={columnStyle}>
            {currentVideo ? (
              <div>
                <YouTubePlayer 
                  videoId={currentVideo.videoId} 
                  startTime={currentVideo.startTime} 
                  endTime={currentVideo.endTime}
                  onEnd={handleVideoEnd}
                  autoPlayEnabled={autoPlayEnabled}
                />
                <div style={nowPlayingStyle}>
                  <h2 style={sectionTitleStyle}>Now Playing</h2>
                  <p style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {truncateText(currentVideo.title, 80)}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ ...sectionStyle, height: '390px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#999' }}>No video selected. Add a video to get started!</p>
              </div>
            )}

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Add New Video</h2>
              <VideoInput onAddVideo={handleAddVideo} isLoading={loading} />
            </div>
            
            {/* Move playlist here for mobile */}
            {layout === 'mobile' && (
              <div style={sectionStyle}>
                <div style={playlistHeaderStyle}>
                  <h2 style={sectionTitleStyle}>Your Playlist</h2>
                  <div style={autoPlayToggleStyle}>
                    <span style={toggleLabelStyle}>Auto Play:</span>
                    <button 
                      onClick={toggleAutoPlay} 
                      style={toggleButtonStyle}
                    >
                      {autoPlayEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                <Playlist 
                  videos={videos} 
                  currentVideo={currentVideo} 
                  onPlayVideo={handlePlayVideo} 
                  onRemoveVideo={handleRemoveVideo}
                  onTimeChange={handleTimeChange}
                  autoPlayEnabled={autoPlayEnabled}
                />
              </div>
            )}
          </div>

          {/* Only show this column on desktop */}
          {layout === 'desktop' && (
            <div style={columnStyle}>
              <div style={sectionStyle}>
                <div style={playlistHeaderStyle}>
                  <h2 style={sectionTitleStyle}>Your Playlist</h2>
                  <div style={autoPlayToggleStyle}>
                    <span style={toggleLabelStyle}>Auto Play:</span>
                    <button 
                      onClick={toggleAutoPlay} 
                      style={toggleButtonStyle}
                    >
                      {autoPlayEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                <Playlist 
                  videos={videos} 
                  currentVideo={currentVideo} 
                  onPlayVideo={handlePlayVideo} 
                  onRemoveVideo={handleRemoveVideo}
                  onTimeChange={handleTimeChange}
                  autoPlayEnabled={autoPlayEnabled}
                />
              </div>
            </div>
          )}
        </div>

        <footer style={footerStyle}>
          <p>© {new Date().getFullYear()} <a href="https://portfolio.rhnkdigital.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>RHNK Digital LLC</a></p>
        </footer>
      </div>
    </div>
  );
}

export default App;
