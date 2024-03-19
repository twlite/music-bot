import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
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
      title: 'Error',
      description: 'No hay ninguna canción en reproducción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!queue.filters.equalizer) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'El ecualizador no esta disponible para esta canción :neutral_face:',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

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
    title: 'Exito!',
    description: `He ${
      state ? 'habilitado' : 'deshabilitado'
    } el boost de vocales.`,
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
