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
      setVideos(JSON.parse(savedVideos));
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
      }
    }
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            MisterLooperz
          </h1>
          <p className="text-gray-300">Loop and play your favorite YouTube videos</p>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col items-center">
            {currentVideo ? (
              <div className="w-full">
                <YouTubePlayer 
                  key={playerKey}
                  videoId={currentVideo.videoId} 
                  startTime={currentVideo.startTime} 
                  endTime={currentVideo.endTime}
                />
                <div className="mt-4 bg-gray-800 rounded-lg p-4 shadow-lg">
                  <h2 className="text-xl font-semibold mb-2">Now Playing</h2>
                  <p className="text-gray-300 truncate">
                    {currentVideo.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-[390px] bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">No video selected. Add a video to get started!</p>
              </div>
            )}

            <div className="w-full mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Add New Video</h2>
              <VideoInput onAddVideo={handleAddVideo} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Your Playlist</h2>
              {videos.length > 0 ? (
                <Playlist 
                  videos={videos} 
                  currentVideo={currentVideo} 
                  onPlayVideo={handlePlayVideo} 
                  onRemoveVideo={handleRemoveVideo}
                  onTimeChange={handleTimeChange}
                />
              ) : (
                <p className="text-gray-400">Your playlist is empty. Add some videos!</p>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} MisterLooperz - Created by Mike Rhonek</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
