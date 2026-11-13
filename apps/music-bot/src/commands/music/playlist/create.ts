import type { ChatInputCommandContext } from "#bot/commands/types";
import { useDatabase } from "#bot/hooks/useDatabase";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";

import { serialize } from "discord-player";
import { useQueue } from "#bot/player/runtime";

export async function handleCreatePlaylist({
  interaction,
}: ChatInputCommandContext) {
  const db = useDatabase();
  const name = interaction.options.getString("name", true);
  const isPrivate = !!interaction.options.getBoolean("private", false);
  const isUnlisted = !!interaction.options.getBoolean("unlisted", false);

  await interaction.deferReply({
    ephemeral: isPrivate,
  });

  const queue = useQueue(interaction.guildId!);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!queue.currentTrack && queue.isEmpty()) {
    const embed = EmbedGenerator.Error({
      title: "Error",
      description: "You cannot export an empty queue",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const playlistsCount = await db.playlist.countDocuments({
    author: interaction.user.id,
  });

  if (playlistsCount >= 50) {
    const embed = EmbedGenerator.Error({
      title: "Error",
      description: "You cannot create more than 50 playlists.",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const tracks = [queue.currentTrack, ...queue.tracks.toArray()]
    .filter(Boolean)
    .map((track) => serialize(track!));

  const playlist = await db.playlist.create({
    name,
    private: isPrivate,
    unlisted: isUnlisted,
    author: interaction.user.id,
    tracks,
  });

  const embed = EmbedGenerator.Success({
    title: "Playlist created",
    description: `I have successfully created the playlist \`${playlist.name}\` (\`playlist:${playlist.id}\`) with ${tracks.length} tracks. You can play it using \`/play\` command.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
