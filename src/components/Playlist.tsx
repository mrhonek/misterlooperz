import React, { useState } from 'react';
import { Video } from '../types';
import { formatTime, parseTimeInput } from '../utils/timeUtils';

interface PlaylistProps {
  videos: Video[];
  currentVideo: Video | null;
  onPlayVideo: (video: Video) => void;
  onRemoveVideo: (id: string) => void;
  onTimeChange: (id: string, type: 'startTime' | 'endTime', value: number | null) => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  videos,
  currentVideo,
  onPlayVideo,
  onRemoveVideo,
  onTimeChange
}) => {
  // State to track input values for each video
  const [inputValues, setInputValues] = useState<Record<string, { start: string; end: string }>>({});

  // Handle time input change
  const handleTimeChange = (videoId: string, type: 'start' | 'end', value: string) => {
    // Update the input value immediately
    setInputValues(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId] || { start: '', end: '' },
        [type]: value
      }
    }));
    
    // Parse the time input and update the video time if valid
    const parsedTime = parseTimeInput(value);
    onTimeChange(videoId, type === 'start' ? 'startTime' : 'endTime', parsedTime);
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className={`rounded-lg p-4 mb-3 ${
            currentVideo?.id === video.id ? 'bg-blue-900' : 'bg-gray-700'
          }`}
        >
          <div className="w-full mb-3">
            <p className="text-white truncate">{video.url.replace(/^https?:\/\//, '')}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Start Time</label>
              <input
                type="text"
                value={inputValues[video.id]?.start ?? formatTime(video.startTime)}
                onChange={(e) => handleTimeChange(video.id, 'start', e.target.value)}
                placeholder="0:00"
                className="w-full px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">End Time</label>
              <input
                type="text"
                value={inputValues[video.id]?.end ?? formatTime(video.endTime)}
                onChange={(e) => handleTimeChange(video.id, 'end', e.target.value)}
                placeholder="0:00"
                className="w-full px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onPlayVideo(video)}
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
            >
              Play
            </button>
            <button
              onClick={() => onRemoveVideo(video.id)}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      
      {videos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No videos in your playlist yet.</p>
          <p className="text-gray-500 text-sm mt-2">Add a YouTube video to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Playlist; 