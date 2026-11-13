import type { GuildQueue } from 'discord-player';
import type { PlaybackPosition } from '@music-bot/shared';

export const POSITION_UPDATE_INTERVAL_MS = 5000;

/**
 * Dashboard progress uses source-media time, not duration after tempo filtering.
 * Remedia's client owns the interpolated clock; older deployments fall back to
 * the reported source position and a rate derived from their filtergraph.
 */
function tempoFactor(graph: string | null | undefined): number | null {
  if (!graph) return 1;
  let speed = 1;
  let sampleRate = 48000;
  for (const part of graph.split(/[,;]/)) {
    const [name, args = ''] = part.trim().split(/=(.*)/s);
    if (name === 'aresample') {
      const rate = Number(args.split(':')[0]);
      if (Number.isFinite(rate) && rate > 0) sampleRate = rate;
    } else if (name === 'asetrate') {
      const match = /^(\d+(?:\.\d+)?)(?:\s*\*\s*(\d+(?:\.\d+)?))?(?::.*)?$/.exec(args);
      if (!match) return null;
      const rate = Number(match[1]) * Number(match[2] ?? 1);
      if (!Number.isFinite(rate) || rate <= 0) return null;
      speed *= rate / sampleRate;
      sampleRate = rate;
    } else if (name === 'atempo') {
      const match = /^(?:tempo=)?(\d+(?:\.\d+)?)$/.exec(args);
      if (!match) return null;
      const value = Number(match[1]);
      if (!Number.isFinite(value) || value <= 0) return null;
      speed *= value;
    } else if (/^(?:asetpts|atrim|aloop|areverse|rubberband|apad|silenceremove)$/.test(name ?? '')) return null;
  }
  return Number.isFinite(speed) && speed > 0 ? speed : null;
}

export function playbackPosition(queue: GuildQueue | null): PlaybackPosition {
  const session = queue?.node.session as
    | (NonNullable<GuildQueue['node']['session']> & {
        getMediaTime?: () => number | null;
        getPlaybackRate?: () => number | null;
      })
    | null
    | undefined;
  const timestamp = queue?.node.getTimestamp();
  const durationMs = Math.max(0, timestamp?.total.value ?? 0);
  const observed = session?.getMediaTime?.() ?? session?.position.mediaMs ?? timestamp?.current.value ?? 0;
  const playbackRate = session?.getPlaybackRate?.() ?? tempoFactor(queue?.node.filters.graph);
  const positionMs = Math.max(0, Math.min(durationMs || Infinity, observed));
  return {
    trackId: queue?.currentTrack?.id ?? null,
    positionMs,
    durationMs,
    playbackRate,
    paused: queue?.node.isPaused() ?? true,
    playing: Boolean(queue?.currentTrack && session?.state === 'playing'),
    sentAt: Date.now(),
  };
}
