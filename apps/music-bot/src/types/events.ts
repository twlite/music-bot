import type { DiscordPlayerEvents, GuildQueue, GuildQueueEventsMap } from 'discord-player';
import type { PlayerMetadata } from '@/player/player-metadata';

/** Infer queue payloads from v8 while retaining this bot's queue metadata. */
export type QueueEventHandler<Event extends keyof GuildQueueEventsMap> = (
  ...args: GuildQueueEventsMap[Event] extends [unknown, ...infer Args]
    ? [queue: GuildQueue<PlayerMetadata>, ...args: Args]
    : never
) => void | Promise<void>;

/** Infer player-level payloads from v8's event map. */
export type PlayerEventHandler<Event extends keyof DiscordPlayerEvents> = (
  ...args: DiscordPlayerEvents[Event]
) => void | Promise<void>;
