import type { EventHandler } from 'commandkit';
import { player } from '@/player/runtime';

const handler: EventHandler<'raw'> = (packet) => {
  player.receive(packet as unknown as Record<string, unknown>);
};

export default handler;
