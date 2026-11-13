import { effectState, effectPresets } from '@/player/effects';
import type { GuildQueue, Track } from 'discord-player';
import type { SerializedTrack } from '@music-bot/shared';
import type { Socket } from 'socket.io';

const queueCache = new WeakMap<GuildQueue, { tracks: Track[]; data: SerializedTrack[] }>();
import { io } from './io.js';
import { useQueue } from '@/player/runtime';
import { client } from '@/bootstrap/client';
import { publicTrack } from '@/player/public-media';

export function sendQueue(guildId: string, target?: Socket) {
  const queue = useQueue(guildId);
  const items = queue?.tracks.toArray() ?? [];
  const cached = queue && queueCache.get(queue);
  const changed =
    !cached || cached.tracks.length !== items.length || items.some((track, i) => track !== cached.tracks[i]);
  const data = changed ? items.map(publicTrack) : cached.data;
  if (queue && changed) queueCache.set(queue, { tracks: items, data });
  if (target) target.emit('queue', data);
  else if (changed) io.to(guildId).emit('queue', data);
}

export function syncStatistics({ guildId }: { guildId: string }) {
  const queue = useQueue(guildId);
  sendQueue(guildId);
  const effects = effectState(queue);
  const channel = client.guilds.cache.get(guildId)?.channels.cache.get(queue?.node.session?.channelId ?? '');
  io.to(guildId).emit('statistics', {
    effects: effects.filters,
    effectPresets,
    equalizerPreset: effects.equalizerPreset,
    equalizer: effects.equalizer.map((gain, band) => ({ band, gain })),
    timestamp: queue?.node.getTimestamp(true) ?? null,
    sentAt: Date.now(),
    connected: Boolean(queue?.node.session),
    listeners: channel?.isVoiceBased() ? channel.members.filter((m) => !m.user.bot).size : 0,
    tracks: queue?.tracks.size ?? 0,
    volume: queue?.node.volume ?? 50,
    paused: queue?.node.isPaused() ?? false,
    repeatMode: queue?.repeatMode ?? 0,
    track: queue?.currentTrack ? publicTrack(queue.currentTrack) : null,
    shuffle: queue?.isShuffling ?? false,
  });
}
