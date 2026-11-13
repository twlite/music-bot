import type { QueueEventHandler } from '@/types/events';
import { syncStatistics } from '@/web/statistics';

const handler: QueueEventHandler<'playerPause'> = syncStatistics;

export default handler;
