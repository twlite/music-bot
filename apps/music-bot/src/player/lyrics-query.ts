import { Track } from 'discord-player';

const labels = new Set([
  'official',
  'music',
  'video',
  'lyric',
  'lyrics',
  'audio',
  'visualizer',
  'visualiser',
  'with',
  'hd',
  'hq',
  '4k',
  '1080p',
  '720p',
]);

function isReleaseLabel(value: string) {
  const words = value
    .toLowerCase()
    .replace(/[._:/|+-]/g, ' ')
    .trim()
    .split(/\s+/);
  return (
    words.length > 0 &&
    words.every((word) => labels.has(word)) &&
    words.some((word) => !['official', 'music', 'with'].includes(word))
  );
}

/** Remove presentation labels, retaining musical versions such as Live, Remix and Remaster. */
export function lyricsTitle(title: string) {
  let result = title
    .replace(/\(([^()]*)\)|\[([^\[\]]*)\]/g, (label, round, square) => (isReleaseLabel(round ?? square) ? ' ' : label))
    .replace(/\s+/g, ' ')
    .trim();
  let previous: string;
  do {
    previous = result;
    result = result.replace(/\s+[-–—|]\s+([^-–—|]+)$/, (label, text) => (isReleaseLabel(text) ? '' : label)).trim();
  } while (previous !== result);
  return result || title;
}

/** Make a lookup-only Track; never rewrite the displayed title or queued source metadata. */
export function automaticLyricsTrack(track: Track): Track {
  const author = track.author.replace(/\s+[-–—]\s*Topic$/i, '').trim();
  let title = lyricsTitle(track.title);
  for (const separator of [' - ', ' – ', ' — ']) {
    const prefix = author + separator;
    if (author && title.toLowerCase().startsWith(prefix.toLowerCase())) title = title.slice(prefix.length).trim();
  }
  if (title === track.title && author === track.author) return track;
  return new Track({
    id: track.id,
    title,
    author,
    url: track.url,
    durationMS: track.durationMS,
    live: track.live,
    sourceReference: track.sourceReference,
    lyricsReference: track.lyricsReference,
  });
}
