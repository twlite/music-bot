import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useTimeline } from 'discord-player';

export const data: CommandData = {
  name: 'pause',
  description: 'Pause the current song',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const timeline = useTimeline(interaction.guildId);

  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'No hay ninguna canción en reproducción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (timeline.paused) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'La canción ya esta pausada, ansias :blush:',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  timeline.pause();

  const embed = EmbedGenerator.Success({
    title: 'Canción Pausada',
    description: 'La canción ha sido pausada la dejamos para otro momento :stop_button:',
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
