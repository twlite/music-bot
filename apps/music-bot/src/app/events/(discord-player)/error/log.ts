import type { QueueEventHandler } from '@/types/events';

const handler: QueueEventHandler<'error'> = (queue, error) => {
  console.error('Queue or voice operation failed', {
    queue: queue.id,
    error,
  });
};

export default handler;
