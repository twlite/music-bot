import { beforeEach, expect, it, vi } from 'vitest';
import { chatInput } from '../src/app/commands/join.js';

const state = vi.hoisted(() => ({
  queue: { guildId: 'guild', node: { session: null as unknown }, connect: vi.fn(), delete: vi.fn() },
  existing: false,
  create: vi.fn(),
  settings: vi.fn(),
}));
vi.mock('../src/player/runtime.js', () => ({
  useQueue: () => (state.existing ? state.queue : null),
  player: { nodes: { create: (...args: unknown[]) => state.create(...args) } },
}));
vi.mock('../src/player/player-options.js', () => ({ fetchPlayerOptions: () => state.settings() }));
vi.mock('../src/player/effects.js', () => ({ queueDefaults: () => ({ volume: 50 }), rememberEffects: vi.fn() }));
vi.mock('../src/player/player-metadata.js', () => ({ PlayerMetadata: { create: () => ({ channel: 'text' }) } }));
vi.mock('../src/web/statistics.js', () => ({ syncStatistics: vi.fn() }));

function interaction() {
  return {
    inCachedGuild: () => true,
    guildId: 'guild',
    member: { voice: { channel: { id: 'voice' } } },
    guild: { members: { me: { voice: { channelId: 'voice' } } } },
    reply: vi.fn(),
    deferReply: vi.fn(),
    editReply: vi.fn(),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  state.existing = false;
  state.queue.node.session = null;
  state.create.mockResolvedValue(state.queue);
  state.queue.connect.mockResolvedValue({});
});

it('creates a guild queue and connects without starting playback', async () => {
  const input = interaction();
  await chatInput({ interaction: input } as never);
  expect(state.create).toHaveBeenCalledWith(
    'guild',
    expect.objectContaining({ metadata: { channel: 'text' }, volume: 50 }),
  );
  expect(state.queue.connect).toHaveBeenCalledWith({ channelId: 'voice', selfDeaf: true });
});
it('leaves an existing connected queue untouched', async () => {
  state.existing = true;
  state.queue.node.session = {};
  await chatInput({ interaction: interaction() } as never);
  expect(state.settings).not.toHaveBeenCalled();
  expect(state.create).not.toHaveBeenCalled();
  expect(state.queue.connect).not.toHaveBeenCalled();
});
it('cleans up only a newly created queue if joining fails', async () => {
  state.queue.connect.mockRejectedValueOnce(new Error('Voice unavailable'));
  await expect(chatInput({ interaction: interaction() } as never)).rejects.toThrow('Voice unavailable');
  expect(state.queue.delete).toHaveBeenCalledOnce();
  state.existing = true;
  state.queue.connect.mockRejectedValueOnce(new Error('Voice unavailable'));
  state.queue.delete.mockClear();
  await expect(chatInput({ interaction: interaction() } as never)).rejects.toThrow();
  expect(state.queue.delete).not.toHaveBeenCalled();
});
