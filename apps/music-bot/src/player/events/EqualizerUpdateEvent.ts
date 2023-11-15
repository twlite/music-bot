import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { usePrisma } from '#bot/hooks/usePrisma';

type EQ = { band: number; gain: number };

export default class TrackStartEvent
  implements PlayerEvent<typeof GuildQueueEvent.equalizerUpdate>
{
  public name = GuildQueueEvent.equalizerUpdate;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldEQ: EQ[],
    newEQ: EQ[]
  ) {
    const guildId = queue.guild.id;
    const prisma = usePrisma();
    const bands = newEQ.map((eq) => eq.gain);

    await prisma.guild
      .upsert({
        where: { id: guildId },
        create: { id: guildId, equalizer: bands },
        update: { equalizer: bands },
      })
      .catch(() => null);
  }
}
