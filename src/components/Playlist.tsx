import React from 'react';

interface Video {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

interface PlaylistProps {
  videos: Video[];
  onRemove: (id: string) => void;
  onPlay: (video: Video) => void;
  onUpdateTimes: (id: string, startTime: number, endTime: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ videos, onRemove, onPlay, onUpdateTimes }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    const [minutes, seconds] = value.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    const video = videos.find(v => v.id === id);
    if (video) {
      if (field === 'startTime') {
        onUpdateTimes(id, totalSeconds, video.endTime);
      } else {
        onUpdateTimes(id, video.startTime, totalSeconds);
      }
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Playlist</h2>
      <div className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{video.title}</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Start:</label>
                    <input
                      type="time"
                      step="1"
                      value={formatTime(video.startTime)}
                      onChange={(e) => handleTimeChange(video.id, 'startTime', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">End:</label>
                    <input
                      type="time"
                      step="1"
                      value={formatTime(video.endTime)}
                      onChange={(e) => handleTimeChange(video.id, 'endTime', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPlay(video)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Play
                </button>
                <button
                  onClick={() => onRemove(video.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist; 