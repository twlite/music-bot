import { definePlugin, Track, Playlist } from "discord-player";
import { parse } from "node-html-parser";
import spotifyURLInfo from "spotify-url-info";
import { player } from "./runtime.js";

export function catalogueHost(query: string) {
  try {
    const url = new URL(query);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      [
        "open.spotify.com",
        "music.apple.com",
        "vimeo.com",
        "www.vimeo.com",
        "www.reverbnation.com",
        "reverbnation.com",
      ].includes(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}
const spotify = spotifyURLInfo(fetch);
/** Catalogue metadata is searched against a playable provider, like v6 bridging. */
export const catalogues = definePlugin({
  id: "music-bot.catalogues",
  setup(ctx) {
    ctx.on("search.query.match", ({ query }) =>
      catalogueHost(query) ? { score: 200 } : null,
    );
    ctx.on("search.query.resolve", async ({ query, options }, { signal }) => {
      const url = catalogueHost(query);
      if (!url) return { tracks: [], playlist: null };
      const tracks: Track[] = [];
      if (url.hostname === "open.spotify.com") {
        const records = await spotify.getTracks(url.href, { signal });
        for (const record of records) {
          tracks.push(
            new Track({
              title: record.name,
              author: record.artist ?? "",
              url: record.uri?.startsWith("spotify:track:")
                ? `https://open.spotify.com/track/${record.uri.split(":").pop()}`
                : url.href,
              durationMS: record.duration,
              requestedBy: options?.requestedBy,
              source: "catalogue",
            }),
          );
        }
      } else if (
        url.hostname === "music.apple.com" &&
        /\d+/.test(url.pathname)
      ) {
        const id = url.searchParams.get("i") ?? url.pathname.match(/\d+$/)?.[0];
        if (!id) throw new Error("Use an Apple Music song or album URL.");
        const response = await fetch(
          `https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200`,
          { signal },
        );
        if (!response.ok) throw new Error("Apple Music metadata unavailable");
        const data = (await response.json()) as {
          results: {
            wrapperType: string;
            trackName: string;
            artistName: string;
            trackViewUrl: string;
            trackTimeMillis: number;
            artworkUrl100?: string;
          }[];
        };
        for (const record of data.results.filter(
          (r) => r.wrapperType === "track",
        ))
          tracks.push(
            new Track({
              title: record.trackName,
              author: record.artistName,
              url: record.trackViewUrl,
              durationMS: record.trackTimeMillis,
              thumbnail: record.artworkUrl100,
              requestedBy: options?.requestedBy,
              source: "catalogue",
            }),
          );
      } else {
        const response = await fetch(url, { signal, redirect: "error" });
        if (!response.ok) throw new Error("Provider metadata unavailable");
        const html = parse((await response.text()).slice(0, 2_000_000));
        const title = html
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content");
        if (!title)
          throw new Error("This provider page has no public track metadata.");
        tracks.push(
          new Track({
            title,
            url: url.href,
            requestedBy: options?.requestedBy,
            source: "catalogue",
          }),
        );
      }
      return {
        tracks,
        playlist:
          tracks.length > 1
            ? new Playlist({ title: "Media collection", url: query, tracks })
            : null,
      };
    });
    ctx.on("track.stream", async ({ track }, { signal }) => {
      const search = await player.search(`${track.author} ${track.title}`, {
        signal,
        requestedBy: track.requestedBy,
      });
      const alternative = search.tracks[0];
      if (!alternative)
        throw new Error(
          "No playable alternative was found for this catalogue track",
        );
      return player.plugins.resolveStream(alternative, { signal });
    });
  },
});
