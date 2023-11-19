import { useQueue } from 'discord-player';
import { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';

export async function SearchAction(
  info: SocketUser,
  socket: Socket,
  query: string
) {
  const queue = useQueue(info.guildId);
  if (!queue?.connection) return socket.disconnect(true);

  try {
    const hasTrack = queue.currentTrack;
    const result = await queue.player.search(query, {
      requestedBy: info.id,
    });

    if (result.isEmpty()) return socket.emit('error', 'No results found');

    return socket.emit(hasTrack ? 'queued' : 'play', {
      playlist: result.hasPlaylist(),
      data: (result.playlist || result.tracks[0]).serialize(),
    });
  } catch {
    return socket.emit('error', 'No results found');
  }
}
