import type { PlayerEventHandler } from '@/types/events';

const handler: PlayerEventHandler<'error'> = (error) => {
  console.error('Player operation failed:', error.name);
};

export default handler;
