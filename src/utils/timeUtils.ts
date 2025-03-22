/**
 * Format time in seconds to HH:MM:SS format
 */
export const formatTime = (timeInSeconds: number | null): string => {
  if (timeInSeconds === null) return '';
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Parse time input in HH:MM:SS or MM:SS format to seconds
 */
export const parseTimeInput = (timeString: string): number | null => {
  // If empty string, return null
  if (!timeString || !timeString.trim()) {
    console.log('Empty time string, returning null');
    return null;
  }

  // Normalize input by trimming and ensuring we have proper delimiters
  const normalizedTimeString = timeString.trim();
  
  // Log the time string we're parsing
  console.log('Parsing time string:', normalizedTimeString);

  // Split by :
  const parts = normalizedTimeString.split(':');
  console.log('Split into parts:', parts);
  
  // Handle HH:MM:SS format
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    console.log('Parsed as HH:MM:SS:', { hours, minutes, seconds });
    
    // Validate parts are numbers
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      console.warn('Invalid time format (NaN values):', parts);
      return null;
    }
    
    // Validate minutes and seconds are in valid range
    if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
      console.warn('Invalid time values (out of range):', {hours, minutes, seconds});
      return null;
    }
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    console.log('Parsed HH:MM:SS format to seconds:', totalSeconds);
    return totalSeconds;
  }
  
  // Handle MM:SS format
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    console.log('Parsed as MM:SS:', { minutes, seconds });
    
    // Validate parts are numbers
    if (isNaN(minutes) || isNaN(seconds)) {
      console.warn('Invalid time format (NaN values):', parts);
      return null;
    }
    
    // Validate seconds are in valid range
    if (seconds < 0 || seconds >= 60) {
      console.warn('Invalid time values (out of range):', {minutes, seconds});
      return null;
    }
    
    const totalSeconds = minutes * 60 + seconds;
    console.log('Parsed MM:SS format to seconds:', totalSeconds);
    return totalSeconds;
  }
  
  // Handle SS format
  if (parts.length === 1) {
    // Make sure we're dealing with a clean number
    const trimmedPart = parts[0].trim();
    const seconds = parseInt(trimmedPart, 10);
    console.log('Parsed as SS:', seconds);
    
    if (isNaN(seconds)) {
      console.warn('Invalid time format (NaN value):', parts[0]);
      return null;
    }
    
    // Just return the number directly as seconds
    console.log('Parsed SS format to seconds:', seconds);
    return seconds;
  }
  
  console.warn('Unable to parse time format:', timeString);
  return null;
};

/**
 * Alias for parseTimeInput for naming consistency
 */
export const parseTimeString = parseTimeInput; 