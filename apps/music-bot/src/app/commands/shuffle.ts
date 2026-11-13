import type { ChatInputCommandContext } from './_types.js';
import { useQueue } from '@/player/runtime';
export const command = {
  name: 'shuffle',
  description: 'Toggle dynamic queue shuffle',
};
export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  const queue = useQueue();
  if (!queue) {
    await interaction.reply({ content: 'No queue exists.', flags: 64 });
    return;
  }
  const enabled = queue.toggleShuffle();
  await interaction.reply(`Shuffle ${enabled ? 'enabled' : 'disabled'}.`);
};
