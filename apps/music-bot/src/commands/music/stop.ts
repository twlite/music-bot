import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';

export const data: CommandData = {
  name: 'stop',
  description: 'Stop the player',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'No hay canción',
      description: 'No se esta reproduciendo anda ahora mismo :upside_down_face:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  queue.node.stop();

  const embed = EmbedGenerator.Success({
    title: 'Cola cancelada',
    description: 'Bueno lo dejamos para otro momento :melting_face:',
  }).withAuthor(interaction.user);

  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
