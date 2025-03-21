import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import YouTubePlayer from './components/YouTubePlayer';
import VideoInput from './components/VideoInput';
import Playlist from './components/Playlist';
import { Video } from './types';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    const savedVideos = localStorage.getItem('videos');
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
  }, []);

  useEffect(() => {
    localStorage.setItem('videos', JSON.stringify(videos));
  }, [videos]);

  const handleAddVideo = (videoUrl: string, startTime: number | null, endTime: number | null) => {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    const newVideo: Video = {
      id: uuidv4(),
      videoId,
      url: videoUrl,
      startTime,
      endTime,
    };

    setVideos([...videos, newVideo]);
    if (!currentVideo) {
      setCurrentVideo(newVideo);
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
    // Move to the next video in the playlist when a video ends
    if (currentVideo && videos.length > 1) {
      const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
      if (currentIndex < videos.length - 1) {
        handlePlayVideo(videos[currentIndex + 1]);
      } else {
        // Loop back to the first video if we're at the end of the playlist
        handlePlayVideo(videos[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            MisterLooperz
          </h1>
          <p className="text-gray-300">Loop and play your favorite YouTube videos</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {currentVideo ? (
              <div>
                <YouTubePlayer 
                  key={playerKey}
                  videoId={currentVideo.videoId} 
                  startTime={currentVideo.startTime} 
                  endTime={currentVideo.endTime}
                  onEnd={handleVideoEnd}
                />
                <div className="mt-4 bg-gray-800 p-4 rounded">
                  <h2 className="text-xl font-bold mb-2">Now Playing</h2>
                  <p className="text-gray-300 truncate">
                    {currentVideo.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 h-[390px] rounded flex items-center justify-center">
                <p className="text-gray-400">No video selected. Add a video to get started!</p>
              </div>
            )}

            <div className="mt-6 bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Add New Video</h2>
              <VideoInput onAddVideo={handleAddVideo} />
            </div>
          </div>

          <div>
            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Your Playlist</h2>
              <Playlist 
                videos={videos} 
                currentVideo={currentVideo} 
                onPlayVideo={handlePlayVideo} 
                onRemoveVideo={handleRemoveVideo}
                onTimeChange={handleTimeChange}
              />
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} MisterLooperz - Created by Mike Rhonek</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
