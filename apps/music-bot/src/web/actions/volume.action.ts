import { useQueue } from "#bot/player/runtime";
import { SocketUser } from "../socket.js";
import type { Socket } from "socket.io";
import { PlayerMetadata } from "#bot/player/PlayerMetadata";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";

export async function VolumeAction(
  info: SocketUser,
  socket: Socket,
  volume: number,
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  if (!isNaN(volume) && volume >= 0 && volume <= 100)
    await queue.node.setVolume(volume);

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: "Volume updated!",
          description: `The volume was set to ${queue.node.volume}% by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
