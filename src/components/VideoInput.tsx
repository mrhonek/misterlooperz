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

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const inputGroupStyle: React.CSSProperties = {
    width: '100%'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '8px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#444',
    border: '1px solid #555',
    borderRadius: '4px',
    color: 'white'
  };

  const formGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2b6cb0',
    color: 'white',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={inputGroupStyle}>
        <label htmlFor="video-url" style={labelStyle}>
          YouTube URL
        </label>
        <input
          id="video-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={inputStyle}
        />
      </div>
      
      <div style={formGroupStyle}>
        <div style={inputGroupStyle}>
          <label htmlFor="start-time" style={labelStyle}>
            Start Time (M:SS) - Optional
          </label>
          <input
            id="start-time"
            type="text"
            value={startTimeInput}
            onChange={(e) => setStartTimeInput(e.target.value)}
            placeholder="0:00"
            style={inputStyle}
          />
        </div>
        
        <div style={inputGroupStyle}>
          <label htmlFor="end-time" style={labelStyle}>
            End Time (M:SS) - Optional
          </label>
          <input
            id="end-time"
            type="text"
            value={endTimeInput}
            onChange={(e) => setEndTimeInput(e.target.value)}
            placeholder="1:30"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        type="submit"
        style={buttonStyle}
      >
        Add to Playlist
      </button>
    </form>
  );
};

export default VideoInput; 