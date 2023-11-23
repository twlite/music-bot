import { GuildQueue, GuildQueueEvent } from 'discord-player';
import { PlayerEvent } from '../common/types.js';
import { PlayerMetadata } from '../PlayerMetadata.js';
import { useDatabase } from '#bot/hooks/useDatabase';
import { io } from '#bot/web/index';
import type { EqualizerBand } from '#bot/web/actions/equalizer.action';

export default class EqualizerUpdateEvent
  implements PlayerEvent<typeof GuildQueueEvent.equalizerUpdate>
{
  public name = GuildQueueEvent.equalizerUpdate;

  public async execute(
    queue: GuildQueue<PlayerMetadata>,
    _oldEQ: EqualizerBand[],
    newEQ: EqualizerBand[]
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
