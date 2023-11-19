import type {
  PlayerTimestamp,
  SerializedPlaylist,
  SerializedTrack,
} from 'discord-player';

import { QueueRepeatMode } from 'discord-player';

export interface IStatistics {
  timestamp: PlayerTimestamp | null;
  listeners: number;
  tracks: number;
  volume: number;
  paused: boolean;
  repeatMode: QueueRepeatMode;
}

export interface QueueData {
  playlist: boolean;
  data: SerializedTrack[] | SerializedPlaylist;
}

export { QueueRepeatMode };

export interface SocketEvents {
  statistics: [IStatistics];
  loop: [QueueRepeatMode];
  queued: [QueueData];
  play: [QueueData];
  error: [string];
  equalizer: [number[]];
  playerStart: [SerializedTrack];
  playerFinish: [SerializedTrack];
  volume: [number];
  pause: [boolean];
}

export interface SocketActions {
  play: [string];
  search: [string];
  skip: [];
  back: [];
  volume: [number];
  pause: [boolean];
  loop: [QueueRepeatMode];
}
