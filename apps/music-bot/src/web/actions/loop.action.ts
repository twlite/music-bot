import { useDatabase } from '@/hooks/useDatabase';
import { useQueue } from '@/player/runtime';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';

export async function LoopAction(
  info: SocketUser,
  socket: Socket,
  mode: 0 | 1 | 2 | 3,
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  if (!['OFF', 'TRACK', 'QUEUE', 'AUTOPLAY'][mode]) return;

  queue.setRepeatMode(mode);
  await useDatabase().guild.updateOne(
    { id: info.guildId },
    { $set: { loopMode: mode } },
    { upsert: true, runValidators: true },
  );

  socket.to(info.guildId).emit('loop', mode);

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: 'Loop mode updated!',
          description: `The loop mode was set to ${['OFF', 'TRACK', 'QUEUE', 'AUTOPLAY'][mode]} by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
