import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { useDatabase } from '#bot/hooks/useDatabase';
import { io } from '#bot/web/index';

type EQ = { band: number; gain: number };

export default class EqualizerUpdateEvent
  implements PlayerEvent<typeof GuildQueueEvent.equalizerUpdate>
{
  public name = GuildQueueEvent.equalizerUpdate;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldEQ: EQ[],
    newEQ: EQ[]
  ) {
    io.to(queue.guild.id).emit('equalizer', newEQ);
    const guildId = queue.guild.id;
    const db = useDatabase();
    const bands = newEQ.map((eq) => eq.gain);

    await db.guild
      .findOneAndUpdate(
        { id: guildId },
        { id: guildId, equalizer: bands },
        { new: true, upsert: true }
      )
      .catch(() => null);
  }
}
