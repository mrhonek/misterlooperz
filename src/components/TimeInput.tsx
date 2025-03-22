import React, { useState, useEffect } from 'react';
import { formatTime, parseTimeString } from '../utils/timeUtils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showHelpText?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  placeholder = '0:00',
  label,
  showHelpText = true
}) => {
  const isMobile = window.innerWidth <= 768;
  
  // Parse the input value into hours, minutes, seconds
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');
  
  // When the component mounts or value changes, parse the time
  useEffect(() => {
    if (!value) {
      setHours('');
      setMinutes('');
      setSeconds('');
      return;
    }
    
    const timeParts = value.split(':');
    if (timeParts.length === 3) {
      // HH:MM:SS format
      setHours(timeParts[0]);
      setMinutes(timeParts[1]);
      setSeconds(timeParts[2]);
    } else if (timeParts.length === 2) {
      // MM:SS format
      setHours('');
      setMinutes(timeParts[0]);
      setSeconds(timeParts[1]);
    } else if (timeParts.length === 1) {
      // SS format
      setHours('');
      setMinutes('');
      setSeconds(timeParts[0]);
    }
  }, [value]);
  
  // Helper to ensure values are within valid ranges
  const validateAndFormat = (value: string, max: number): string => {
    if (!value) return '';
    const num = parseInt(value, 10);
    if (isNaN(num)) return '';
    return Math.min(num, max).toString();
  };
  
  // Handle field changes
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = validateAndFormat(e.target.value, 99);
    setHours(newHours);
    updateTime(newHours, minutes, seconds);
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = validateAndFormat(e.target.value, 59);
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, seconds);
  };
  
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = validateAndFormat(e.target.value, 59);
    setSeconds(newSeconds);
    updateTime(hours, minutes, newSeconds);
  };
  
  // Combine the fields and update the parent
  const updateTime = (h: string, m: string, s: string) => {
    let timeStr = '';
    
    if (h) {
      timeStr = `${h}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
    } else if (m) {
      timeStr = `${m}:${s.padStart(2, '0')}`;
    } else if (s) {
      timeStr = s;
    }
    
    onChange(timeStr);
  };
  
  // Handle input focus to manage navigation between fields
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };
  
  // Auto-move to next field when maxlength is reached
  const handleKeyUp = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    nextField: 'minutes' | 'seconds' | null
  ) => {
    const target = e.target as HTMLInputElement;
    
    if (target.value.length >= parseInt(target.getAttribute('maxLength') || '2', 10)) {
      if (nextField === 'minutes' && document.getElementById('minutes')) {
        document.getElementById('minutes')?.focus();
      } else if (nextField === 'seconds' && document.getElementById('seconds')) {
        document.getElementById('seconds')?.focus();
      }
    }
  };
  
  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '5px'
  };
  
  const timeInputsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };
  
  const inputStyle: React.CSSProperties = {
    padding: isMobile ? '10px' : '5px 8px',
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: '4px',
    color: 'white',
    fontSize: isMobile ? '16px' : '14px',
    minHeight: isMobile ? '44px' : '32px',
    width: '100%',
    textAlign: 'center'
  };
  
  const inputSmallStyle = {
    ...inputStyle,
    width: isMobile ? '50px' : '40px'
  };
  
  const separatorStyle: React.CSSProperties = {
    color: '#999',
    fontSize: isMobile ? '18px' : '16px',
    marginTop: '2px',
    userSelect: 'none'
  };
  
  const helpTextStyle: React.CSSProperties = {
    color: '#718096',
    fontSize: '12px',
    marginTop: '2px'
  };
  
  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      
      <div style={timeInputsContainerStyle}>
        {/* Hours input (optional) */}
        <input
          id="hours"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={hours}
          onChange={handleHoursChange}
          onFocus={handleFocus}
          onKeyUp={(e) => handleKeyUp(e, 'minutes')}
          maxLength={2}
          style={inputSmallStyle}
          aria-label="Hours"
        />
        <span style={separatorStyle}>:</span>
        
        {/* Minutes input */}
        <input
          id="minutes"
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={minutes}
          onChange={handleMinutesChange}
          onFocus={handleFocus}
          onKeyUp={(e) => handleKeyUp(e, 'seconds')}
          maxLength={2}
          style={inputSmallStyle}
          aria-label="Minutes"
        />
        <span style={separatorStyle}>:</span>
        
        {/* Seconds input */}
        <input
          id="seconds"
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={seconds}
          onChange={handleSecondsChange}
          onFocus={handleFocus}
          onKeyUp={(e) => handleKeyUp(e, null)}
          maxLength={2}
          style={inputSmallStyle}
          aria-label="Seconds"
        />
      </div>
      
      {showHelpText && (
        <span style={helpTextStyle}>HH:MM:SS format</span>
      )}
    </div>
  );
};

export default TimeInput; 