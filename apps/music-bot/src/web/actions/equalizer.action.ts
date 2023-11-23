import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export type EqualizerBand = {
  band: number;
  gain: number;
};

export async function EqualizerAction(
  info: SocketUser,
  socket: Socket,
  eq: EqualizerBand[]
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  if (
    !queue.filters.equalizer ||
    !eq.length ||
    eq.some((e) => isNaN(e.band) || isNaN(e.gain))
  )
    return;

  queue.filters.equalizer.setEQ(eq);

  await queue.metadata.channel.send({
    embeds: [
      EmbedGenerator.Success({
        title: 'Equalizer updated!',
        description: `The equalizer was updated by ${info.displayName} (<@${info.id}>).`,
      }),
    ],
  });
}
