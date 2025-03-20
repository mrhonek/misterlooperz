import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';

interface YouTubePlayerProps {
  videoId: string;
  startTime?: number;
  endTime?: number;
  onEnd?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  startTime = 0,
  endTime,
  onEnd,
}) => {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
      start: startTime,
      end: endTime,
    },
  };

  useEffect(() => {
    if (playerRef.current) {
      const player = playerRef.current.getInternalPlayer();
      if (player) {
        player.seekTo(startTime);
      }
    }
  }, [startTime]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only set up the interval if we have an end time
    if (endTime && isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const player = playerRef.current.getInternalPlayer();
          if (player) {
            const currentTime = player.getCurrentTime();
            if (currentTime >= endTime) {
              player.seekTo(startTime);
            }
          }
        }
      }, 1000); // Check every second
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTime, startTime, isPlaying]);

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      if (onEnd) {
        onEnd();
      }
    } else if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        className="rounded-lg shadow-lg"
      />
      <div className="mt-4 space-x-4">
        <button
          onClick={() => playerRef.current?.playVideo()}
          disabled={isPlaying}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Play
        </button>
        <button
          onClick={() => playerRef.current?.pauseVideo()}
          disabled={!isPlaying}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayer; 