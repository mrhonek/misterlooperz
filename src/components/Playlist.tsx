import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import { formatTime, parseTimeInput } from '../utils/timeUtils';
import { truncateText } from '../utils/stringUtils';

interface PlaylistProps {
  videos: Video[];
  currentVideo: Video | null;
  onPlayVideo: (video: Video) => void;
  onRemoveVideo: (id: string) => void;
  onTimeChange: (id: string, type: 'startTime' | 'endTime', value: number | null) => void;
  autoPlayEnabled?: boolean;
}

const Playlist: React.FC<PlaylistProps> = ({
  videos,
  currentVideo,
  onPlayVideo,
  onRemoveVideo,
  onTimeChange,
  autoPlayEnabled = false
}) => {
  // State to track input values for each video
  const [inputValues, setInputValues] = useState<Record<string, { start: string; end: string }>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const containerStyle: React.CSSProperties = {
    maxHeight: isMobile ? '400px' : '60vh',
    overflowY: 'auto',
    paddingRight: '10px'
  };

  const videoItemStyle = (isCurrentVideo: boolean): React.CSSProperties => ({
    backgroundColor: isCurrentVideo ? '#2a4365' : '#444',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '15px'
  });

  const titleStyle: React.CSSProperties = {
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '15px',
    fontWeight: 'bold',
    fontSize: isMobile ? '16px' : '14px'
  };

  const formGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '10px',
    marginBottom: '15px'
  };

  const inputGroupStyle: React.CSSProperties = {
    width: '100%'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '5px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '10px' : '5px 10px',
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: '4px',
    color: 'white',
    fontSize: isMobile ? '16px' : '14px',
    minHeight: isMobile ? '44px' : '32px'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    justifyContent: isMobile ? 'space-between' : 'flex-start'
  };

  const playButtonStyle: React.CSSProperties = {
    backgroundColor: '#3182ce',
    color: 'white',
    fontWeight: 'bold',
    padding: isMobile ? '12px 20px' : '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flexGrow: isMobile ? 1 : 0,
    fontSize: isMobile ? '16px' : '14px',
    minHeight: isMobile ? '44px' : '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const removeButtonStyle: React.CSSProperties = {
    backgroundColor: '#e53e3e',
    color: 'white',
    fontWeight: 'bold',
    padding: isMobile ? '12px 20px' : '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flexGrow: isMobile ? 1 : 0,
    fontSize: isMobile ? '16px' : '14px',
    minHeight: isMobile ? '44px' : '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const emptyPlaylistStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '30px 0'
  };

  const emptyTextStyle: React.CSSProperties = {
    color: '#999'
  };

  const emptySubtextStyle: React.CSSProperties = {
    color: '#777',
    fontSize: '14px',
    marginTop: '10px'
  };

  const autoPlayIndicatorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#4ade80',
    marginTop: '5px',
    display: autoPlayEnabled ? 'block' : 'none'
  };

  return (
    <div style={containerStyle}>
      {videos.length > 0 && autoPlayEnabled && (
        <div style={{ marginBottom: '10px', backgroundColor: 'rgba(56, 161, 105, 0.1)', padding: '8px', borderRadius: '4px', border: '1px solid #38a169' }}>
          <p style={{ color: '#4ade80', fontSize: '14px', margin: 0 }}>
            Auto Play: ON - Will play from start to end times, then move to the next video
          </p>
        </div>
      )}
    
      {videos.map((video, index) => (
        <div
          key={video.id}
          style={videoItemStyle(currentVideo?.id === video.id)}
        >
          <div style={titleStyle}>
            {truncateText(video.title, isMobile ? 40 : 60)}
            {autoPlayEnabled && index > 0 && (
              <div style={autoPlayIndicatorStyle}>
                Up next #{index}
              </div>
            )}
          </div>
          
          <div style={formGroupStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Start Time</label>
              <input
                type="text"
                value={inputValues[video.id]?.start ?? formatTime(video.startTime)}
                onChange={(e) => handleTimeChange(video.id, 'start', e.target.value)}
                placeholder="0:00"
                style={inputStyle}
                inputMode="numeric"
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>End Time</label>
              <input
                type="text"
                value={inputValues[video.id]?.end ?? formatTime(video.endTime)}
                onChange={(e) => handleTimeChange(video.id, 'end', e.target.value)}
                placeholder="0:00"
                style={inputStyle}
                inputMode="numeric"
              />
            </div>
          </div>
          
          <div style={buttonGroupStyle}>
            <button
              onClick={() => onPlayVideo(video)}
              style={playButtonStyle}
            >
              {isMobile ? '▶️ Play' : 'Play'}
            </button>
            <button
              onClick={() => onRemoveVideo(video.id)}
              style={removeButtonStyle}
            >
              {isMobile ? '🗑️ Remove' : 'Remove'}
            </button>
          </div>
        </div>
      ))}
      
      {videos.length === 0 && (
        <div style={emptyPlaylistStyle}>
          <p style={emptyTextStyle}>No videos in your playlist yet.</p>
          <p style={emptySubtextStyle}>Add a YouTube video to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Playlist; 