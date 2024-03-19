import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
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
      description: 'El Ecualizador no esta disponible para esta canción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (state) {
    queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.FullBass);
  } else {
    queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.Flat);
  }

  const embed = EmbedGenerator.Success({
    title: 'Exito!',
    description: `He ${
      state ? 'habilitado' : 'deshabilitado'
    } el filtro bassboost.`,
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
