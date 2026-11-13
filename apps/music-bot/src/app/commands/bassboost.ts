import type { ChatInputCommandContext } from './_types.js';
import { toggleEffect } from '@/player/effects';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';
import { useQueue } from '@/player/runtime';
import { ApplicationCommandOptionType } from 'discord.js';

export const command: CommandData = {
  name: 'bassboost',
  description: 'Toggle bass boost filter',
  options: [
    {
      name: 'state',
      description: 'Whether to enable or disable the filter',
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    },
  ],
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;
  const state = interaction.options.getBoolean('state', true);
  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await toggleEffect(queue, 'bassboost', state);

  const embed = EmbedGenerator.Success({
    title: 'Success',
    description: `I have successfully ${
      state ? 'enabled' : 'disabled'
    } the bass boost filter.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
