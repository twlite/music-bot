import { it, expect, vi } from "vitest";
import { beforeExecute } from "../src/app/commands/+middleware.js";
import { publicTrack } from "../src/player/public-media.js";
it("blocks users outside the bot voice channel", async () => {
  const interaction = {
    isChatInputCommand: () => true,
    inCachedGuild: () => true,
    member: { voice: { channel: { id: "different" } } },
    guild: { members: { me: { voice: { channel: { id: "bot" } } } } },
    reply: vi.fn(),
  };
  await expect(
    beforeExecute({
      interaction,
      commandName: "play",
    } as never),
  ).rejects.toThrow();
  expect(interaction.reply).toHaveBeenCalledWith(
    expect.objectContaining({ flags: 64 }),
  );
});
it("dispatches an authorized command", async () => {
  const interaction = {
    isChatInputCommand: () => true,
    inCachedGuild: () => true,
    member: { voice: { channel: { id: "same" } } },
    guild: { members: { me: { voice: { channel: { id: "same" } } } } },
    reply: vi.fn(),
  };
  await beforeExecute({
    interaction,
    commandName: "play",
  } as never);
  expect(interaction.reply).not.toHaveBeenCalled();
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
