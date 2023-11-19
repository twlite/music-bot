import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { useDatabase } from '#bot/hooks/useDatabase';
import { io } from '#bot/web/index';

export default class VolumeChangeEvent
  implements PlayerEvent<typeof GuildQueueEvent.volumeChange>
{
  public name = GuildQueueEvent.volumeChange;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldVolume: number,
    newVolume: number
  ) {
    io.to(queue.guild.id).emit('volume', newVolume);
    const guildId = queue.guild.id;
    const db = useDatabase();

    await db.guild
      .findOneAndUpdate(
        { id: guildId },
        { id: guildId, volume: newVolume },
        { new: true, upsert: true }
      )
      .catch(() => null);
  }
}
