/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (timeInSeconds: number | null): string => {
  if (timeInSeconds === null) return '';
  
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Parse time input in MM:SS format to seconds
 */
export const parseTimeInput = (timeString: string): number | null => {
  // If empty string, return null
  if (!timeString.trim()) return null;

  // Split by :
  const parts = timeString.split(':');
  
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