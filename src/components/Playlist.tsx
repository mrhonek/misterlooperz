import React from 'react';

interface VideoItem {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
}

interface PlaylistProps {
  videos: VideoItem[];
  onVideoSelect: (video: VideoItem) => void;
  onRemoveVideo: (index: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  videos,
  onVideoSelect,
  onRemoveVideo,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Playlist</h2>
      <div className="space-y-2">
        {videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
          >
            <div className="flex-1">
              <h3 className="font-medium">{video.title}</h3>
              <p className="text-sm text-gray-600">
                {formatTime(video.startTime)}
                {video.endTime && ` - ${formatTime(video.endTime)}`}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onVideoSelect(video)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Play
              </button>
              <button
                onClick={() => onRemoveVideo(index)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist; 