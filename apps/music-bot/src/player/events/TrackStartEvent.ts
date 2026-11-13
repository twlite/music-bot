import { publicTrack } from "#bot/player/public-media";
import { GuildQueue, Track } from "discord-player";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import { PlayerEvent } from "../common/types.js";
import { PlayerMetadata } from "../PlayerMetadata.js";

import { io } from "#bot/web/index";

export default class TrackStartEvent implements PlayerEvent<"playerStart"> {
  public name = "playerStart" as const;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    track: Track<unknown>,
  ) {
    io.to(queue.guildId).emit("playerStart", publicTrack(track));

    const embed = EmbedGenerator.Success({
      description: `[${track.title}](${track.url})`,
      title: "Now Playing",
      thumbnail: { url: track.thumbnail },
      footer: {
        text: `Requested by ${String(track.requestedBy ?? "unknown")}`,
        iconURL: undefined,
      },
    });

    if (queue.metadata.channel.isSendable())
      await queue.metadata.channel.send({ embeds: [embed] });
  }
}
