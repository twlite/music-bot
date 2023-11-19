import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'piano',
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

export async function run({ interaction }: SlashCommandProps) {
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

  if (!queue.filters.equalizer) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'Equalizer is not enabled for this track',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (state) {
    queue.filters.equalizer.setEQ([
      { band: 0, gain: -0.25 },
      { band: 1, gain: -0.25 },
      { band: 2, gain: -0.125 },
      { band: 3, gain: 0.0 },
      { band: 4, gain: 0.25 },
      { band: 5, gain: 0.25 },
      { band: 6, gain: 0.0 },
      { band: 7, gain: -0.25 },
      { band: 8, gain: -0.25 },
      { band: 9, gain: 0.0 },
      { band: 10, gain: 0.0 },
      { band: 11, gain: 0.5 },
      { band: 12, gain: 0.25 },
      { band: 13, gain: -0.025 },
      { band: 14, gain: 0.0 },
    ]);
  } else {
    queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.Flat);
  }

  const embed = EmbedGenerator.Success({
    title: 'Success',
    description: `I have successfully ${
      state ? 'enabled' : 'disabled'
    } the bass boost filter.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
