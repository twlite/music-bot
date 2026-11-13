import { filterGraph } from '@/player/effects';
import { fetchPlayerOptions } from '@/player/player-options.js';
import { useDatabase } from '@/hooks/useDatabase';
import { useQueue } from '@/player/runtime';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';

export type EqualizerBand = {
  band: number;
  gain: number;
};

export async function EqualizerAction(
  info: SocketUser,
  socket: Socket,
  eq: EqualizerBand[],
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  const settings = await fetchPlayerOptions(info.guildId);
  const gains = Array.from(
    { length: 15 },
    (_, i) => eq.find((e) => e.band === i)?.gain ?? settings.equalizer[i],
  );
  await queue.filters.setRaw(filterGraph(gains, settings.filters));
  await useDatabase().guild.updateOne(
    { id: info.guildId },
    { $set: { equalizer: gains } },
    { runValidators: true },
  );
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
