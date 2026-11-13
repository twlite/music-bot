import { it, expect, vi } from "vitest";
import { commandHandler } from "../src/commands/handler.js";
import { publicTrack } from "../src/player/public-media.js";
it("blocks users outside the bot voice channel", async () => {
  const run = vi.fn();
  const interaction = {
    inCachedGuild: () => true,
    member: { voice: { channel: { id: "different" } } },
    guild: { members: { me: { voice: { channel: { id: "bot" } } } } },
    reply: vi.fn(),
  };
  await commandHandler(run)({ interaction } as never);
  expect(run).not.toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith(
    expect.objectContaining({ flags: 64 }),
  );
});
it("dispatches an authorized command", async () => {
  const run = vi.fn();
  const interaction = {
    inCachedGuild: () => true,
    member: { voice: { channel: { id: "same" } } },
    guild: { members: { me: { voice: { channel: { id: "same" } } } } },
  };
  await commandHandler(run)({ interaction } as never);
  expect(run).toHaveBeenCalledOnce();
});
it("turns deferred command failures into editable errors", async () => {
  const run = vi.fn().mockRejectedValue(new Error("internal signed URL"));
  const interaction = {
    inCachedGuild: () => true,
    member: { voice: {} },
    guild: { members: {} },
    deferred: true,
    editReply: vi.fn(),
  };
  await commandHandler(run, false)({ interaction } as never);
  expect(interaction.editReply).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.not.stringContaining("signed URL"),
    }),
  );
});
it("omits credentials and provider stream state from dashboard DTOs", () => {
  const data = publicTrack({
    title: "Track",
    author: "Artist",
    url: "https://example.com/song",
    thumbnail: "",
    duration: "1:00",
    durationMS: 60000,
    metadata: { signedStreamURL: "secret" },
    sourceReference: { data: { token: "secret" } },
  } as never);
  expect(JSON.stringify(data)).not.toContain("secret");
  expect(data.title).toBe("Track");
});
