import type { AutocompleteCommand } from 'commandkit';
import type { ChatInputCommandContext } from './_types.js';
import { queueDefaults } from '@/player/effects';
import { PlayerMetadata } from '@/player/player-metadata.js';
import { fetchPlayerOptions } from '@/player/player-options.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';

import { useMainPlayer } from '@/player/runtime';
import { ApplicationCommandOptionType } from 'discord.js';

export const command: CommandData = {
  name: 'play',
  description: 'Play a song',
  options: [
    {
      name: 'query',
      description:
        'The track or playlist to play. Custom playlist id must be prefixed with "playlist:"',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
    },
  ],
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;
  const player = useMainPlayer();
  const channel = interaction.member.voice.channel!;
  const query = interaction.options.getString('query', true);

  await interaction.deferReply();

  const result = await player.search(query, {
    requestedBy: interaction.user.id,
  });

  if (!result.tracks.length) {
    const embed = EmbedGenerator.Error({
      title: 'No results found',
      description: `No results found for \`${query}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  try {
    const playerOptions = await fetchPlayerOptions(interaction.guildId);

    const { searchResult } = await player.play(channel, result, {
      nodeOptions: {
        metadata: PlayerMetadata.create(interaction),
        ...queueDefaults(playerOptions),
      },
      requestedBy: interaction.user.id,
      selfDeaf: true,
    });

    const embed = EmbedGenerator.Info({
      title: `${Boolean(searchResult.playlist) ? 'Playlist' : 'Track'} queued!`,
      thumbnail: { url: searchResult.tracks[0].thumbnail },
      description: `[${searchResult.tracks[0].title}](${searchResult.tracks[0].url})`,
      fields: searchResult.playlist
        ? [{ name: 'Playlist', value: searchResult.playlist.title }]
        : [],
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);

    const embed = EmbedGenerator.Error({
      title: 'Something went wrong',
      description: `Something went wrong while playing \`${query}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }
};

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  if (!interaction.isAutocomplete() || interaction.commandName !== 'play')
    return;
  const query = interaction.options.getString('query', true);

  if (!query.length) return interaction.respond([]);

  try {
    const player = useMainPlayer();

    const data = await player.search(query, {
      requestedBy: interaction.user.id,
    });

    if (!data.tracks.length) return interaction.respond([]);

    const results = data.tracks
      .filter((track) => track.url.length < 100)
      .slice(0, 10)
      .map((track) => ({
        name: track.title.slice(0, 100),
        value: track.url,
      }));

    return interaction.respond(results);
  } catch {
    return interaction.respond([]).catch(() => {});
  }
};
