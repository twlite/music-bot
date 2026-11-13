import "./youtube-runtime.js";
import { definePlugin, Track, Playlist } from "discord-player";
import { Innertube } from "youtubei.js";
import { Soundcloud } from "soundcloud.ts";

const youtube = () => (tube ??= Innertube.create());
let tube: ReturnType<typeof Innertube.create> | undefined;
const sc = new Soundcloud(process.env.SOUNDCLOUD_CLIENT_ID);

function provider(query: string) {
  try {
    const host = new URL(query).hostname;
    if (
      [
        "youtube.com",
        "www.youtube.com",
        "music.youtube.com",
        "youtu.be",
      ].includes(host)
    )
      return "youtube";
    if (["soundcloud.com", "www.soundcloud.com"].includes(host))
      return "soundcloud";
  } catch {
    return "search";
  }
  return null;
}
/** Modern native source dispatcher; encoded URLs work in both Remedia modes. */
export const mediaProviders = definePlugin({
  id: "music-bot.providers",
  setup(ctx) {
    ctx.on("search.query.match", ({ query }) =>
      provider(query) ? { score: 100 } : null,
    );
    ctx.on("search.query.resolve", async ({ query, options }, { signal }) => {
      signal.throwIfAborted();
      if (provider(query) === "soundcloud") {
        const records = query.includes("/sets/")
          ? (await sc.playlists.get(query)).tracks
          : [await sc.tracks.get(query)];
        return {
          playlist: null,
          tracks: records.map(
            (record) =>
              new Track({
                title: record.title,
                author: record.user.username,
                durationMS: record.duration,
                thumbnail: record.artwork_url ?? "",
                url: record.permalink_url,
                source: "soundcloud",
                requestedBy: options?.requestedBy,
              }),
          ),
        };
      }
      const yt = await youtube();
      let ids: string[];
      if (provider(query) === "youtube") {
        const url = new URL(query);
        const list = url.searchParams.get("list");
        if (list) {
          let page = await yt.getPlaylist(list);
          ids = [];
          while (ids.length < 1000) {
            ids.push(
              ...page.videos
                .map((video) => (video as { id?: string }).id)
                .filter((id): id is string => Boolean(id)),
            );
            if (!page.has_continuation) break;
            signal.throwIfAborted();
            page = await page.getContinuation();
          }
        } else
          ids = [
            url.hostname === "youtu.be"
              ? url.pathname.slice(1)
              : (url.searchParams.get("v") ??
                url.pathname.split("/").pop() ??
                ""),
          ];
      } else {
        const search = await yt.search(query, { type: "video" });
        ids = search.videos
          .slice(0, 10)
          .map((video) => (video as { id?: string }).id)
          .filter((id): id is string => Boolean(id));
      }
      const tracks = [];
      for (const id of ids.slice(0, 1000)) {
        signal.throwIfAborted();
        const info = (await yt.getBasicInfo(id)).basic_info;
        tracks.push(
          new Track({
            title: info.title ?? id,
            author: info.author ?? "",
            durationMS: (info.duration ?? 0) * 1000,
            thumbnail: info.thumbnail?.[0]?.url,
            url: `https://www.youtube.com/watch?v=${id}`,
            source: "youtube",
            requestedBy: options?.requestedBy,
          }),
        );
      }
      return {
        playlist:
          provider(query) === "youtube" &&
          new URL(query).searchParams.has("list")
            ? new Playlist({ title: "YouTube playlist", url: query, tracks })
            : null,
        tracks,
      };
    });
    ctx.on("track.stream", async ({ track }, { signal }) => {
      signal.throwIfAborted();
      if (provider(track.url) === "soundcloud")
        return { url: await sc.util.streamLink(track.url) };
      const yt = await youtube();
      const id = new URL(track.url).searchParams.get("v");
      if (!id) throw new Error("Cannot resolve this provider track");
      const info = await yt.getInfo(id);
      const url = await info
        .chooseFormat({ type: "audio", quality: "best" })
        .decipher(yt.session.player);
      signal.throwIfAborted();
      return { url };
    });
  },
});
