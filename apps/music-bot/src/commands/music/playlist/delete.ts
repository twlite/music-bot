import { useDatabase } from '#bot/hooks/useDatabase';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { SlashCommandProps } from 'commandkit';

export async function handleDeletePlaylist({ interaction }: SlashCommandProps) {
  const db = useDatabase();
  const id = interaction.options.getString('id', true).replace('playlist:', '');

  await interaction.deferReply({
    ephemeral: true,
  });

  const playlist = await db.playlist.findOneAndDelete({
    id,
    author: interaction.user.id,
  });

  if (!playlist) {
    return interaction.editReply({
      embeds: [
        EmbedGenerator.Error({
          title: 'Error',
          description: `You do not have a playlist with id \`playlist:${id}\``,
        }).withAuthor(interaction.user),
      ],
    });
  }

  return interaction.editReply({
    embeds: [
      EmbedGenerator.Success({
        title: 'Success',
        description: `I have successfully deleted the playlist **${playlist.name}**`,
      }).withAuthor(interaction.user),
    ],
  });
}
