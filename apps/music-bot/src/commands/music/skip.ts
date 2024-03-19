import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';

export const data: CommandData = {
  name: 'skip',
  description: 'Skip to the next track',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'No hay ninguna canción',
      description: 'No estoy reproduciendo nada ahora mismo :smiling_face_with_tear:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  queue.node.skip();

  const embed = EmbedGenerator.Success({
    title: 'Canción saltada',
    description: 'Ya me estaba aburriendo de esta yo tambien :wink:',
  }).withAuthor(interaction.user);

  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
