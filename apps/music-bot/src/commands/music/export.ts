import { usePrisma } from '#bot/hooks/usePrisma';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue, serialize, type SerializedTrack } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'export',
  description: 'Export current queue to a playlist',
  options: [
    {
      name: 'name',
      description: 'The name of the playlist',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'private',
      description: 'Whether or not the playlist is private',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;
  const db = usePrisma();
  const name = interaction.options.getString('name', true);
  const isPrivate = !!interaction.options.getBoolean('private', false);

  await interaction.deferReply({
    ephemeral: isPrivate,
  });

  const queue = useQueue(interaction.guildId);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (queue.isEmpty()) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'You cannot export an empty queue',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const tracks = [queue.currentTrack, ...queue.tracks.store]
    .filter(Boolean)
    .map((track) => serialize(track));

  await db.user.upsert({
    where: {
      id: interaction.user.id,
    },
    update: {},
    create: {
      id: interaction.user.id,
    },
  });

  const playlist = await db.playlist.create({
    data: {
      name,
      private: isPrivate,
      authorId: interaction.user.id,
      tracks,
    },
  });

  const embed = EmbedGenerator.Success({
    title: 'Playlist created',
    description: `I have successfully created the playlist \`${playlist.name}\` (ID: \`${playlist.id}\`) with ${tracks.length} tracks.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
