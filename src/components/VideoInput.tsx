import React, { useState } from 'react';
import { parseTimeString } from '../utils/timeUtils';
import TimeInput from './TimeInput';

interface VideoInputProps {
  onAddVideo: (url: string, startTime: number | null, endTime: number | null) => void;
  isLoading: boolean;
}

const VideoInput: React.FC<VideoInputProps> = ({ onAddVideo, isLoading }) => {
  const [url, setUrl] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const isMobile = window.innerWidth <= 768;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }

    // Parse time strings to seconds
    const startTime = startTimeStr ? parseTimeString(startTimeStr) : null;
    const endTime = endTimeStr ? parseTimeString(endTimeStr) : null;

    // Validate end time is after start time if both are provided
    if (startTime !== null && endTime !== null && endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    onAddVideo(url, startTime, endTime);
    
    // Clear the form
    setUrl('');
    setStartTimeStr('');
    setEndTimeStr('');
  };

  const containerStyle: React.CSSProperties = {
    width: '100%'
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '10px',
    width: '100%'
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px solid #4a5568',
    borderRadius: '4px',
    backgroundColor: '#2d3748',
    color: 'white',
    flex: '1',
    width: isMobile ? '100%' : 'auto',
    minHeight: isMobile ? '44px' : '38px',
    fontSize: isMobile ? '16px' : '14px'
  };

  const timeInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    width: isMobile ? '100%' : 'auto',
    flexDirection: isMobile ? 'column' : 'row'
  };

  const labelStyle: React.CSSProperties = {
    color: '#a0aec0',
    fontSize: '14px',
    marginBottom: '4px',
    display: 'block'
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: isMobile ? 'auto' : '1'
  };

  const buttonStyle: React.CSSProperties = {
    padding: isMobile ? '12px' : '10px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: isMobile ? '44px' : '38px',
    fontSize: isMobile ? '16px' : '14px'
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label htmlFor="videoUrl" style={labelStyle}>YouTube URL</label>
          <input
            id="videoUrl"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        
        <div style={timeInputContainerStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <TimeInput 
              label="Start Time (optional)"
              value={startTimeStr}
              onChange={setStartTimeStr}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <TimeInput 
              label="End Time (optional)"
              value={endTimeStr}
              onChange={setEndTimeStr}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Playlist'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoInput; 