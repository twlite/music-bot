import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export async function VolumeAction(
  info: SocketUser,
  socket: Socket,
  volume: number
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  if (!isNaN(volume) && volume >= 0 && volume <= 100)
    queue.node.setVolume(volume);

  await queue.metadata.channel.send({
    embeds: [
      EmbedGenerator.Success({
        title: 'Volume updated!',
        description: `The volume was set to ${queue.node.volume}% by ${info.displayName} (<@${info.id}>).`,
      }),
    ],
  });
}
