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

    // Make sure we have properly formatted values
    const formattedStartTime = startTimeStr ? startTimeStr.trim() : '';
    const formattedEndTime = endTimeStr ? endTimeStr.trim() : '';
    
    console.log('VideoInput - submitting with times:', { 
      startTimeStr: formattedStartTime, 
      endTimeStr: formattedEndTime 
    });

    // Parse time strings to seconds
    const startTime = formattedStartTime ? parseTimeString(formattedStartTime) : null;
    const endTime = formattedEndTime ? parseTimeString(formattedEndTime) : null;
    
    console.log('VideoInput - parsed times:', { startTime, endTime });

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
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  };

  const urlInputContainerStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '10px'
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px solid #4a5568',
    borderRadius: '4px',
    backgroundColor: '#2d3748',
    color: 'white',
    width: '100%',
    minHeight: isMobile ? '44px' : '38px',
    fontSize: isMobile ? '16px' : '14px'
  };

  const timeInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    width: '100%',
    marginBottom: '10px',
    flexDirection: isMobile ? 'column' : 'row'
  };

  const timeInputStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  };

  const labelStyle: React.CSSProperties = {
    color: '#a0aec0',
    fontSize: '14px',
    marginBottom: '4px',
    display: 'block'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isMobile ? 'center' : 'flex-start',
    width: '100%'
  };

  const buttonStyle: React.CSSProperties = {
    padding: isMobile ? '12px 20px' : '10px 20px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: isMobile ? '44px' : '38px',
    fontSize: isMobile ? '16px' : '14px',
    minWidth: '150px'
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        {/* YouTube URL Input */}
        <div style={urlInputContainerStyle}>
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
        
        {/* Time Inputs */}
        <div style={timeInputContainerStyle}>
          <div style={timeInputStyle}>
            <TimeInput 
              label="Start Time (optional)"
              value={startTimeStr}
              onChange={setStartTimeStr}
            />
          </div>
          
          <div style={timeInputStyle}>
            <TimeInput 
              label="End Time (optional)"
              value={endTimeStr}
              onChange={setEndTimeStr}
            />
          </div>
        </div>
        
        {/* Add Button */}
        <div style={buttonContainerStyle}>
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