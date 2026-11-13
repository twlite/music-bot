import type { QueueEventHandler } from '@/types/events';

const handler: QueueEventHandler<'error'> = () => {
  console.error('Queue or voice operation failed');
};

export default handler;
