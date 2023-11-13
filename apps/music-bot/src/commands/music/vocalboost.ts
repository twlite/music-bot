import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'vocalboost',
  description: 'Toggle vocal boost filter',
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
      { band: 0, gain: -0.2 },
      { band: 1, gain: -0.2 },
      { band: 2, gain: 0.2 },
      { band: 3, gain: 0.15 },
      { band: 4, gain: 0.1 },
      { band: 5, gain: -0.1 },
    ]);
  } else {
    queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.Flat);
  }

  const embed = EmbedGenerator.Success({
    title: 'Success',
    description: `I have successfully ${
      state ? 'enabled' : 'disabled'
    } the vocal boost filter.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
