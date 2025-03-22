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
  
  // Helper to ensure values are within valid ranges and pure numbers
  const validateInput = (input: string, max: number): string => {
    // Allow empty input
    if (!input) return '';
    
    // Remove non-numeric characters
    const numericOnly = input.replace(/\D/g, '');
    
    // If empty after filtering, return empty string
    if (!numericOnly) return '';
    
    // Always preserve the exact user input (up to 2 digits) unless it exceeds maximum
    const num = parseInt(numericOnly, 10);
    
    // Only limit the value if it exceeds max allowed
    if (num > max) {
      return max.toString();
    }
    
    // Otherwise return exactly what the user entered (limited to 2 digits)
    return numericOnly.slice(0, 2);
  };
  
  // Generate the time string from individual fields
  const generateTimeString = (h: string, m: string, s: string): string => {
    // If all fields are empty, return empty string
    if (!h && !m && !s) return '';
    
    // For seconds-only format (no hours or minutes)
    if (!h && !m && s) {
      return s;
    }
    
    // For MM:SS format (no hours)
    if (!h && (m || s)) {
      // Don't pad or manipulate the seconds value, keep it exactly as entered
      // Only pad zeros for display formatting, not for the actual value
      return `${m || '0'}:${s || '0'}`;
    }
    
    // For HH:MM:SS format
    if (h) {
      // Don't pad or manipulate the input values
      return `${h}:${m || '0'}:${s || '0'}`;
    }
    
    // Fallback (shouldn't reach here)
    return '';
  };
  
  // Handle field changes
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = validateInput(e.target.value, 99);
    setHours(newHours);
    
    const timeString = generateTimeString(newHours, minutes, seconds);
    onChange(timeString);
    
    // Auto-advance if user enters 2 digits
    if (newHours.length === 2) {
      document.getElementById(minutesId)?.focus();
    }
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = validateInput(e.target.value, 59);
    setMinutes(newMinutes);
    
    const timeString = generateTimeString(hours, newMinutes, seconds);
    onChange(timeString);
    
    // Auto-advance if user enters 2 digits
    if (newMinutes.length === 2) {
      document.getElementById(secondsId)?.focus();
    }
  };
  
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = validateInput(e.target.value, 59);
    setSeconds(newSeconds);
    
    const timeString = generateTimeString(hours, minutes, newSeconds);
    onChange(timeString);
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