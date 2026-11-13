import { type GuildQueueEventsMap } from "discord-player";
import { useMainPlayer } from "#bot/player/runtime";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { PlayerEventsPath } from "#bot/utils/constants";
import type { Constructable, PlayerEvent } from "./common/types.js";

export async function registerPlayerEvents() {
  const files = (await readdir(PlayerEventsPath)).filter((file) =>
    file.endsWith(".js"),
  );
  const player = useMainPlayer();

  const loader = files.map(async (file) => {
    const { default: Event } = (await import(
      pathToFileURL(join(PlayerEventsPath, file)).href
    )) as {
      default: Constructable<PlayerEvent<keyof GuildQueueEventsMap>>;
    };

    const event = new Event();

    player.events.on(
      event.name,
      (...args: GuildQueueEventsMap[keyof GuildQueueEventsMap]) => {
        void Promise.resolve(event.execute(...args)).catch(() =>
          console.error(`Playback event ${event.name} failed`),
        );
      },
    );
  });

  await Promise.all(loader);
}
