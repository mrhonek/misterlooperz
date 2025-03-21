import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import YouTubePlayer from './components/YouTubePlayer';
import VideoInput from './components/VideoInput';
import Playlist from './components/Playlist';
import { Video } from './types';
import { fetchVideoInfo } from './utils/youtubeUtils';
import { truncateText } from './utils/stringUtils';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

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

  const handleAddVideo = async (videoUrl: string, startTime: number | null, endTime: number | null) => {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

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
      setPlayerKey(prev => prev + 1);
    }
  };

  const handlePlayVideo = (video: Video) => {
    setCurrentVideo(video);
    setPlayerKey(prev => prev + 1);
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
    const newVideos = videos.map(video => {
      if (video.id === id) {
        return { ...video, [type]: value };
      }
      return video;
    });
    setVideos(newVideos);

    if (currentVideo && currentVideo.id === id) {
      const updatedVideo = newVideos.find(v => v.id === id);
      if (updatedVideo) {
        setCurrentVideo(updatedVideo);
        // If the currently playing video's startTime changed, update the player
        if (type === 'startTime' && value !== currentVideo.startTime) {
          setPlayerKey(prev => prev + 1);
        }
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
      // Always advance to next video when a video ends (either naturally or by reaching end time)
      const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
      if (currentIndex < videos.length - 1) {
        // Play next video
        handlePlayVideo(videos[currentIndex + 1]);
      } else {
        // Loop back to first video if at the end
        handlePlayVideo(videos[0]);
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
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    width: '100%'
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
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
                  key={playerKey}
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
          </div>

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
        </div>

        <footer style={footerStyle}>
          <p>© {new Date().getFullYear()} RHNK Digital LLC</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
