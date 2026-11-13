import { GuildQueue } from "discord-player";
import { PlayerEvent } from "../common/types.js";
import { PlayerMetadata } from "../PlayerMetadata.js";
import { useDatabase } from "#bot/hooks/useDatabase";
import { io } from "#bot/web/index";

export default class VolumeChangeEvent implements PlayerEvent<"volumeChange"> {
  public name = "volumeChange" as const;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldVolume: number,
    newVolume: number,
  ) {
    io.to(queue.guildId).emit("volume", newVolume);
    const guildId = queue.guildId;
    const db = useDatabase();

    await db.guild
      .findOneAndUpdate(
        { id: guildId },
        { id: guildId, volume: newVolume },
        { new: true, upsert: true },
      )
      .catch(() => null);
  }
}
