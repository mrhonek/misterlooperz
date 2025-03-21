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
  if (!timeString.trim()) return null;

  // Split by :
  const parts = timeString.split(':');
  
  // Handle HH:MM:SS format
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    // Validate parts are numbers
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    
    // Validate minutes and seconds are in valid range
    if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // Handle MM:SS format
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    // Validate parts are numbers
    if (isNaN(minutes) || isNaN(seconds)) return null;
    
    // Validate seconds are in valid range
    if (seconds < 0 || seconds >= 60) return null;
    
    return minutes * 60 + seconds;
  }
  
  // Handle SS format
  if (parts.length === 1) {
    const seconds = parseInt(parts[0], 10);
    if (isNaN(seconds)) return null;
    return seconds;
  }
  
  return null;
};

/**
 * Alias for parseTimeInput for naming consistency
 */
export const parseTimeString = parseTimeInput; 