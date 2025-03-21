import React, { useState } from 'react';
import { parseTimeInput } from '../utils/timeUtils';

interface VideoInputProps {
  onAddVideo: (videoUrl: string, startTime: number | null, endTime: number | null) => void;
}

const VideoInput: React.FC<VideoInputProps> = ({ onAddVideo }) => {
  const [url, setUrl] = useState('');
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }

    const startTime = startTimeInput ? parseTimeInput(startTimeInput) : null;
    const endTime = endTimeInput ? parseTimeInput(endTimeInput) : null;

    if (startTime !== null && endTime !== null && startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    onAddVideo(url, startTime, endTime);
    setUrl('');
    setStartTimeInput('');
    setEndTimeInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="video-url" className="block text-white font-bold mb-2">
          YouTube URL
        </label>
        <input
          id="video-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-time" className="block text-white font-bold mb-2">
            Start Time (M:SS) - Optional
          </label>
          <input
            id="start-time"
            type="text"
            value={startTimeInput}
            onChange={(e) => setStartTimeInput(e.target.value)}
            placeholder="0:00"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        
        <div>
          <label htmlFor="end-time" className="block text-white font-bold mb-2">
            End Time (M:SS) - Optional
          </label>
          <input
            id="end-time"
            type="text"
            value={endTimeInput}
            onChange={(e) => setEndTimeInput(e.target.value)}
            placeholder="1:30"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
      >
        Add to Playlist
      </button>
    </form>
  );
};

export default VideoInput; 