import type { Track, Playlist } from "discord-player";
import type { SerializedTrack, SerializedPlaylist } from "@music-bot/shared";

/** Dashboard DTO deliberately excludes provider state, stream descriptors and metadata. */
export function publicTrack(track: Track): SerializedTrack {
  return {
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
