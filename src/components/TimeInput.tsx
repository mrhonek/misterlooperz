import React, { useState, useEffect, useRef } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showHelpText?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  label,
  showHelpText = true
}) => {
  const isMobile = window.innerWidth <= 768;
  
  // Generate unique IDs for this instance to avoid conflicts with multiple instances
  const uniqueId = useRef(`time-input-${Math.random().toString(36).substr(2, 9)}`);
  const hoursId = `${uniqueId.current}-hours`;
  const minutesId = `${uniqueId.current}-minutes`;
  const secondsId = `${uniqueId.current}-seconds`;
  
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
    
    // First, remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // If empty after filtering, return empty
    if (!numericValue) return '';
    
    // Always preserve the user's input as-is as long as it's numeric and within max value
    const num = parseInt(numericValue, 10);
    
    // If the input exceeds max value, cap it
    if (num > max) return max.toString();
    
    // Otherwise, return exactly what the user entered
    // This preserves single and double digits exactly as typed
    return numericValue.slice(0, 2); // Limit to 2 digits max
  };
  
  // Handle field changes
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newHours = validateAndFormat(newValue, 99);
    setHours(newHours);
    updateTime(newHours, minutes, seconds);
    
    // Auto-advance if user enters a double-digit number
    if (newValue.length >= 2 && document.getElementById(minutesId)) {
      document.getElementById(minutesId)?.focus();
    }
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newMinutes = validateAndFormat(newValue, 59);
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, seconds);
    
    // Auto-advance if user enters a double-digit number
    if (newValue.length >= 2 && document.getElementById(secondsId)) {
      document.getElementById(secondsId)?.focus();
    }
  };
  
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newSeconds = validateAndFormat(newValue, 59);
    setSeconds(newSeconds);
    updateTime(hours, minutes, newSeconds);
  };
  
  // Combine the fields and update the parent with a consistent format
  const updateTime = (h: string, m: string, s: string) => {
    // If we have nothing, return an empty string
    if (!h && !m && !s) {
      onChange('');
      return;
    }

    // If we only have seconds, pass it directly as seconds
    if (!h && !m && s) {
      console.log('TimeInput setting seconds-only value:', s);
      onChange(s);
      return;
    }
    
    // Format minutes and seconds with leading zeros if needed
    const formattedMinutes = m.padStart(2, '0');
    const formattedSeconds = s.padStart(2, '0');
    
    // If we have hours, use HH:MM:SS format
    if (h) {
      const timeStr = `${h}:${formattedMinutes}:${formattedSeconds}`;
      console.log('TimeInput setting HH:MM:SS value:', timeStr);
      onChange(timeStr);
      return;
    }
    
    // Otherwise, use MM:SS format
    if (m || s) {
      const timeStr = `${m || '0'}:${formattedSeconds}`;
      console.log('TimeInput setting MM:SS value:', timeStr);
      onChange(timeStr);
      return;
    }
  };
  
  // Handle input focus to manage navigation between fields
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
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
          id={hoursId}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={hours}
          onChange={handleHoursChange}
          onFocus={handleFocus}
          maxLength={2}
          style={inputSmallStyle}
          aria-label="Hours"
        />
        <span style={separatorStyle}>:</span>
        
        {/* Minutes input */}
        <input
          id={minutesId}
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={minutes}
          onChange={handleMinutesChange}
          onFocus={handleFocus}
          maxLength={2}
          style={inputSmallStyle}
          aria-label="Minutes"
        />
        <span style={separatorStyle}>:</span>
        
        {/* Seconds input */}
        <input
          id={secondsId}
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={seconds}
          onChange={handleSecondsChange}
          onFocus={handleFocus}
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