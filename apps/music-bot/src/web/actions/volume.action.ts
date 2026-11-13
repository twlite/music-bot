import { formatVolume } from '@/utils/format-volume';
import { useQueue } from '@/player/runtime';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';

export async function VolumeAction(info: SocketUser, socket: Socket, volume: number) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  if (!isNaN(volume) && volume >= 0 && volume <= 100) await queue.node.setVolume(volume);

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: 'Volume updated!',
          description: `The volume was set to ${formatVolume(queue.node.volume)}% by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
