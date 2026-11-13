import { describe, expect, it, vi } from 'vitest';
import type { GuildQueue } from 'discord-player';
import { playbackPosition } from '../src/web/position.js';
import { requesterFooter } from '../src/player/public-media.js';
import { formatVolume } from '../src/utils/format-volume.js';
import { Track } from 'discord-player';

it('uses audible playback time when the source media position is far ahead', () => {
  const getTimestamp = vi.fn((source?: boolean) => ({
    current: { value: source ? 154000 : 5000 },
    total: { value: 230000 },
  }));
  const queue = {
    currentTrack: { id: 'track' },
    node: { getTimestamp, isPaused: () => false, session: { state: 'playing' } },
  } as unknown as GuildQueue;
  expect(playbackPosition(queue)).toMatchObject({
    trackId: 'track',
    positionMs: 5000,
    durationMs: 230000,
    playing: true,
  });
  expect(getTimestamp).toHaveBeenCalledExactlyOnceWith();
});

it('prefers Remedia client source estimation and preserves the filter playback rate', () => {
  const queue = {
    currentTrack: { id: 'track' },
    node: {
      getTimestamp: () => ({ current: { value: 5000 }, total: { value: 100000 } }),
      isPaused: () => false,
      filters: { graph: 'aresample=48000,asetrate=48000*1.25' },
      session: {
        state: 'playing',
        position: { mediaMs: 5000 },
        getMediaTime: () => 12500,
        getPlaybackRate: () => 1.25,
      },
    },
  } as unknown as GuildQueue;
  expect(playbackPosition(queue)).toMatchObject({
    positionMs: 12500,
    playbackRate: 1.25,
    durationMs: 100000,
  });
});

it('does not advance a paused or buffering session', () => {
  const queue = {
    currentTrack: { id: 'track' },
    node: { getTimestamp: () => null, isPaused: () => false, session: { state: 'starting' } },
  } as unknown as GuildQueue;
  expect(playbackPosition(queue).playing).toBe(false);
  expect(playbackPosition(null)).toMatchObject({ trackId: null, positionMs: 0, playing: false });
});

it('formats structured requesters and legacy IDs in embed footers', () => {
  const track = new Track({
    requestedBy: { id: 'user', displayName: 'Twilight', displayAvatarURL: 'https://cdn.discordapp.com/avatar.png' },
  });
  expect(requesterFooter(track)).toEqual({
    text: 'Requested by Twilight',
    iconURL: 'https://cdn.discordapp.com/avatar.png',
  });
  track.requestedBy = 'older-user';
  expect(requesterFooter(track).text).toBe('Requested by older-user');
  track.requestedBy = null;
  expect(requesterFooter(track).text).toBe('Requested by Autoplay');
});

it.each([
  [7.000000000000001, 7],
  [99.99999999999999, 100],
  [33.333333333, 33.33],
])('formats volume %s as %s', (input, expected) => expect(formatVolume(input)).toBe(expected));
