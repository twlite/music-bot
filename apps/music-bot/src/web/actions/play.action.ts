import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';

export async function PlayAction(
  info: SocketUser,
  socket: Socket,
  query: string
) {
  const queue = useQueue<PlayerMetadata>(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  try {
    const hasTrack = queue.currentTrack;
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

    return socket.emit(hasTrack ? 'queued' : 'play', {
      playlist: result.searchResult.hasPlaylist(),
      data: (result.searchResult.playlist || result.track).serialize(),
    });
  } catch {
    return socket.emit('error', 'No results found');
  }
}
