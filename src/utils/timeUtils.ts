/**
 * Format time in seconds to HH:MM:SS format for display purposes
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
  
  // Handle seconds-only format (single number)
  if (parts.length === 1) {
    // Make sure we're dealing with a clean number
    const trimmedPart = parts[0].trim();
    const seconds = parseInt(trimmedPart, 10);
    console.log('Parsed as direct seconds:', seconds);
    
    if (isNaN(seconds)) {
      console.warn('Invalid direct seconds (NaN value):', parts[0]);
      return null;
    }
    
    console.log('Using direct seconds value:', seconds);
    return seconds;
  }
  
  // Handle MM:SS format
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0; // Default to 0 if NaN
    const seconds = parseInt(parts[1], 10) || 0; // Default to 0 if NaN
    
    console.log('Parsed as MM:SS:', { minutes, seconds });
    
    // Validate seconds are in valid range
    if (seconds >= 60) {
      console.warn('Seconds out of range, adjusting:', seconds);
      // Instead of error, we can adjust - add excess seconds to minutes
      const adjustedMinutes = minutes + Math.floor(seconds / 60);
      const adjustedSeconds = seconds % 60;
      const totalSeconds = adjustedMinutes * 60 + adjustedSeconds;
      console.log('Adjusted to:', { adjustedMinutes, adjustedSeconds, totalSeconds });
      return totalSeconds;
    }
    
    const totalSeconds = minutes * 60 + seconds;
    console.log('Parsed MM:SS format to seconds:', totalSeconds);
    return totalSeconds;
  }
  
  // Handle HH:MM:SS format
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;    // Default to 0 if NaN
    const minutes = parseInt(parts[1], 10) || 0;  // Default to 0 if NaN
    const seconds = parseInt(parts[2], 10) || 0;  // Default to 0 if NaN
    
    console.log('Parsed as HH:MM:SS:', { hours, minutes, seconds });
    
    // Adjust times if they're out of range
    let adjustedHours = hours;
    let adjustedMinutes = minutes;
    let adjustedSeconds = seconds;
    
    // If seconds >= 60, add to minutes
    if (adjustedSeconds >= 60) {
      adjustedMinutes += Math.floor(adjustedSeconds / 60);
      adjustedSeconds = adjustedSeconds % 60;
    }
    
    // If minutes >= 60, add to hours
    if (adjustedMinutes >= 60) {
      adjustedHours += Math.floor(adjustedMinutes / 60);
      adjustedMinutes = adjustedMinutes % 60;
    }
    
    const totalSeconds = adjustedHours * 3600 + adjustedMinutes * 60 + adjustedSeconds;
    console.log('Parsed HH:MM:SS format to seconds:', totalSeconds);
    return totalSeconds;
  }
  
  console.warn('Unable to parse time format:', timeString);
  return null;
};

/**
 * Alias for parseTimeInput for naming consistency
 */
export const parseTimeString = parseTimeInput; 