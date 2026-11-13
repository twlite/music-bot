import { it, expect, vi } from 'vitest';
const { findOne, search, record } = vi.hoisted(() => {
  const record = {
    tracks: [{ url: 'https://www.youtube.com/watch?v=test', $type: 'track' }],
  };
  const findOne = vi.fn(() => ({ lean: async () => record }));
  return {
    findOne,
    search: vi.fn(async () => ({ tracks: [{ title: 'Resolved' }] })),
    record,
  };
});
vi.mock('../src/hooks/useDatabase.js', () => ({
  useDatabase: () => ({ playlist: { findOne } }),
}));
import { customPlaylists } from '../src/player/custom-playlists.js';
const handlers = new Map<string, (...args: any[]) => any>();
await customPlaylists().definition.setup({
  player: { search },
  on: (name: string, callback: (...args: any[]) => any) => handlers.set(name, callback),
} as never);
it('matches only explicit custom playlist queries', () => {
  expect(
    handlers.get('search.query.match')!({
      query: 'playlist:12345678-1234-1234-1234-123456789012',
    }),
  ).toEqual({ score: 1000 });
  expect(handlers.get('search.query.match')!({ query: 'a normal song' })).toBeNull();
});
it('resolves legacy URLs with owner visibility and leaves saved data intact', async () => {
  const backup = JSON.stringify(record);
  const result = await handlers.get('search.query.resolve')!(
    {
      query: 'playlist:12345678-1234-1234-1234-123456789012',
      options: { requestedBy: 'owner' },
    },
    { signal: new AbortController().signal },
  );
  expect(findOne).toHaveBeenCalledWith({
    id: '12345678-1234-1234-1234-123456789012',
    $or: [{ private: false }, { author: 'owner' }],
  });
  expect(search).toHaveBeenCalledWith(record.tracks[0].url, expect.objectContaining({ requestedBy: 'owner' }));
  expect(result.tracks).toEqual([{ title: 'Resolved' }]);
  expect(JSON.stringify(record)).toBe(backup);
});
