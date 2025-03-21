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
          className={`bg-gray-700 rounded-lg p-4 transition-all ${
            currentVideo?.id === video.id ? 'border-2 border-blue-500' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-3">
                <button
                  onClick={() => onPlayVideo(video)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
                <h3 className="text-white font-semibold truncate flex-1">{video.url.replace(/^https?:\/\//, '')}</h3>
                <button
                  onClick={() => onRemoveVideo(video.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={inputValues[video.id]?.start ?? formatTime(video.startTime)}
                    onChange={(e) => handleTimeChange(video.id, 'start', e.target.value)}
                    placeholder="0:00"
                    className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Time</label>
                  <input
                    type="text"
                    value={inputValues[video.id]?.end ?? formatTime(video.endTime)}
                    onChange={(e) => handleTimeChange(video.id, 'end', e.target.value)}
                    placeholder="0:00"
                    className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Playlist; 