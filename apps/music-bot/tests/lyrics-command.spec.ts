import { beforeEach, expect, it, vi } from 'vitest';
import { chatInput } from '../src/app/commands/lyrics.js';
import { beforeExecute } from '../src/app/commands/+middleware.js';

const mock = vi.hoisted(() => ({ queue: null as any, cached: vi.fn(), search: vi.fn() }));
vi.mock('../src/player/runtime.js', () => ({
  useQueue: () => mock.queue,
  useMainPlayer: () => ({ lyrics: { search: mock.search } }),
}));
vi.mock('../src/utils/embed-generator.js', () => ({ EmbedGenerator: { Info: (data: unknown) => data } }));
vi.mock('../src/web/lyrics.js', () => ({ getLyrics: mock.cached }));

function interaction(query: string | null = null) {
  return {
    inCachedGuild: () => true,
    options: { getString: () => query },
    reply: vi.fn(),
    deferReply: vi.fn(),
    editReply: vi.fn(),
    followUp: vi.fn(),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.queue = null;
});

it('uses the same automatic lookup as the dashboard and replies with plain text', async () => {
  mock.queue = { currentTrack: {} };
  mock.cached.mockResolvedValue({ status: 'ready', plain: 'First line\nSecond line', lines: [] });
  const input = interaction();
  await chatInput({ interaction: input } as never);
  expect(mock.cached).toHaveBeenCalledWith(mock.queue, '', undefined);
  expect(input.editReply).toHaveBeenCalledWith({ content: 'First line\nSecond line', allowedMentions: { parse: [] } });
});

it('allows manual queries without a queue or voice connection', async () => {
  mock.search.mockResolvedValue([{ plain: { available: true, text: 'Found lyrics' }, synced: { available: false } }]);
  const input = interaction('Some song artist');
  await beforeExecute({ commandName: 'lyrics', interaction: { ...input, isChatInputCommand: () => true } } as never);
  await chatInput({ interaction: input } as never);
  expect(mock.search.mock.calls[0][0]).toBe('Some song artist');
  expect(input.reply).not.toHaveBeenCalled();
  expect(input.editReply.mock.calls[0][0].content).toBe('Found lyrics');
});

it('returns timestamp-free lines when only synchronized lyrics are available', async () => {
  mock.queue = { currentTrack: {} };
  mock.cached.mockResolvedValue({
    status: 'ready',
    plain: null,
    lines: [
      { timestampMs: 1000, line: 'First line' },
      { timestampMs: 2000, line: 'Second line' },
    ],
  });
  const input = interaction();
  await chatInput({ interaction: input } as never);
  expect(input.editReply.mock.calls[0][0].content).toBe('First line\nSecond line');
});

it('splits long lyrics into numbered embeds without truncation or attachments', async () => {
  mock.queue = { currentTrack: {} };
  const text = 'A lyric line\n'.repeat(1000);
  mock.cached.mockResolvedValue({ status: 'ready', plain: text, lines: [] });
  const input = interaction();
  await chatInput({ interaction: input } as never);
  const responses = [...input.editReply.mock.calls, ...input.followUp.mock.calls].map(([response]) => response);
  expect(responses.length).toBeGreaterThan(1);
  expect(responses.map((response) => response.embeds[0].description).join('')).toBe(text);
  for (const [index, response] of responses.entries()) {
    expect(response.files).toBeUndefined();
    expect(response.embeds[0].description.length).toBeLessThanOrEqual(4000);
    expect(response.embeds[0].title).toBe(`Lyrics · ${index + 1}/${responses.length}`);
    expect(response.allowedMentions).toEqual({ parse: [] });
  }
});

it('asks for a query when nothing is playing', async () => {
  const input = interaction();
  await chatInput({ interaction: input } as never);
  expect(input.reply.mock.calls[0][0]).toMatchObject({ flags: 64 });
  expect(mock.search).not.toHaveBeenCalled();
});

it('reports provider failures without leaking upstream errors', async () => {
  mock.search.mockRejectedValue(new Error('private provider URL'));
  const input = interaction('Some song');
  await chatInput({ interaction: input } as never);
  expect(input.editReply.mock.calls[0][0].content).toBe('Could not load lyrics right now. Please try again.');
});
