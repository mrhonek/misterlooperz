import { useState, useEffect } from 'react';
import YouTubePlayer from './components/YouTubePlayer';
import Playlist from './components/Playlist';
import VideoInput from './components/VideoInput';

interface Video {
  id: string;
  title: string;
  startTime: number | null;
  endTime: number | null;
}

function App() {
  const [videos, setVideos] = useState<Video[]>(() => {
    const savedVideos = localStorage.getItem('playlist');
    return savedVideos ? JSON.parse(savedVideos) : [];
  });
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  useEffect(() => {
    localStorage.setItem('playlist', JSON.stringify(videos));
  }, [videos]);

  const handleAddVideo = (videoId: string, title: string, startTime: number | null, endTime: number | null) => {
    setVideos(prev => [...prev, { id: videoId, title, startTime, endTime }]);
  };

  const handleRemoveVideo = (id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
    if (currentVideo?.id === id) {
      setCurrentVideo(null);
    }
  };

  const handlePlayVideo = (video: Video) => {
    setCurrentVideo(video);
  };

  const handleUpdateTimes = (id: string, startTime: number | null, endTime: number | null) => {
    setVideos(prev => prev.map(video => 
      video.id === id ? { ...video, startTime, endTime } : video
    ));
    if (currentVideo?.id === id) {
      setCurrentVideo(prev => prev ? { ...prev, startTime, endTime } : null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">MisterLooperz</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <VideoInput onAddVideo={handleAddVideo} />
        </div>

        {currentVideo && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <YouTubePlayer
              videoId={currentVideo.id}
              startTime={currentVideo.startTime ?? 0}
              endTime={currentVideo.endTime ?? undefined}
              onEnd={() => {
                const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
                if (currentIndex < videos.length - 1) {
                  setCurrentVideo(videos[currentIndex + 1]);
                } else {
                  setCurrentVideo(null);
                }
              }}
            />
          </div>
        )}

        <Playlist
          videos={videos}
          onRemove={handleRemoveVideo}
          onPlay={handlePlayVideo}
          onUpdateTimes={handleUpdateTimes}
        />
      </div>
    </div>
  );
}

export default App;
