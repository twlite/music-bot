import type { QueueEventHandler } from '@/types/events';
import { syncStatistics } from '@/web/statistics';
import { releaseLyrics } from '@/web/lyrics';

const handler: QueueEventHandler<'queueDelete'> = (queue) => {
  releaseLyrics(queue);
  syncStatistics(queue);
};

export default handler;
