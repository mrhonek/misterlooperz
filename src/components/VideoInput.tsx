import React, { useState } from 'react';

interface VideoInputProps {
  onAddVideo: (videoId: string, title: string, startTime: number, endTime: number) => void;
}

const VideoInput: React.FC<VideoInputProps> = ({ onAddVideo }) => {
  const [url, setUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Convert time inputs to seconds
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);

    if (startSeconds === null || endSeconds === null) {
      setError('Please enter valid start and end times');
      return;
    }

    if (endSeconds <= startSeconds) {
      setError('End time must be greater than start time');
      return;
    }

    // For now, we'll use a placeholder title
    // In a real app, you'd fetch the actual video title from YouTube's API
    const title = `Video ${videoId}`;
    onAddVideo(videoId, title, startSeconds, endSeconds);

    // Reset form
    setUrl('');
    setStartTime('');
    setEndTime('');
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/,
      /youtube\.com\/embed\/([^&\n?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const timeToSeconds = (timeStr: string): number | null => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          YouTube URL
        </label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time (MM:SS)
          </label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time (MM:SS)
          </label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add to Playlist
      </button>
    </form>
  );
};

export default VideoInput; 