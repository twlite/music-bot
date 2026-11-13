import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePlayback } from '../src/hooks/use-playback';
import type { IStatistics, PlaybackPosition } from '@music-bot/shared';

const { events, socket } = vi.hoisted(() => ({
  events: new Map<string, (...args: any[]) => void>(),
  socket: { connected: true, on: vi.fn(), off: vi.fn() },
}));
vi.mock('@/context/socket.context', () => ({
  useSocket: () => ({ socket }),
  useSocketEvent: (name: string, callback: (...args: any[]) => void) => events.set(name, callback),
}));

beforeEach(() => {
  vi.useFakeTimers();
  events.clear();
  socket.connected = true;
});
const statistics = {
  track: { id: 'track' },
  timestamp: { current: { value: 5000 }, total: { value: 230000 } },
  playing: true,
  paused: false,
  sentAt: 1000,
} as IStatistics;
const packet: PlaybackPosition = {
  trackId: 'track',
  positionMs: 5000,
  durationMs: 230000,
  playbackRate: 1,
  playing: true,
  paused: false,
  sentAt: 2000,
};

it('reconciles a lyric seek and rejects older snapshots and snapshots for previous tracks', async () => {
  const view = renderHook(usePlayback);
  act(() => events.get('statistics')!(statistics));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(view.result.current.position).toBeCloseTo(6000);
  act(() => events.get('position')!({ ...packet, positionMs: 154000 }));
  expect(view.result.current.position).toBe(154000);
  act(() => events.get('position')!({ ...packet, positionMs: 5500, sentAt: 3000 }));
  expect(view.result.current.position).toBe(5500);
  act(() => events.get('position')!({ ...packet, positionMs: 154000, sentAt: 2500 }));
  act(() => events.get('position')!({ ...packet, trackId: 'old-track', positionMs: 200000, sentAt: 4000 }));
  expect(view.result.current.position).toBe(5500);
});

it('freezes precisely on disconnect and stops interpolating while paused or buffering', async () => {
  const view = renderHook(usePlayback);
  act(() => events.get('statistics')!(statistics));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  const stop = socket.on.mock.calls.find(([name]) => name === 'disconnect')![1];
  act(() => {
    socket.connected = false;
    stop();
  });
  const frozen = view.result.current.position;
  await act(() => vi.advanceTimersByTimeAsync(2000));
  expect(view.result.current.position).toBe(frozen);
  act(() => {
    socket.connected = true;
    events.get('position')!({ ...packet, playing: false });
  });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(view.result.current.position).toBe(5000);
});
