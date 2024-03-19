import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useHistory } from 'discord-player';

export const data: CommandData = {
  name: 'back',
  description: 'Back to the previous track',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const history = useHistory(interaction.guildId);

  if (!history) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'No hay ninguna canción en reproducción',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  if (history.isEmpty()) {
    const embed = EmbedGenerator.Error({
      title: 'No hay canción anterior',
      description: 'No encuentro ninguna canción anterior que reproducir :melting_face:',
    }).withAuthor(interaction.user);
    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  await history.back();

  const embed = EmbedGenerator.Success({
    title: 'Canción saltada!',
    description: 'Volvamos a la canción anterior :arrow_backward:',
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
