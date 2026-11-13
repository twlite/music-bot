import type { GuildQueue } from 'discord-player';
import type { PlaybackPosition } from '@music-bot/shared';

export const POSITION_UPDATE_INTERVAL_MS = 5000;

/** Use Remedia's output clock, not the potentially read-ahead source-media position. */
export function playbackPosition(queue: GuildQueue | null): PlaybackPosition {
  const timestamp = queue?.node.getTimestamp();
  const durationMs = Math.max(0, timestamp?.total.value ?? 0);
  return {
    trackId: queue?.currentTrack?.id ?? null,
    positionMs: Math.max(0, Math.min(durationMs || Infinity, timestamp?.current.value ?? 0)),
    durationMs,
    paused: queue?.node.isPaused() ?? true,
    playing: Boolean(queue?.currentTrack && queue.node.session?.state === 'playing'),
    sentAt: Date.now(),
  };
}
