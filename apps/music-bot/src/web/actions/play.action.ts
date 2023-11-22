import { QueueRepeatMode, useMainPlayer, useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { fetchPlayerOptions } from '#bot/player/playerOptions';

export async function PlayAction(
  info: SocketUser,
  socket: Socket,
  query: string
) {
  const player = useMainPlayer();
  const guild = player.client.guilds.cache.get(info.guildId);

  if (!guild) return socket.disconnect(true);

  let queue = useQueue<PlayerMetadata>(info.guildId);

  if (!queue) {
    const channel = guild.members.cache.get(info.id)?.voice.channel;
    if (!channel) return socket.disconnect(true);

    try {
      const playerOptions = await fetchPlayerOptions(guild.id);

      queue = player.nodes.create(guild, {
        metadata: new PlayerMetadata({ channel }),
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
      });

      await queue.connect(channel);
    } catch {
      socket.emit('error', 'Failed to join your voice channel.');
      return socket.disconnect(true);
    }
  }

  try {
    const result = await queue.play(query, {
      requestedBy: info.id,
    });

    await queue.metadata.channel.send({
      embeds: [
        EmbedGenerator.Success({
          title: `${
            result.searchResult.hasPlaylist() ? 'Playlist' : 'Track'
          } queued!`,
          description: `The ${
            result.searchResult.hasPlaylist() ? 'playlist' : 'track'
          } **${
            result.searchResult.playlist?.title ||
            result.searchResult.tracks[0].title
          }** was added to the queue by ${info.displayName} (<@${info.id}>).`,
        }),
      ],
    });

    return socket.emit('queued', {
      playlist: result.searchResult.hasPlaylist(),
      data: (result.searchResult.playlist || result.track).serialize(),
    });
  } catch {
    return socket.emit('error', 'Failed to play that track.');
  }
}
