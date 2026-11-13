import type { QueueEventHandler } from '@/types/events';
import { syncStatistics } from '@/web/statistics';

const handler: QueueEventHandler<'audioTrackRemove'> = syncStatistics;

export default handler;
