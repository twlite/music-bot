import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useTimeline } from 'discord-player';

export const data: CommandData = {
  name: 'resume',
  description: 'Resume the current song',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const timeline = useTimeline(interaction.guildId);

  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'No hay ninguna canción',
      description: 'No estoy reproduciendo nada ahora mismo :smiling_face_with_tear:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!timeline.paused) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'No hay ninguna canción en pausa',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  timeline.resume();

  const embed = EmbedGenerator.Success({
    title: 'Continuando',
    description: 'Continuando canción',
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
