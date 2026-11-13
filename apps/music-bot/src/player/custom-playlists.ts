import { definePlugin, Playlist } from "discord-player";
import { useDatabase } from "#bot/hooks/useDatabase";
import { player } from "./runtime.js";
import { savedTrackURL } from "./persistence.js";

/** Resolves saved public URLs through the currently registered source plugins. */
export const customPlaylists = definePlugin({
  id: "music-bot.playlists",
  setup(ctx) {
    ctx.on("search.query.match", ({ query }) =>
      /^playlist:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        query,
      )
        ? { score: 1000 }
        : null,
    );
    ctx.on("search.query.resolve", async ({ query, options }, { signal }) => {
      const requester = options?.requestedBy;
      const userId = typeof requester === "string" ? requester : requester?.id;
      const record = await useDatabase()
        .playlist.findOne({
          id: query.slice(9),
          $or: [{ private: false }, { author: userId }],
        })
        .lean();
      const tracks = [];
      for (const saved of record?.tracks ?? []) {
        signal.throwIfAborted();
        const url = savedTrackURL(saved);
        if (!url)
          throw new Error(
            "Saved track has no safe public URL; original playlist has been retained",
          );
        const result = await player.search(url, {
          requestedBy: requester,
          signal,
        });
        if (!result.tracks[0])
          throw new Error(
            "A saved track could not be resolved; original playlist has been retained",
          );
        tracks.push(result.tracks[0]);
      }
      return {
        tracks,
        playlist: record
          ? new Playlist({
              id: query.slice(9),
              title: record.name,
              author: { name: record.author, url: "" },
              url: query,
              tracks,
            })
          : null,
      };
    });
  },
});
