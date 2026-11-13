import type { QueueEventHandler } from '@/types/events';

const handler: QueueEventHandler<'playerError'> = () => {
  console.error('Track playback failed; use /skip or retry /play');
};

export default handler;
