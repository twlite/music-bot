import type { EventHandler } from 'commandkit';
import { player, registerSourceHosts } from '@/player/runtime';

const handler: EventHandler<'clientReady'> = async (client) => {
  await player.initialize(client.user.id);

  if (player.remedia?.nodes.some((node) => node.type === 'embedded')) {
    await registerSourceHosts();
  }
};

export default handler;
