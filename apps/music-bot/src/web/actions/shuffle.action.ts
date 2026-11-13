import { useQueue } from '@/player/runtime';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';

export async function ShuffleAction(info: SocketUser, socket: Socket, shuffling: boolean) {
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
          title: `${state ? 'Enabled' : 'Disabled'} shuffle mode!`,
          description: `The shuffle mode was ${state ? 'enabled' : 'disabled'} by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
