import { type GuildQueueEvents, useMainPlayer } from 'discord-player';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PlayerEventsPath } from '../utils/constants';
import type { Constructable, PlayerEvent } from './common/types';

export async function registerPlayerEvents() {
  const files = await readdir(PlayerEventsPath);
  const player = useMainPlayer();

  const loader = files.map(async (file) => {
    const { default: Event } = (await import(join(PlayerEventsPath, file))) as {
      default: Constructable<PlayerEvent<keyof GuildQueueEvents>>;
    };

    const event = new Event();

    player.events.on(event.name, event.execute.bind(event));
  });

  await Promise.all(loader);
}
