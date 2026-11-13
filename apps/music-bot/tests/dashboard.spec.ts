import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscordPlayer, Track, AudioFilterPresets, type GuildQueue } from 'discord-player';
import { EqualizerConfigurationPreset } from '@music-bot/shared';
import { equalizerSchema, effectSchema, seekSchema } from '../src/web/schemas.js';
import { editQueue, seek } from '../src/web/actions/queue.action.js';
import { effectState, setEqualizer, toggleEffect } from '../src/player/effects.js';
import { publicTrack } from '../src/player/public-media.js';
import { getLyrics, releaseLyrics } from '../src/web/lyrics.js';

const state = vi.hoisted(() => ({
  active: undefined as GuildQueue | undefined,
  settings: { equalizer: Array(15).fill(0), filters: [] as string[] },
  update: vi.fn(),
}));
vi.mock('../src/player/runtime.js', () => ({
  useQueue: (id: string) => (id === state.active?.guildId ? state.active : undefined),
}));
vi.mock('../src/hooks/useDatabase.js', () => ({
  useDatabase: () => ({
    guild: {
      findOne: async () => structuredClone(state.settings),
      updateOne: async (_query: unknown, update: { $set: typeof state.settings }) => {
        state.update(update);
        Object.assign(state.settings, structuredClone(update.$set));
      },
    },
  }),
}));
let player: DiscordPlayer;

beforeEach(async () => {
  player = new DiscordPlayer({ send() {} });
  state.active = await player.nodes.create('123456789012345678');
  state.settings = { equalizer: Array(15).fill(0), filters: [] };
  state.update.mockClear();
});
afterEach(async () => {
  if (state.active) releaseLyrics(state.active);
  await player.destroy();
});

it.each(Object.entries(EqualizerConfigurationPreset))(
  'accepts all 15 bands of the %s dashboard preset',
  (_name, bands) => {
    expect(equalizerSchema.safeParse(bands).success).toBe(true);
  },
);

it('rejects duplicate bands, unknown effects and nonfinite seeks', () => {
  expect(equalizerSchema.safeParse(Array(15).fill({ band: 0, gain: 0 })).success).toBe(false);
  expect(effectSchema.safeParse({ name: 'arbitrary,ffmpeg=expression', enabled: true }).success).toBe(false);
  expect(seekSchema.safeParse({ trackId: 'a', positionMs: Infinity }).success).toBe(false);
});

describe('managed filters', () => {
  it('combines a registered EQ preset with multiple effects and removes only the selected effect', async () => {
    const queue = state.active!;
    await setEqualizer(queue, EqualizerConfigurationPreset.Rock);
    await toggleEffect(queue, '8D', true);
    await toggleEffect(queue, 'bassboost', true);
    expect(queue.filters.enabled).toEqual(expect.arrayContaining(['eq_Rock', '8D', 'bassboost']));
    expect(queue.filters.graph).toContain(AudioFilterPresets['8D']);
    await toggleEffect(queue, '8D', false);
    expect(queue.filters.enabled).toEqual(expect.arrayContaining(['eq_Rock', 'bassboost']));
    expect(queue.filters.get('8D')).toBe(false);
    expect(effectState(queue).filters).toEqual(['bassboost']);
  });

  it('serializes concurrent guild effect changes so neither is lost', async () => {
    const queue = state.active!;
    await Promise.all([toggleEffect(queue, '8D', true), toggleEffect(queue, 'vocalboost', true)]);
    expect(state.settings.filters).toEqual(['8D', 'vocalboost']);
    expect(queue.filters.graph).toContain('apulsator');
    expect(queue.filters.graph).toContain('equalizer=f=3000');
  });
});

it('moves and removes only upcoming tracks in the authorized guild, using IDs after queue changes', () => {
  const queue = state.active!;
  const tracks = [new Track({ title: 'A' }), new Track({ title: 'B' }), new Track({ title: 'C' })];
  queue.addTracks(tracks);
  editQueue(queue.guildId, tracks[2].id, 'move', tracks[0].id);
  expect(queue.tracks.toArray()).toEqual([tracks[2], tracks[0], tracks[1]]);
  editQueue(queue.guildId, tracks[0].id, 'remove');
  expect(queue.tracks.toArray()).toEqual([tracks[2], tracks[1]]);
  expect(() => editQueue('another-guild', tracks[2].id, 'remove')).toThrow();
  expect(() => editQueue(queue.guildId, tracks[0].id, 'next')).toThrow();
});

it('rejects seeking a replaced or live track before touching playback', async () => {
  state.active = {
    currentTrack: new Track({ durationMS: 10000, live: false }),
    node: { seek: vi.fn() },
  } as unknown as GuildQueue;
  await expect(seek('unavailable-guild', 'old-track', 1000)).rejects.toThrow();
  expect(state.active.node.seek).not.toHaveBeenCalled();
  state.active = undefined;
});

it('exports requester snapshots without leaking unrelated metadata or requesting Discord users', () => {
  const track = new Track({
    title: 'A',
    requestedBy: {
      id: 'u',
      displayName: 'Listener',
      displayAvatarURL: 'https://cdn.discordapp.com/avatar.png',
      token: 'private',
    },
    metadata: { secret: 'private' },
  });
  const output = publicTrack(track);
  expect(output.requestedBy).toEqual({
    id: 'u',
    displayName: 'Listener',
    displayAvatarURL: 'https://cdn.discordapp.com/avatar.png',
  });
  expect(JSON.stringify(output)).not.toContain('private');
  track.requestedBy = 'older-user';
  expect(publicTrack(track).requestedBy?.id).toBe('older-user');
});

it('coalesces lyrics requests across clients and cancels pending work when the guild releases it', async () => {
  const controller = new AbortController();
  const search = vi.fn(
    (_track: Track, { signal }: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            controller.abort();
            reject(signal.reason);
          },
          { once: true },
        );
      }),
  );
  const queue = { currentTrack: new Track({ title: 'Song' }), player: { lyrics: { search } } } as unknown as GuildQueue;
  const first = getLyrics(queue);
  const second = getLyrics(queue);
  // Independent callers share a single provider request, not necessarily the same Promise wrapper.
  expect(search).toHaveBeenCalledTimes(1);
  releaseLyrics(queue);
  expect(controller.signal.aborted).toBe(true);
  expect((await first).status).toBe('error');
});

it('keeps custom EQ bands when adding multiple named effects', async () => {
  const queue = state.active!;
  const bands = Array.from({ length: 15 }, (_, band) => ({ band, gain: band === 0 ? 0.123 : 0 }));
  await setEqualizer(queue, bands);
  await toggleEffect(queue, '8D', true);
  await toggleEffect(queue, 'vocalboost', true);
  expect(effectState(queue).equalizerPreset).toBe('custom');
  expect(queue.filters.graph).toContain('equalizer=f=25');
  expect(queue.filters.graph).toContain('apulsator');
  expect(queue.filters.graph).toContain('equalizer=f=3000');
});

it('uses the official LRCLIB plugin through the native lyrics API', async () => {
  const { lrclibPlugin } = await import('@discord-player/plugin-host');
  const fetch = vi.fn().mockResolvedValue(
    Response.json([
      {
        id: 1,
        trackName: 'Song',
        artistName: 'Artist',
        albumName: '',
        instrumental: false,
        plainLyrics: 'Example line',
        syncedLyrics: '[00:01.00] Example line',
      },
    ]),
  );
  vi.stubGlobal('fetch', fetch);
  try {
    await player.plugins.register(lrclibPlugin());
    const results = await player.lyrics.search(new Track({ title: 'Song', author: 'Artist' }));
    expect(fetch.mock.calls[0][0]).toContain('https://lrclib.net/api/search?');
    expect(results[0].synced).toEqual({ available: true, lines: [{ timestampMs: 1000, line: 'Example line' }] });
  } finally {
    vi.unstubAllGlobals();
  }
});

it('keeps manual and automatic lyric lookups separate and reuses results when choosing a match', async () => {
  const search = vi.fn().mockResolvedValue([
    {
      plain: { available: false },
      synced: { available: true, lines: [{ timestampMs: 1000, line: 'First' }] },
      metadata: { trackName: 'First match', artistName: 'First artist' },
    },
    {
      plain: { available: true, text: 'Second text' },
      synced: { available: false },
      metadata: { trackName: 'Second match', artistName: 'Second artist' },
    },
  ]);
  const track = new Track({ title: 'Automatic title' });
  const queue = { currentTrack: track, player: { lyrics: { search } } } as unknown as GuildQueue;
  expect((await getLyrics(queue)).lines[0].line).toBe('First');
  const manual = await getLyrics(queue, 'correct song artist');
  expect(manual.choices?.map((choice) => choice.title)).toEqual(['First match', 'Second match']);
  const selected = await getLyrics(queue, 'correct song artist', 1);
  expect(selected.plain).toBe('Second text');
  expect(selected.resultIndex).toBe(1);
  expect(search).toHaveBeenCalledTimes(2);
  expect(search.mock.calls[0][0]).toBe(track);
  expect(search.mock.calls[1][0]).toBe('correct song artist');
  releaseLyrics(queue);
});

it('distinguishes same-title lyric versions using album, record ID and actual line timing', async () => {
  const search = vi.fn().mockResolvedValue([
    {
      plain: { available: false },
      synced: {
        available: true,
        lines: [
          { timestampMs: 0, line: '' },
          { timestampMs: 1500, line: 'First line' },
          { timestampMs: 5500, line: 'Last line' },
        ],
      },
      metadata: { id: 123, trackName: 'Song', artistName: 'Artist', albumName: 'Original album' },
    },
    {
      plain: { available: false },
      synced: {
        available: true,
        lines: [
          { timestampMs: 2300, line: 'First line' },
          { timestampMs: 6300, line: 'Last line' },
        ],
      },
      metadata: { id: 456, trackName: 'Song', artistName: 'Artist', albumName: 'Deluxe album' },
    },
  ]);
  const queue = { currentTrack: new Track({ title: 'Song' }), player: { lyrics: { search } } } as unknown as GuildQueue;
  const result = await getLyrics(queue);
  expect(result.choices).toMatchObject([
    {
      index: 0,
      title: 'Song',
      album: 'Original album',
      recordId: '123',
      lineCount: 2,
      firstLineMs: 1500,
      lastLineMs: 5500,
    },
    {
      index: 1,
      title: 'Song',
      album: 'Deluxe album',
      recordId: '456',
      lineCount: 2,
      firstLineMs: 2300,
      lastLineMs: 6300,
    },
  ]);
  releaseLyrics(queue);
});
