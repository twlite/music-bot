import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { EmbedGenerator } from '../../utils/EmbedGenerator';
import { PlayerEvent } from '../common/types';
import { PlayerMetadata } from '../PlayerMetadata';

export default class TrackStartEvent
  implements PlayerEvent<typeof GuildQueueEvent.playerStart>
{
  public name = GuildQueueEvent.playerStart;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    track: Track<unknown>
  ) {
    const embed = EmbedGenerator.Success({
      description: `[${track.title}](${track.url})`,
      title: 'Now Playing',
      thumbnail: { url: track.thumbnail },
      footer: { text: `Requested by ${track.requestedBy?.tag}` },
    });

    queue.metadata.channel.send({ embeds: [embed] });
  }
}
