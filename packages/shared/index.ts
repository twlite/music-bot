import type { EqualizerBand } from './equalizer';
export * from './equalizer';
export type SocketUser = {
  id: string;
  avatar: string;
  username: string;
  displayName: string;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildAcronym: string;
};
export type TrackRequester = {
  id: string;
  displayName: string;
  displayAvatarURL: string | null;
};
export type SerializedTrack = {
  id: string;
  requestedBy: TrackRequester | null;
  live: boolean;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
  duration: string;
  durationMS: number;
};
export type SerializedPlaylist = {
  title: string;
  author: { name: string };
  tracks: SerializedTrack[];
  url: string;
  thumbnail: string;
};
export type QueueRepeatMode = 0 | 1 | 2 | 3;
export const QueueRepeatMode = {
  OFF: 0,
  TRACK: 1,
  QUEUE: 2,
  AUTOPLAY: 3,
} as const;
export interface IStatistics {
  timestamp: {
    current: { label: string; value: number };
    total: { label: string; value: number };
    progress: number;
  } | null;
  sentAt: number;
  connected: boolean;
  listeners: number;
  tracks: number;
  volume: number;
  paused: boolean;
  repeatMode: QueueRepeatMode;
  track: SerializedTrack | null;
  equalizer: EqualizerBand[];
  shuffle: boolean;
  effects: string[];
  effectPresets: { name: string; label: string }[];
  equalizerPreset: string;
}
export type QueueData = {
  playlist: boolean;
  data: SerializedTrack | SerializedPlaylist;
};
export interface SocketEvents {
  statistics: [IStatistics];
  loop: [QueueRepeatMode];
  queued: [QueueData];
  play: [QueueData];
  error: [string];
  equalizer: [EqualizerBand[]];
  playerStart: [SerializedTrack];
  playerFinish: [SerializedTrack];
  volume: [number];
  pause: [boolean];
  ready: [SocketUser];
  shuffle: [boolean];
  lyrics: [DashboardLyrics];
  queue: [SerializedTrack[]];
}
export interface SocketActions {
  play: [string];
  search: [string];
  skip: [];
  back: [];
  volume: [number];
  pause: [boolean];
  loop: [QueueRepeatMode];
  equalizer: [EqualizerBand[]];
  shuffle: [boolean];
  seek: [{ trackId: string; positionMs: number }];
  effect: [{ name: string; enabled: boolean }];
  queueRemove: [{ trackId: string }];
  queueMove: [{ trackId: string; beforeId: string | null }];
  queueNext: [{ trackId: string }];
  lyrics: [{ trackId: string }];
}

export type DashboardLyrics = {
  trackId: string;
  status: 'ready' | 'unavailable' | 'error';
  lines: { timestampMs: number; line: string }[];
  plain: string | null;
};
