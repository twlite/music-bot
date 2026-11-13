import { useQueue } from "#bot/player/runtime";
import { SocketUser } from "../socket.js";
import type { Socket } from "socket.io";
import { PlayerMetadata } from "#bot/player/PlayerMetadata";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";

export async function SkipAction(
  info: SocketUser,
  socket: Socket,
  back = false,
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  if (!back) {
    await queue.node.skip();
    if (queue.metadata.channel.isSendable())
      await queue.metadata.channel.send({
        embeds: [
          EmbedGenerator.Success({
            title: "Track skipped!",
            description: `Track was skipped to next track from the website by ${info.displayName} (<@${info.id}>).`,
          }),
        ],
      });
    return;
  }

  await queue.history.back();

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: "Track skipped!",
          description: `The track was skipped to previous track by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
