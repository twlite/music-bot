import type { Track, Playlist } from 'discord-player';
import type { SerializedTrack, SerializedPlaylist } from '@music-bot/shared';

/** Dashboard DTO deliberately excludes provider state, stream descriptors and metadata. */
export function publicTrack(track: Track): SerializedTrack {
  return {
    id: track.id,
    live: track.live,
    requestedBy: publicRequester(track.requestedBy),
    title: track.title,
    author: track.author,
    url: track.url,
    thumbnail: track.thumbnail,
    duration: track.duration,
    durationMS: track.durationMS,
  };
}
export function publicPlaylist(playlist: Playlist): SerializedPlaylist {
  return {
    title: playlist.title,
    author: { name: playlist.author.name },
    url: playlist.url,
    thumbnail: playlist.thumbnail,
    tracks: playlist.tracks.map(publicTrack),
  };
}

/** Whitelist requester metadata; older tracks may contain only a user ID. */
function publicRequester(value: Track['requestedBy']): SerializedTrack['requestedBy'] {
  if (!value) return null;
  const data = typeof value === 'string' ? { id: value } : value;
  if (typeof data.id !== 'string') return null;
  return {
    id: data.id,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Unknown user',
    displayAvatarURL:
      typeof data.displayAvatarURL === 'string' && /^https:\/\//.test(data.displayAvatarURL)
        ? data.displayAvatarURL
        : null,
  };
}
