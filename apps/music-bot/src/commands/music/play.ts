import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { fetchPlayerOptions } from '#bot/player/playerOptions';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { QueueRepeatMode, useMainPlayer } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
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

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;
  const player = useMainPlayer();
  const channel = interaction.member.voice.channel!;
  const query = interaction.options.getString('query', true);

  await interaction.deferReply();

  const result = await player.search(query, {
    requestedBy: interaction.user,
  });

  if (!result.hasTracks()) {
    const embed = EmbedGenerator.Error({
      title: 'No results found',
      description: `No results found for \`${query}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  try {
    const playerOptions = await fetchPlayerOptions(interaction.guildId);

    const { track, searchResult } = await player.play(channel, result, {
      nodeOptions: {
        metadata: PlayerMetadata.create(interaction),
        volume: playerOptions.volume,
        repeatMode: QueueRepeatMode[
          playerOptions.loopMode
        ] as unknown as QueueRepeatMode,
        a_filter: playerOptions.filters as ('8D' | 'Tremolo' | 'Vibrato')[],
        equalizer: playerOptions.equalizer.map((eq, i) => ({
          band: i,
          gain: eq,
        })),
        noEmitInsert: true,
        leaveOnStop: false,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
        pauseOnEmpty: true,
        preferBridgedMetadata: true,
        disableBiquad: true,
      },
      requestedBy: interaction.user,
      connectionOptions: {
        deaf: true,
      },
    });

    const embed = EmbedGenerator.Info({
      title: `${searchResult.hasPlaylist() ? 'Playlist' : 'Track'} queued!`,
      thumbnail: { url: track.thumbnail },
      description: `[${track.title}](${track.url})`,
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
}
