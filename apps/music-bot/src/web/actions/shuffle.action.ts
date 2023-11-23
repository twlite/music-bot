import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export async function ShuffleAction(
  info: SocketUser,
  socket: Socket,
  shuffling: boolean
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  if (shuffling) {
    queue.enableShuffle();
  } else {
    queue.disableShuffle();
  }

  const state = queue.isShuffling;

  await queue.metadata.channel.send({
    embeds: [
      EmbedGenerator.Success({
        title: `${state ? 'Enabled' : 'Disabled'} shuffle mode!`,
        description: `The shuffle mode was ${
          state ? 'enabled' : 'disabled'
        } by ${info.displayName} (<@${info.id}>).`,
      }),
    ],
  });
}
