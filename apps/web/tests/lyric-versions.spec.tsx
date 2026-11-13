import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { DashboardLyrics, IStatistics, LyricsChoice, SerializedTrack } from '@music-bot/shared';
import { EqualizerConfigurationPreset } from '@music-bot/shared';
import { PlayerController } from '../src/components/player/controller';
import { Lyrics } from '../src/components/player/lyrics';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { lyricChoiceDetails, lyricChoiceLabel } from '../src/lib/lyric-choices';

const mock = vi.hoisted(() => ({
  send: vi.fn(),
  events: new Map<string, (...args: any[]) => void>(),
  state: null as IStatistics | null,
}));
vi.mock('@/context/socket.context', () => ({
  useSocket: () => ({ send: mock.send }),
  useSocketEvent: (name: string, callback: (...args: any[]) => void) => mock.events.set(name, callback),
}));
vi.mock('@/hooks/use-playback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/hooks/use-playback')>()),
  usePlayback: () => ({ state: mock.state, position: 5000 }),
}));

const track: SerializedTrack = {
  id: 'song-a',
  title: 'Song',
  author: 'Artist',
  url: 'https://example.com/song',
  thumbnail: '',
  duration: '3:00',
  durationMS: 180000,
  live: false,
  requestedBy: null,
};
const choices: LyricsChoice[] = [
  {
    index: 0,
    title: 'Song',
    artist: 'Artist',
    synced: true,
    album: 'Original album',
    recordId: '123',
    lineCount: 2,
    firstLineMs: 1500,
    lastLineMs: 5500,
  },
  {
    index: 1,
    title: 'Song',
    artist: 'Artist',
    synced: true,
    album: 'Deluxe album',
    recordId: '456',
    lineCount: 2,
    firstLineMs: 2300,
    lastLineMs: 6300,
  },
];
function response(resultIndex: number): DashboardLyrics {
  const request = mock.send.mock.calls.filter(([name]) => name === 'lyrics').at(-1)![1];
  return {
    trackId: track.id,
    query: '',
    resultIndex,
    requestId: request.requestId,
    status: 'ready',
    choices,
    plain: null,
    lines: [{ timestampMs: choices[resultIndex].firstLineMs!, line: `Version ${resultIndex + 1} line` }],
  };
}
function Player() {
  return (
    <TooltipProvider>
      <PlayerController />
    </TooltipProvider>
  );
}

beforeEach(() => {
  mock.send.mockClear();
  mock.events.clear();
  mock.state = {
    guildId: 'guild',
    voiceChannel: null,
    track,
    connected: true,
    playing: true,
    playbackRate: 1,
    paused: false,
    timestamp: { current: { label: '0:05', value: 5000 }, total: { label: '3:00', value: 180000 }, progress: 3 },
    sentAt: 1,
    listeners: 1,
    tracks: 0,
    volume: 50,
    repeatMode: 0,
    equalizer: EqualizerConfigurationPreset.Flat,
    equalizerPreset: 'Flat',
    effects: [],
    effectPresets: [],
    shuffle: false,
  };
});

it('keeps the selected version when switching Queue/Lyrics, and resets only for a new track', async () => {
  const user = userEvent.setup();
  const view = render(<Player />);
  expect(mock.send).not.toHaveBeenCalled();
  await user.click(screen.getByRole('tab', { name: 'Lyrics' }));
  act(() => mock.events.get('lyrics')!(response(0)));
  await user.click(screen.getByRole('combobox', { name: 'Lyric match' }));
  expect(screen.getByRole('option', { name: /Version 1.*Original album/ })).toBeTruthy();
  expect(screen.getByRole('option', { name: /Version 2.*Deluxe album/ })).toBeTruthy();
  await user.click(screen.getByRole('option', { name: /Version 2.*Deluxe album/ }));
  expect(mock.send.mock.calls.at(-1)![1].resultIndex).toBe(1);
  act(() => mock.events.get('lyrics')!(response(1)));
  const calls = mock.send.mock.calls.length;
  await user.click(screen.getByRole('tab', { name: 'Queue' }));
  await user.click(screen.getByRole('tab', { name: 'Lyrics' }));
  expect(mock.send).toHaveBeenCalledTimes(calls);
  expect(screen.getByRole('combobox', { name: 'Lyric match' }).textContent).toContain('Version 2');
  expect(screen.getByText('Version 2 line')).toBeTruthy();
  expect(screen.getByText(/LRCLIB #456/)).toBeTruthy();
  mock.state = { ...mock.state!, track: { ...track, id: 'song-b' } };
  view.rerender(<Player />);
  expect(mock.send.mock.calls.at(-1)![1]).toMatchObject({ trackId: 'song-b', query: '' });
  expect(mock.send.mock.calls.at(-1)![1].resultIndex).toBeUndefined();
});

it('cancels a pending lyric seek when its tab becomes hidden', async () => {
  vi.useFakeTimers();
  const view = render(<Lyrics track={track} position={0} active />);
  act(() => mock.events.get('lyrics')!(response(0)));
  fireEvent.click(screen.getByText('Version 1 line'));
  view.rerender(<Lyrics track={track} position={0} active={false} />);
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(mock.send.mock.calls.some(([name]) => name === 'seek')).toBe(false);
});

it('labels identical albums with version numbers and sub-second timing without calling the last line a duration', () => {
  const alternative = { ...choices[0], index: 1, firstLineMs: 1590, lastLineMs: 59960 };
  expect(lyricChoiceLabel(choices[0])).toBe('Version 1 · Original album · Starts 0:01.5');
  expect(lyricChoiceLabel(alternative)).toBe('Version 2 · Original album · Starts 0:01.6');
  expect(lyricChoiceDetails(alternative)).toBe('2 timed lines · First 0:01.6 · Last 1:00.0 · LRCLIB #123');
});
