import type {
  PlayerTimestamp,
  SerializedPlaylist,
  SerializedTrack,
} from 'discord-player';

import { QueueRepeatMode } from 'discord-player';
import { EqualizerBand } from './actions/equalizer.action.js';

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

export interface IStatistics {
  timestamp: PlayerTimestamp | null;
  listeners: number;
  tracks: number;
  volume: number;
  paused: boolean;
  repeatMode: QueueRepeatMode;
  track: SerializedTrack | null;
  equalizer: EqualizerBand[];
  shuffle: boolean;
}

export interface QueueData {
  playlist: boolean;
  data: SerializedTrack[] | SerializedPlaylist;
}

export { QueueRepeatMode, SerializedTrack, SerializedPlaylist };

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
