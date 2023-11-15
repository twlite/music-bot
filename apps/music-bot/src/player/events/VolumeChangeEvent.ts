import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { usePrisma } from '#bot/hooks/usePrisma';

export default class TrackStartEvent
  implements PlayerEvent<typeof GuildQueueEvent.volumeChange>
{
  public name = GuildQueueEvent.volumeChange;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldVolume: number,
    newVolume: number
  ) {
    const guildId = queue.guild.id;
    const prisma = usePrisma();

    await prisma.guild
      .upsert({
        where: { id: guildId },
        create: { id: guildId, volume: newVolume },
        update: { volume: newVolume },
      })
      .catch(() => null);
  }
}
