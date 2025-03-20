import React, { useState } from 'react';

interface Video {
  id: string;
  title: string;
  startTime: number | null;
  endTime: number | null;
}

interface PlaylistProps {
  videos: Video[];
  onRemove: (id: string) => void;
  onPlay: (video: Video) => void;
  onUpdateTimes: (id: string, startTime: number | null, endTime: number | null) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ videos, onRemove, onPlay, onUpdateTimes }) => {
  const [inputValues, setInputValues] = useState<{ [key: string]: { start: string; end: string } }>({});

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    // Update the input value immediately
    setInputValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field === 'startTime' ? 'start' : 'end']: value
      }
    }));

    // If the input is empty, set the time to null
    if (!value) {
      const video = videos.find(v => v.id === id);
      if (video) {
        if (field === 'startTime') {
          onUpdateTimes(id, null, video.endTime);
        } else {
          onUpdateTimes(id, video.startTime, null);
        }
      }
      return;
    }

    // Try to parse the time value
    const parts = value.split(':');
    if (parts.length !== 2) return;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds) || seconds >= 60) return;
    
    const totalSeconds = minutes * 60 + seconds;
    const video = videos.find(v => v.id === id);
    if (video) {
      if (field === 'startTime') {
        if (video.endTime === null || totalSeconds < video.endTime) {
          onUpdateTimes(id, totalSeconds, video.endTime);
        }
      } else {
        if (video.startTime === null || totalSeconds > video.startTime) {
          onUpdateTimes(id, video.startTime, totalSeconds);
        }
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
                      type="text"
                      placeholder="M:SS"
                      value={inputValues[video.id]?.start ?? formatTime(video.startTime)}
                      onChange={(e) => handleTimeChange(video.id, 'startTime', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-20"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">End:</label>
                    <input
                      type="text"
                      placeholder="M:SS"
                      value={formatTime(video.endTime)}
                      onChange={(e) => handleTimeChange(video.id, 'endTime', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-20"
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