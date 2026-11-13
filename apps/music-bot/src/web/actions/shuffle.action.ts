import { useQueue } from "#bot/player/runtime";
import { SocketUser } from "../socket.js";
import type { Socket } from "socket.io";
import { PlayerMetadata } from "#bot/player/PlayerMetadata";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";

export async function ShuffleAction(
  info: SocketUser,
  socket: Socket,
  shuffling: boolean,
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  if (shuffling) {
    queue.enableShuffle();
  } else {
    queue.disableShuffle();
  }

  const state = queue.isShuffling;

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: `${state ? "Enabled" : "Disabled"} shuffle mode!`,
          description: `The shuffle mode was ${
            state ? "enabled" : "disabled"
          } by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
