import { publicTrack, publicPlaylist } from "#bot/player/public-media";
import { player, useQueue } from "#bot/player/runtime";
import { client } from "#bot/bootstrap/client";
import { fetchPlayerOptions } from "#bot/player/playerOptions";
import { queueDefaults } from "#bot/player/effects";
import { PlayerMetadata } from "#bot/player/PlayerMetadata";
import type { SocketUser } from "../socket.js";
import type { Socket } from "socket.io";

export async function PlayAction(
  info: SocketUser,
  socket: Socket,
  query: string,
) {
  const guild = client.guilds.cache.get(info.guildId);
  const member = await guild?.members.fetch(info.id);
  const channel = member?.voice.channel;
  if (!channel) return socket.emit("error", "Join a voice channel first.");
  const existing = useQueue<PlayerMetadata>(info.guildId);
  const textChannel = existing?.metadata.channel;
  if (!textChannel?.isSendable())
    return socket.emit("error", "Start playback with /play in Discord first.");
  const result = await player.play(channel, query, {
    requestedBy: info.id,
    nodeOptions: {
      metadata: new PlayerMetadata({ channel: textChannel }),
      ...queueDefaults(await fetchPlayerOptions(info.guildId)),
    },
  });
  socket.emit("queued", {
    playlist: Boolean(result.searchResult.playlist),
    data: result.searchResult.playlist
      ? publicPlaylist(result.searchResult.playlist)
      : publicTrack(result.searchResult.tracks[0]),
  });
}
