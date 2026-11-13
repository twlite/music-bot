import { setEqualizer } from '@/player/effects';
import { useQueue } from '@/player/runtime';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';

export type EqualizerBand = {
  band: number;
  gain: number;
};

export async function EqualizerAction(info: SocketUser, socket: Socket, eq: EqualizerBand[]) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  await setEqualizer(queue, eq);
  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: 'Equalizer updated!',
          description: `The equalizer was updated by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });
}
