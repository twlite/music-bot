import { useDatabase } from '#bot/hooks/useDatabase';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { SlashCommandProps } from 'commandkit';

const ITEMS_PER_PAGE = 10 as const;

export async function handleListPlaylists({ interaction }: SlashCommandProps) {
  await interaction.deferReply({ ephemeral: true });
  const db = useDatabase();
  const page = interaction.options.getInteger('limit', false) ?? 0;

  const playlists = await db.playlist
    .find({
      author: interaction.user.id,
    })
    .skip(page * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  if (!playlists.length) {
    return interaction.editReply({
      embeds: [
        EmbedGenerator.Error({
          description:
            page === 0
              ? 'You have no saved playlists.'
              : `No items found for page ${page + 1}!`,
          title: 'Error!',
        }).withAuthor(interaction.user),
      ],
    });
  }

  const embed = EmbedGenerator.Success({
    title: 'Your custom playlists',
    description: playlists
      .map(
        (playlist, idx) =>
          `${++idx}. **${playlist.name}** - \`playlist:${playlist.id}\``
      )
      .join('\n'),
    footer: {
      text: `You have total ${playlists.length}/50 playlists.`,
    },
  }).withAuthor(interaction.user);

  interaction.editReply({ embeds: [embed] });
}
