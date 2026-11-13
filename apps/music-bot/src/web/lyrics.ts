import type { GuildQueue } from 'discord-player';
import type { DashboardLyrics } from '@music-bot/shared';

const cache = new WeakMap<
  GuildQueue,
  { trackId: string; controller: AbortController; result: Promise<DashboardLyrics> }
>();

export function releaseLyrics(queue: GuildQueue) {
  cache.get(queue)?.controller.abort();
  cache.delete(queue);
}

/** Coalesce requests across dashboard clients, retaining only the current track per queue. */
export function getLyrics(queue: GuildQueue): Promise<DashboardLyrics> {
  const track = queue.currentTrack;
  if (!track) throw new Error('No track is playing.');
  const entry = cache.get(queue);
  if (entry?.trackId === track.id) return entry.result;
  releaseLyrics(queue);
  const controller = new AbortController();
  const result = queue.player.lyrics
    .search(track, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
    .then((results) => {
      const match =
        results.find((result) => result.synced.available) ?? results.find((result) => result.plain.available);
      return {
        trackId: track.id,
        status: match ? ('ready' as const) : ('unavailable' as const),
        lines: match?.synced.available ? [...match.synced.lines].slice(0, 5000) : [],
        plain: match?.plain.available ? match.plain.text : null,
      };
    })
    .catch((): DashboardLyrics => ({ trackId: track.id, status: 'error', lines: [], plain: null }));
  cache.set(queue, { trackId: track.id, controller, result });
  return result;
}
