import { requester } from '@/player/requester';
import { rememberEffects } from '@/player/effects';
import { publicTrack, publicPlaylist } from '@/player/public-media';
import { player, useQueue } from '@/player/runtime';
import { client } from '@/bootstrap/client';
import { fetchPlayerOptions } from '@/player/player-options.js';
import { queueDefaults } from '@/player/effects';
import { PlayerMetadata } from '@/player/player-metadata.js';
import type { SocketUser } from '../socket.js';
import type { Socket } from 'socket.io';

export async function PlayAction(info: SocketUser, socket: Socket, query: string) {
  const guild = client.guilds.cache.get(info.guildId);
  const member = await guild?.members.fetch(info.id);
  const channel = member?.voice.channel;
  if (!channel) return socket.emit('error', 'Join a voice channel first.');
  const existing = useQueue<PlayerMetadata>(info.guildId);
  const textChannel = existing?.metadata.channel;
  if (!textChannel?.isSendable()) return socket.emit('error', 'Start playback with /play in Discord first.');
  const settings = await fetchPlayerOptions(info.guildId);
  const who = requester(member!.user);
  const found = await player.search(query, { requestedBy: who });
  for (const track of found.tracks) track.requestedBy = who;
  const result = await player.play(channel, found, {
    requestedBy: requester(member!.user),
    nodeOptions: {
      metadata: new PlayerMetadata({ channel: textChannel }),
      ...queueDefaults(settings),
    },
  });
  rememberEffects(result.queue, settings);
  socket.emit('queued', {
    playlist: Boolean(result.searchResult.playlist),
    data: result.searchResult.playlist
      ? publicPlaylist(result.searchResult.playlist)
      : publicTrack(result.searchResult.tracks[0]),
  });
}
