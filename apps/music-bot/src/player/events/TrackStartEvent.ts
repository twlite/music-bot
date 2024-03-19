import { GuildQueue, GuildQueueEvent, Track } from 'discord-player';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { socketInfo } from '#bot/web/socket';
import { io } from '#bot/web/index';
import { set } from 'mongoose';
import { DeleteEmbedTime } from '#bot/utils/constants';

export default class TrackStartEvent
  implements PlayerEvent<typeof GuildQueueEvent.playerStart>
{
  public name = GuildQueueEvent.playerStart;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    track: Track<unknown>
  ) {
    io.to(queue.guild.id).emit('playerStart', track.serialize());

    const embed = EmbedGenerator.Success({
      description: `[${track.title}](${track.url}) - Duración ${track.duration}`,
      title: 'Reproduciendo canción',
      image: { url: track.thumbnail },
      footer: {
        text: `Pedida por ${track.requestedBy?.tag}`,
        iconURL: track.requestedBy?.displayAvatarURL(),
      },
    });

    let message = queue.metadata.channel.send({ embeds: [embed] });

    /*
    setTimeout(async () => {
      (await message).delete();
    }, DeleteEmbedTime);
    */
  }
}
