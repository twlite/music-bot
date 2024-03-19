import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { fetchPlayerOptions } from '#bot/player/playerOptions';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { QueueRepeatMode, useMainPlayer } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';
import { DeleteEmbedTime } from '#bot/utils/constants';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export const data: CommandData = {
  name: 'play',
  description: 'Reproduce una canción',
  options: [
    {
      name: 'cola',
      description:
        'La canción a reproducir. Si quieres reproducir una playlist guardada utiliza "playlist:"',
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
  const query = interaction.options.getString('cola', true);

  await interaction.deferReply();

  const result = await player.search(query, {
    requestedBy: interaction.user,
  });

  if (!result.hasTracks()) {
    const embed = EmbedGenerator.Error({
      title: 'No hay resultados para',
      description: `No hay resultados para \`${query}\``,
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);
    
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


    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);

    const embed = EmbedGenerator.Error({
      title: 'Algo ha ido mal',
      description: `Algo ha ido mal mientras se intentaba reproducir \`${query}\``,
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }
}
