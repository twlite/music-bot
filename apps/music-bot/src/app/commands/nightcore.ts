import { toggleEffect } from '@/player/effects';
import { EmbedGenerator } from '@/utils/embed-generator';
import type { CommandData } from 'commandkit';
import { useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';
import { ChatInputCommandContext } from './_types';

export const command: CommandData = {
  name: 'nightcore',
  description: 'nightcore command',
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

  const queue = useQueue();

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await toggleEffect(queue, 'nightcore', state);

  const embed = EmbedGenerator.Success({
    title: 'Success',
    description: `I have successfully ${state ? 'enabled' : 'disabled'} the nightcore filter.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
