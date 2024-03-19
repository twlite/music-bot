import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: '8d',
  description: 'Toggle 8D filter',
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
      description: 'No hay ninguna canción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!queue.filters.filters) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'El filtro 8d no esta disponible para esta canción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);
    return interaction.editReply({ embeds: [embed] });
  }

  if (state) {
    queue.filters.filters.setFilters(['8D']);
  } else {
    queue.filters.filters.setFilters([]);
  }

  const embed = EmbedGenerator.Success({
    title: 'Success',
    description: `He  ${
      state ? 'puesto' : 'quitado'
    } el filtro 8D.`,
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
