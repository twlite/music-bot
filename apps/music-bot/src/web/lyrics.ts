import { automaticLyricsTrack } from '@/player/lyrics-query';
import type { GuildQueue, LyricsResult } from 'discord-player';
import type { DashboardLyrics } from '@music-bot/shared';

type Entry = { controller: AbortController; result: Promise<LyricsResult[]> };
const cache = new WeakMap<GuildQueue, { trackId: string; requests: Map<string, Entry> }>();

export function releaseLyrics(queue: GuildQueue) {
  for (const entry of cache.get(queue)?.requests.values() ?? []) entry.controller.abort();
  cache.delete(queue);
}

/** Share bounded lookups across tabs; manual searches use the native free-text lyrics API. */
export async function getLyrics(queue: GuildQueue, query = '', resultIndex?: number): Promise<DashboardLyrics> {
  const track = queue.currentTrack;
  if (!track) throw new Error('No track is playing.');
  query = query.trim();
  if (cache.get(queue)?.trackId !== track.id) {
    releaseLyrics(queue);
    cache.set(queue, { trackId: track.id, requests: new Map() });
  }
  const requests = cache.get(queue)!.requests;
  let entry = requests.get(query);
  if (!entry) {
    // Keep at most four queries for this track, including an automatic lookup.
    if (requests.size >= 4) {
      const oldest = requests.keys().next().value!;
      requests.get(oldest)?.controller.abort();
      requests.delete(oldest);
    }
    const controller = new AbortController();
    const result = queue.player.lyrics.search(query || automaticLyricsTrack(track), {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    });
    entry = { controller, result };
    requests.set(query, entry);
  }
  try {
    const results = (await entry.result)
      .filter((result) => result.synced.available || result.plain.available)
      .slice(0, 8);
    const index =
      resultIndex ??
      Math.max(
        0,
        results.findIndex((result) => result.synced.available),
      );
    const match = results[index];
    return {
      trackId: track.id,
      query,
      resultIndex: index,
      status: match ? 'ready' : 'unavailable',
      choices: results.map((result, index) => {
        const metadata =
          result.metadata && typeof result.metadata === 'object' && !Array.isArray(result.metadata)
            ? result.metadata
            : {};
        const lines = result.synced.available ? result.synced.lines.filter((line) => line.line.trim()) : [];
        const id = metadata.id;
        return {
          index,
          album:
            typeof metadata.albumName === 'string' && metadata.albumName.trim()
              ? metadata.albumName.slice(0, 200)
              : null,
          recordId:
            (typeof id === 'number' && Number.isSafeInteger(id) && id >= 0) ||
            (typeof id === 'string' && /^\d{1,20}$/.test(id))
              ? String(id)
              : null,
          lineCount: lines.length,
          firstLineMs: lines[0]?.timestampMs ?? null,
          lastLineMs: lines.at(-1)?.timestampMs ?? null,
          title: typeof metadata.trackName === 'string' ? metadata.trackName : query || track.title,
          artist: typeof metadata.artistName === 'string' ? metadata.artistName : track.author,
          synced: result.synced.available,
        };
      }),
      lines: match?.synced.available ? [...match.synced.lines].slice(0, 5000) : [],
      plain: match?.plain.available ? match.plain.text.slice(0, 100000) : null,
    };
  } catch {
    if (requests.get(query) === entry) requests.delete(query);
    return { trackId: track.id, query, status: 'error', lines: [], plain: null };
  }
}
