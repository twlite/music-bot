import type { QueueEventHandler } from '@/types/events';
import { syncStatistics } from '@/web/statistics';

const handler: QueueEventHandler<'audioTracksAdd'> = syncStatistics;

export default handler;
