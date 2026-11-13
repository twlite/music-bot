import type { ChatInputCommandContext } from './_types.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';
import { useTimeline } from '@/player/runtime';
import { ApplicationCommandOptionType } from 'discord.js';

export const command: CommandData = {
  name: 'volume',
  description: 'Get or manipulate the volume',
  options: [
    {
      name: 'value',
      description: 'The volume to set',
      min_value: 0,
      max_value: 100,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const timeline = useTimeline();

  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const amount = interaction.options.getInteger('value', false);

  if (amount != null) {
    await timeline.setVolume(amount);

    const embed = EmbedGenerator.Success({
      title: 'Volume changed',
      description: `I have successfully changed the volume to ${amount}%.`,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const embed = EmbedGenerator.Success({
    title: 'Volume',
    description: `The current volume is \`${timeline.volume}%\`.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
