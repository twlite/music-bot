import { it, expect, vi, beforeEach } from "vitest";
const { queue, db } = vi.hoisted(() => ({
  queue: {
    node: {
      session: {},
      setPaused: vi.fn(),
      isPaused: () => true,
      skip: vi.fn(),
    },
    history: { back: vi.fn() },
    setRepeatMode: vi.fn(),
    metadata: { channel: { isSendable: () => true, send: vi.fn() } },
  },
  db: { guild: { updateOne: vi.fn() } },
}));
vi.mock("../src/player/runtime.js", () => ({ useQueue: () => queue }));
vi.mock("../src/hooks/useDatabase.js", () => ({ useDatabase: () => db }));
vi.mock("../src/utils/EmbedGenerator.js", () => ({
  EmbedGenerator: { Success: (data: unknown) => data },
}));
import { PauseAction } from "../src/web/actions/pause.action.js";
import { SkipAction } from "../src/web/actions/skip.action.js";
import { LoopAction } from "../src/web/actions/loop.action.js";
const user = { guildId: "guild", id: "user", displayName: "User" } as never;
const socket = {
  emit: vi.fn(),
  disconnect: vi.fn(),
  to: () => ({ emit: vi.fn() }),
} as never;
beforeEach(() => vi.clearAllMocks());
it("pauses through the queue node", async () => {
  await PauseAction(user, socket, true);
  expect(queue.node.setPaused).toHaveBeenCalledWith(true);
});
it("skips through managed queue playback", async () => {
  await SkipAction(user, socket);
  expect(queue.node.skip).toHaveBeenCalledOnce();
  expect(queue.history.back).not.toHaveBeenCalled();
});
it("uses managed history for previous track", async () => {
  await SkipAction(user, socket, true);
  expect(queue.history.back).toHaveBeenCalledOnce();
  expect(queue.node.skip).not.toHaveBeenCalled();
});
it("persists dashboard repeat policy by guild", async () => {
  await LoopAction(user, socket, 2);
  expect(queue.setRepeatMode).toHaveBeenCalledWith(2);
  expect(db.guild.updateOne).toHaveBeenCalledWith(
    { id: "guild" },
    { $set: { loopMode: 2 } },
    { upsert: true, runValidators: true },
  );
});
