import type { GuildQueueEventsMap } from "discord-player";
export type Constructable<T> = new (...args: any[]) => T;
export interface PlayerEvent<T extends keyof GuildQueueEventsMap> {
  name: T;
  execute(...args: GuildQueueEventsMap[T]): unknown;
}
