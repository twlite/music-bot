import type { QueueEventHandler } from '@/types/events';
import { publicTrack } from '@/player/public-media';
import { EmbedGenerator } from '@/utils/embed-generator';

import { io } from '@/web/index';

const handler: QueueEventHandler<'playerStart'> = async (queue, track) => {
  io.to(queue.guildId).emit('playerStart', publicTrack(track));

  const embed = EmbedGenerator.Success({
    description: `[${track.title}](${track.url})`,
    title: 'Now Playing',
    thumbnail: { url: track.thumbnail },
    footer: {
      text: `Requested by ${String(track.requestedBy ?? 'unknown')}`,
      iconURL: undefined,
    },
  });

  if (queue.metadata.channel.isSendable())
    await queue.metadata.channel.send({ embeds: [embed] });
};

export default handler;
