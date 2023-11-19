import { TrackSkipReason, useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export async function SkipAction(
  info: SocketUser,
  socket: Socket,
  back = false
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  if (!back) {
    queue.node.skip();
    return await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: 'Track skipped!',
          description: `Track was skipped to next track from the website by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
  }

  await queue.history.back();

  await queue.metadata.channel.send({
    embeds: [
      EmbedGenerator.Success({
        title: 'Track skipped!',
        description: `The track was skipped to previous track by ${info.displayName} (<@${info.id}>).`,
      }),
    ],
  });
}
