import {
  CommandType,
  type CommandData,
  type SlashCommandProps,
} from 'commandkit';
import { ApplicationCommandOptionType } from 'discord.js';
import { handleCreatePlaylist } from './create.js';
import { handleDeletePlaylist } from './delete.js';
import { handleListPlaylists } from './list.js';

export const data: CommandData = {
  name: 'playlist',
  description: 'Export current queue to a playlist',
  type: CommandType.ChatInput,
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
            })
          ),
        },
      ],
    },
  ],
};

export async function run(props: SlashCommandProps) {
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
}
