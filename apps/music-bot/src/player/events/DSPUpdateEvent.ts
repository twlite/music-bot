import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { usePrisma } from '#bot/hooks/usePrisma';

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
    const prisma = usePrisma();

    await prisma.guild
      .upsert({
        where: { id: guildId },
        create: { id: guildId, filters: newFilters },
        update: { filters: newFilters },
      })
      .catch(() => null);
  }
}
