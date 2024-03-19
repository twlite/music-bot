import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';

export const data: CommandData = {
  name: 'leave',
  description: 'Disconnect the bot',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: 'No hay canción en reproducción',
      description: 'Pero si no estoy reproduciendo nada hombre :expressionless:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  queue.delete();

  const embed = EmbedGenerator.Success({
    title: 'Desconectado!',
    description: 'Venga ya me voy, esta me la guardo :pleading_face:',
  }).withAuthor(interaction.user);
  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
