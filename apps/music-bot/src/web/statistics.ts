import { playbackPosition } from './position.js';
import { formatVolume } from '@/utils/format-volume';
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
  const channel = client.guilds.cache.get(guildId)?.members.me?.voice.channel;
  const position = syncPosition(guildId);
  const timestamp = queue?.node.getTimestamp();
  const value = position.positionMs;
  const label = (ms: number) => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };
  io.to(guildId).emit('statistics', {
    guildId,
    voiceChannel: channel ? { id: channel.id, name: channel.name } : null,
    effects: effects.filters,
    effectPresets,
    equalizerPreset: effects.equalizerPreset,
    equalizer: effects.equalizer.map((gain, band) => ({ band, gain })),
    playbackRate: position.playbackRate,
    timestamp: timestamp
      ? {
          current: { value, label: label(value) },
          total: timestamp.total,
          progress: position.durationMs > 0 ? Math.min(100, Math.round(value / position.durationMs * 100)) : 0,
        }
      : null,
    sentAt: Date.now(),
    connected: Boolean(queue?.node.session),
    playing: position.playing,
    listeners: channel?.isVoiceBased() ? channel.members.filter((m) => !m.user.bot).size : 0,
    tracks: queue?.tracks.size ?? 0,
    volume: formatVolume(queue?.node.volume ?? 50),
    paused: queue?.node.isPaused() ?? false,
    repeatMode: queue?.repeatMode ?? 0,
    track: queue?.currentTrack ? publicTrack(queue.currentTrack) : null,
    shuffle: queue?.isShuffling ?? false,
  });
}

/** One small authoritative correction per guild; no queue serialization or database work. */
export function syncPosition(guildId: string) {
  const position = playbackPosition(useQueue(guildId));
  io.to(guildId).emit('position', position);
  return position;
}
