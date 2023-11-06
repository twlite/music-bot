import { GuildQueueEvents } from 'discord-player';
import { PlayerMetadata } from '../PlayerMetadata.js';

export interface PlayerEvent<
  K extends keyof GuildQueueEvents,
  M = PlayerMetadata,
> {
  name: K;
  execute: GuildQueueEvents<M>[K];
}

export type Constructable<T> = new (...args: any[]) => T;
