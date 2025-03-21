/**
 * Truncates text if it exceeds the maximum length
 * @param text The text to truncate
 * @param maxLength The maximum length before truncation
 * @param suffix The suffix to add to truncated text
 * @returns The truncated text with suffix or the original text
 */
export const truncateText = (text: string, maxLength: number = 60, suffix: string = '...'): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + suffix;
}; 