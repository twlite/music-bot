import { publicTrack, publicPlaylist } from '@/player/public-media';
import { player, useQueue } from '@/player/runtime';
import { client } from '@/bootstrap/client';
import { fetchPlayerOptions } from '@/player/player-options.js';
import { queueDefaults } from '@/player/effects';
import { PlayerMetadata } from '@/player/player-metadata.js';
import type { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';

export async function PlayAction(
  info: SocketUser,
  socket: Socket,
  query: string,
) {
  const guild = client.guilds.cache.get(info.guildId);
  const member = await guild?.members.fetch(info.id);
  const channel = member?.voice.channel;
  if (!channel) return socket.emit('error', 'Join a voice channel first.');
  const existing = useQueue<PlayerMetadata>(info.guildId);
  const textChannel = existing?.metadata.channel;
  if (!textChannel?.isSendable())
    return socket.emit('error', 'Start playback with /play in Discord first.');
  const result = await player.play(channel, query, {
    requestedBy: info.id,
    nodeOptions: {
      metadata: new PlayerMetadata({ channel: textChannel }),
      ...queueDefaults(await fetchPlayerOptions(info.guildId)),
    },
  });
  socket.emit('queued', {
    playlist: Boolean(result.searchResult.playlist),
    data: result.searchResult.playlist
      ? publicPlaylist(result.searchResult.playlist)
      : publicTrack(result.searchResult.tracks[0]),
  });
}
