import { config } from '@/config';
import { definePlugin, Track } from 'discord-player';

/** Limit direct native URL access to explicitly trusted media hosts. */
export function mediaURL(query: string, hosts: readonly string[] = config.mediaAllowedHosts) {
  try {
    const url = new URL(query);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    if (!hosts.includes(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
export const directMedia = definePlugin({
  id: 'music-bot.direct-media',
  setup(ctx) {
    ctx.on('search.query.match', ({ query }) => (mediaURL(query) ? { score: 1 } : null));
    ctx.on('search.query.resolve', async ({ query, options }, { signal }) => {
      const url = mediaURL(query);
      if (!url) return { tracks: [], playlist: null };
      const metadata = await ctx.player
        .getRemedia(false)
        ?.probe({ url: url.href }, { signal })
        .catch(() => null);
      return {
        playlist: null,
        tracks: [
          new Track({
            url: url.href,
            title: metadata?.metadata?.title ?? decodeURIComponent(url.pathname.split('/').pop() || url.hostname),
            author: metadata?.metadata?.artist ?? url.hostname,
            durationMS: metadata?.durationMs ?? undefined,
            requestedBy: options?.requestedBy,
          }),
        ],
      };
    });
    ctx.on('track.stream', ({ track }) => {
      const url = mediaURL(track.url);
      if (!url)
        throw new Error(
          'Media host is not allowed. Update mediaAllowedHosts in app.config.json for trusted providers.',
        );
      return { url: url.href };
    });
  },
});
