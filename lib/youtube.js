/**
 * Accurately extracts the 11-character YouTube Video ID from any URL format
 * (e.g., youtu.be, watch?v=, shorts, embed, or raw ID).
 * 
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubeID(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If already an 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex matching all common YouTube URL formats:
  // - https://www.youtube.com/watch?v=ID
  // - https://youtu.be/ID
  // - https://www.youtube.com/shorts/ID
  // - https://www.youtube.com/embed/ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regex);

  return match ? match[1] : null;
}

export const getYouTubeVideoId = extractYouTubeID;
