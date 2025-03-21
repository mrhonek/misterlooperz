/**
 * Fetches YouTube video information using the oEmbed API
 * This uses YouTube's oEmbed API which doesn't require an API key
 */
export const fetchVideoInfo = async (videoId: string): Promise<{ title: string }> => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }
    
    const data = await response.json();
    return {
      title: data.title || 'Unknown Title'
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    return {
      title: 'Unknown Title'
    };
  }
}; 