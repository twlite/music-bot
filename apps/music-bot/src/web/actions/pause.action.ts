import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export async function PauseAction(
  info: SocketUser,
  socket: Socket,
  paused: boolean
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  queue.node.setPaused(paused);

  const state = queue.node.isPaused();

  await queue.metadata.channel.send({
    embeds: [
      EmbedGenerator.Success({
        title: `Track ${state ? 'paused' : 'resumed'}!`,
        description: `The track was ${state ? 'paused' : 'resumed'} by ${
          info.displayName
        } (<@${info.id}>).`,
      }),
    ],
  });

  socket.to(info.guildId).emit('pause', state);
}
