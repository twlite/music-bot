import type { ChatInputCommandContext } from './_types.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';
import { useQueue } from '@/player/runtime';

export const command: CommandData = {
  name: 'leave',
  description: 'Disconnect the bot',
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await queue.delete();

  const embed = EmbedGenerator.Success({
    title: 'Disconnected!',
    description: 'I have successfully left the voice channel.',
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
