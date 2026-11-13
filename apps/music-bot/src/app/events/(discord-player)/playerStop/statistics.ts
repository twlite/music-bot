import type { QueueEventHandler } from '@/types/events';
import { syncStatistics } from '@/web/statistics';
import { releaseLyrics } from '@/web/lyrics';

const handler: QueueEventHandler<'playerStop'> = (queue) => {
  releaseLyrics(queue);
  syncStatistics(queue);
};

export default handler;
