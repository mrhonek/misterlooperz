import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import YouTubePlayer from './components/YouTubePlayer';
import VideoInput from './components/VideoInput';
import Playlist from './components/Playlist';
import { Video } from './types.ts';
import { fetchVideoInfo } from './utils/youtubeUtils';
import { truncateText } from './utils/stringUtils';
import { registerServiceWorker, startVideoTimer, stopTimer, checkTimers } from './utils/serviceWorkerUtils';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [layout, setLayout] = useState(window.innerWidth <= 768 ? 'mobile' : 'desktop');
  
  // Use a ref for isMobile state to avoid causing unnecessary player re-renders
  const isMobileRef = useRef(window.innerWidth <= 768);

  // Add background play tracking system
  const [backgroundPlayTimerId, setBackgroundPlayTimerId] = useState<string | null>(null);
  
  // Service worker support tracking
  const [swAvailable, setSwAvailable] = useState(false);
  
  // Register the service worker on app load
  useEffect(() => {
    const initServiceWorker = async () => {
      const registered = await registerServiceWorker();
      setSwAvailable(registered);
      console.log('Service Worker available:', registered);
    };
    
    initServiceWorker().catch(console.error);
  }, []);

  // Listen for timer complete events from the service worker
  useEffect(() => {
    const handleTimerComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Timer complete event received:', customEvent.detail);
      
      // Handle different message types
      if (customEvent.detail.type === 'TIMER_COMPLETE') {
        const { videoId } = customEvent.detail;
        
        // Verify this is for the current video
        if (currentVideo && currentVideo.videoId === videoId) {
          console.log('Service worker timer completed for current video, advancing');
          handleVideoEnd();
        }
      }
      else if (customEvent.detail.type === 'TIMERS_COMPLETED') {
        const { timers } = customEvent.detail;
        
        // Check if any completed timer matches the current video
        if (currentVideo && timers.some((timer: any) => timer.videoId === currentVideo.videoId)) {
          console.log('Service worker reports timers completed for current video, advancing');
          handleVideoEnd();
        }
      }
    };
    
    // Add event listener
    window.addEventListener('sw-timer-complete', handleTimerComplete);
    
    // Set up periodic checks for timers when using service worker
    let checkInterval: NodeJS.Timeout | null = null;
    if (swAvailable) {
      checkInterval = setInterval(() => {
        checkTimers();
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      window.removeEventListener('sw-timer-complete', handleTimerComplete);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [swAvailable, currentVideo]);

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

  // Set up background timer with service worker when video or autoplay changes
  useEffect(() => {
    // Clean up any existing timer
    if (backgroundPlayTimerId) {
      stopTimer(backgroundPlayTimerId);
      setBackgroundPlayTimerId(null);
    }
    
    // Only set up the timer if we have auto play enabled, a current video with end time, service worker is available
    if (autoPlayEnabled && currentVideo && currentVideo.endTime && videos.length > 0 && swAvailable) {
      try {
        // Calculate when this video should end
        const videoStartTime = currentVideo.startTime || 0;
        const videoEndTime = currentVideo.endTime;
        const videoDuration = videoEndTime - videoStartTime;
        
        // Add 1 second buffer
        const durationMs = videoDuration * 1000 + 1000;
        
        // Start a service worker timer
        const newTimerId = startVideoTimer(currentVideo.videoId, durationMs);
        
        if (newTimerId) {
          console.log('Started service worker timer for video', currentVideo.videoId, 'duration:', durationMs);
          setBackgroundPlayTimerId(newTimerId);
        }
      } catch (error) {
        console.error('Error setting up service worker timer:', error);
      }
    }
  }, [autoPlayEnabled, currentVideo, videos, swAvailable]);
  
  // Visibility change handler to check with service worker
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && swAvailable) {
        // When tab becomes visible, check if any timers completed
        checkTimers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [swAvailable]);

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
    // Update current video
    setCurrentVideo(video);
    
    // Set up a new timer if needed
    if (backgroundPlayTimerId) {
      stopTimer(backgroundPlayTimerId);
      setBackgroundPlayTimerId(null);
    }
    
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
