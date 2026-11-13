import { publicTrack, publicPlaylist } from "#bot/player/public-media";
import { useQueue } from "#bot/player/runtime";
import { SocketUser } from "../socket.js";
import type { Socket } from "socket.io";

export async function SearchAction(
  info: SocketUser,
  socket: Socket,
  query: string,
) {
  const queue = useQueue(info.guildId);
  if (!queue?.node.session) return socket.disconnect(true);

  try {
    const hasTrack = queue.currentTrack;
    const result = await queue.player.search(query, {
      requestedBy: info.id,
    });

    if (result.isEmpty()) return socket.emit("error", "No results found");

    return socket.emit(hasTrack ? "queued" : "play", {
      playlist: Boolean(result.playlist),
      data: result.playlist
        ? publicPlaylist(result.playlist)
        : publicTrack(result.tracks[0]),
    });
  } catch {
    return socket.emit("error", "No results found");
  }
}
