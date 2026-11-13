import { publicTrack } from '@/player/public-media';
import { useQueue } from '@/player/runtime';
import { serialize } from 'discord-player';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import { useDatabase } from '@/hooks/useDatabase';
import type { ChatInputCommandContext } from './_types.js';
import { type CommandData } from 'commandkit';
import { ApplicationCommandOptionType } from 'discord.js';

export const command: CommandData = {
  name: 'playlist',
  description: 'Export current queue to a playlist',
  options: [
    {
      name: 'create',
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Create a new playlist',
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
        {
          name: 'unlisted',
          description: 'Whether or not the playlist is unlisted',
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: 'delete',
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Delete a playlist',
      options: [
        {
          name: 'id',
          description: 'The id of the playlist to delete',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'list',
      type: ApplicationCommandOptionType.Subcommand,
      description: 'List all playlists',
      options: [
        {
          name: 'page',
          description: 'The page to view (0-5)',
          required: false,
          type: ApplicationCommandOptionType.Integer,
          choices: Array.from(
            {
              length: 5,
            },
            (_, index) => ({
              name: `Page ${index + 1}`,
              value: index,
            }),
          ),
        },
      ],
    },
  ],
};

export const chatInput = async (props: ChatInputCommandContext) => {
  const { interaction } = props;
  if (!interaction.inCachedGuild()) return;

  const subcommand = interaction.options.getSubcommand(true);

  switch (subcommand) {
    case 'create':
      return handleCreatePlaylist(props);
    case 'delete':
      return handleDeletePlaylist(props);
    case 'list':
      return handleListPlaylists(props);
  }
};

async function handleCreatePlaylist({ interaction }: ChatInputCommandContext) {
  const db = useDatabase();
  const name = interaction.options.getString('name', true);
  const isPrivate = !!interaction.options.getBoolean('private', false);
  const isUnlisted = !!interaction.options.getBoolean('unlisted', false);

  await interaction.deferReply({
    ephemeral: isPrivate,
  });

  const queue = useQueue();

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!queue.currentTrack && queue.isEmpty()) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'You cannot export an empty queue',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const playlistsCount = await db.playlist.countDocuments({
    author: interaction.user.id,
  });

  if (playlistsCount >= 50) {
    const embed = EmbedGenerator.Error({
      title: 'Error',
      description: 'You cannot create more than 50 playlists.',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const tracks = [queue.currentTrack, ...queue.tracks.toArray()]
    .filter(Boolean)
    .map((track) => ({ ...serialize(track!), requester: publicTrack(track!).requestedBy }));

  const playlist = await db.playlist.create({
    name,
    private: isPrivate,
    unlisted: isUnlisted,
    author: interaction.user.id,
    tracks,
  });

  const embed = EmbedGenerator.Success({
    title: 'Playlist created',
    description: `I have successfully created the playlist \`${playlist.name}\` (\`playlist:${playlist.id}\`) with ${tracks.length} tracks. You can play it using \`/play\` command.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

async function handleDeletePlaylist({ interaction }: ChatInputCommandContext) {
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

const ITEMS_PER_PAGE = 10 as const;

async function handleListPlaylists({ interaction }: ChatInputCommandContext) {
  await interaction.deferReply({ ephemeral: true });
  const db = useDatabase();
  const page = interaction.options.getInteger('page', false) ?? 0;

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
          description: page === 0 ? 'You have no saved playlists.' : `No items found for page ${page + 1}!`,
          title: 'Error!',
        }).withAuthor(interaction.user),
      ],
    });
  }

  const embed = EmbedGenerator.Success({
    title: 'Your custom playlists',
    description: playlists
      .map((playlist, idx) => `${++idx}. **${playlist.name}** - \`playlist:${playlist.id}\``)
      .join('\n'),
    footer: {
      text: `You have total ${playlists.length}/50 playlists.`,
    },
  }).withAuthor(interaction.user);

  interaction.editReply({ embeds: [embed] });
}
