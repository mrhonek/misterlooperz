/**
 * Represents a YouTube video in the playlist
 */
export interface Video {
  id: string;
  videoId: string;
  url: string;
  title: string;
  startTime: number | null;
  endTime: number | null;
} 