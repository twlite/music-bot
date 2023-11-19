import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { useDatabase } from '#bot/hooks/useDatabase';

export default class DSPUpdateEvent
  implements PlayerEvent<typeof GuildQueueEvent.dspUpdate>
{
  public name = GuildQueueEvent.dspUpdate;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldFilters: string[],
    newFilters: string[]
  ) {
    const guildId = queue.guild.id;
    const db = useDatabase();

    await db.guild
      .findOneAndUpdate(
        { id: guildId },
        { id: guildId, filters: newFilters },
        { upsert: true, new: true }
      )
      .catch(() => null);
  }
}
