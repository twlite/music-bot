import type { ChatInputCommandContext } from './_types.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';
import { useQueue } from '@/player/runtime';

export const command: CommandData = {
  name: 'skip',
  description: 'Skip to the next track',
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue();

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await queue.node.skip();

  const embed = EmbedGenerator.Success({
    title: 'Track skipped!',
    description: 'I have successfully skipped to the next track.',
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
