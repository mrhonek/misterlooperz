import { useState, useEffect } from 'react';
import YouTubePlayer from './components/YouTubePlayer';
import Playlist from './components/Playlist';
import VideoInput from './components/VideoInput';

interface VideoItem {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
}

const STORAGE_KEY = 'misterlooperz-playlist';

function App() {
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playMode, setPlayMode] = useState<'single' | 'all'>('single');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  }, [videos]);

  const handleAddVideo = (videoId: string, startTime: number, endTime?: number) => {
    const newVideo: VideoItem = {
      id: videoId,
      title: `Video ${videoId}`, // In a real app, you'd fetch the actual title
      startTime,
      endTime,
    };
    setVideos([...videos, newVideo]);
  };

  const handleVideoSelect = (video: VideoItem) => {
    setCurrentVideo(video);
    setPlayMode('single');
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    if (currentVideo && videos[index].id === currentVideo.id) {
      setCurrentVideo(null);
    }
  };

  const handleVideoEnd = () => {
    if (playMode === 'all' && videos.length > 0) {
      const nextIndex = (currentIndex + 1) % videos.length;
      setCurrentIndex(nextIndex);
      setCurrentVideo(videos[nextIndex]);
    }
  };

  const handlePlayAll = () => {
    if (videos.length > 0) {
      setPlayMode('all');
      setCurrentIndex(0);
      setCurrentVideo(videos[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">MisterLooperz</h1>
          <p className="mt-2 text-gray-600">Loop your favorite YouTube sections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <VideoInput onSubmit={handleAddVideo} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Playlist</h2>
                {videos.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Play All
                  </button>
                )}
              </div>
              <Playlist
                videos={videos}
                onVideoSelect={handleVideoSelect}
                onRemoveVideo={handleRemoveVideo}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {currentVideo ? (
              <YouTubePlayer
                videoId={currentVideo.id}
                startTime={currentVideo.startTime}
                endTime={currentVideo.endTime}
                onEnd={handleVideoEnd}
              />
            ) : (
              <div className="flex items-center justify-center h-[390px] bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select a video from the playlist to play</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
