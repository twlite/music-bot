import { usePrisma } from '#bot/hooks/usePrisma';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import {
  QueueRepeatMode,
  SerializedTrack,
  Track,
  deserialize,
  useMainPlayer,
} from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'import',
  description: 'Import your saved/exported playlist',
  options: [
    {
      name: 'id',
      description: 'The playlist id to import',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;
  const db = usePrisma();
  const player = useMainPlayer();
  const channel = interaction.member.voice.channel!;
  const id = interaction.options.getString('id', true);

  await interaction.deferReply();

  const result = await db.playlist.findUnique({
    where: {
      id,
    },
  });

  if (!result || (result.authorId !== interaction.user.id && result.private)) {
    const embed = EmbedGenerator.Error({
      title: 'No playlist found',
      description: `No playlist found with id \`${id}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const playlist = player.createPlaylist({
    author: {
      name: interaction.user.username,
      url: '',
    },
    description: '',
    id: result.id,
    source: 'arbitrary',
    thumbnail: '',
    title: result.name,
    tracks: [],
    type: 'playlist',
    url: '',
  });

  const tracks = result.tracks.map((track) => {
    const song = deserialize(
      player,
      track as SerializedTrack
    ) as Track<unknown>;

    song.playlist = playlist;

    return song;
  });

  playlist.tracks = tracks;

  try {
    const { track } = await player.play(channel, playlist, {
      nodeOptions: {
        metadata: PlayerMetadata.create(interaction),
        volume: 50,
        repeatMode: QueueRepeatMode.AUTOPLAY,
        noEmitInsert: true,
        leaveOnStop: false,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
        pauseOnEmpty: true,
        preferBridgedMetadata: true,
      },
      requestedBy: interaction.user,
      connectionOptions: {
        deaf: true,
      },
    });

    const embed = EmbedGenerator.Info({
      title: 'Playlist queued!',
      description: playlist.title,
      thumbnail: { url: track.thumbnail },
      fields: [
        { name: 'Now Playing', value: `[${track.title}](${track.url})` },
      ],
      footer: {
        text: `Queued ${playlist.tracks.length} tracks`,
      },
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);

    const embed = EmbedGenerator.Error({
      title: 'Something went wrong',
      description: `Something went wrong while loading custom playlist: \`${id}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }
}
