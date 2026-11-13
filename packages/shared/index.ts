export type EqualizerBand = { band: number; gain: number };
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
export type SerializedTrack = {
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
  listeners: number;
  tracks: number;
  volume: number;
  paused: boolean;
  repeatMode: QueueRepeatMode;
  track: SerializedTrack | null;
  equalizer: EqualizerBand[];
  shuffle: boolean;
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
}
