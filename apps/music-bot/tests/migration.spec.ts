import { config, appConfigSchema } from "../src/config.js";
import { describe, it, expect, vi } from "vitest";
import { createRemediaNodes } from "../src/player/config.js";
import { savedTrackURL } from "../src/player/persistence.js";
import { mediaURL } from "../src/player/direct-media.js";
import { filterGraph } from "../src/player/effects.js";

describe("playback configuration", () => {
  it("defaults to embedded", async () =>
    expect(await createRemediaNodes()).toEqual([
      { id: "local", type: "embedded" },
    ]));
  it("requires remote credentials", async () =>
    expect(
      createRemediaNodes(
        { mode: "remote", url: "ws://localhost:8787", username: "bot" },
        "",
      ),
    ).rejects.toThrow("REMEDIA_PASSWORD"));
  it("rejects invalid settings", () =>
    expect(() =>
      appConfigSchema.parse({
        ...config,
        crossfade: { enabled: true, durationMs: -1 },
      }),
    ).toThrow());
  it("uses one native node shape for remote", async () =>
    expect(
      await createRemediaNodes(
        { mode: "remote", url: "ws://localhost:8787", username: "bot" },
        "secret",
      ),
    ).toMatchObject([
      { type: "remote", auth: { username: "bot", password: "secret" } },
    ]));
});
describe("saved playlists", () => {
  it("reads legacy v6 without modifying it", () => {
    const original = {
      $type: "track",
      url: "https://www.youtube.com/watch?v=abc",
      raw: { secret: "old engine" },
    };
    const backup = JSON.stringify(original);
    expect(savedTrackURL(original)).toBe(original.url);
    expect(JSON.stringify(original)).toBe(backup);
  });
  it("reads versioned v8 data", () =>
    expect(
      savedTrackURL({ data: { url: "https://example.com/music.mp3" } }),
    ).toBe("https://example.com/music.mp3"));
  it.each([
    null,
    {},
    { url: "file:///etc/passwd" },
    { url: "https://user:secret@example.com" },
    { url: "playlist:recursive" },
  ])("rejects unsafe records %j", (record) =>
    expect(savedTrackURL(record)).toBeNull(),
  );
});
describe("filtergraphs", () => {
  it("leaves a flat graph disabled", () =>
    expect(filterGraph(Array(15).fill(0), [])).toBeNull());
  it("composes EQ, bass, vocals and rotation rather than overwriting them", () => {
    const graph = filterGraph(
      [0.5, ...Array(14).fill(0)],
      ["8D", "bassboost", "vocalboost"],
    );
    expect(graph).toContain("equalizer=f=25");
    expect(graph).toContain("apulsator=hz=0.09");
    expect(graph).toContain("bass=g=10");
    expect(graph).toContain("equalizer=f=3000");
  });
  it.each([[0], Array(15).fill(NaN), Array(15).fill(2)])(
    "rejects invalid EQ",
    (eq) => expect(() => filterGraph(eq, [])).toThrow(),
  );
});
describe("direct source policy", () => {
  it("accepts explicitly trusted HTTPS hosts", () =>
    expect(mediaURL("https://cdn.discordapp.com/music.mp3")).not.toBeNull());
  it.each([
    "http://cdn.discordapp.com/a",
    "https://127.0.0.1/a",
    "https://cdn.discordapp.com.evil.test/a",
    "https://user:password@cdn.discordapp.com/a",
    "file:///etc/passwd",
  ])("rejects %s", (query) => expect(mediaURL(query)).toBeNull());
});
