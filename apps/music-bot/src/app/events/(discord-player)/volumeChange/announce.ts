import type { QueueEventHandler } from '@/types/events';
import { useDatabase } from '@/hooks/useDatabase';
import { io } from '@/web/index';

const handler: QueueEventHandler<'volumeChange'> = async (queue, _oldVolume, newVolume) => {
  io.to(queue.guildId).emit('volume', newVolume);
  const guildId = queue.guildId;
  const db = useDatabase();

  await db.guild
    .findOneAndUpdate({ id: guildId }, { id: guildId, volume: newVolume }, { returnDocument: 'after', upsert: true })
    .catch(() => null);
};

export default handler;
