import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IStatistics, SerializedTrack } from '@music-bot/shared';
import { EqualizerConfigurationPreset } from '@music-bot/shared';
import { TrackProgress } from '../src/components/player/track-progress';
import { Equalizer } from '../src/components/player/equalizer';
import { QueueList } from '../src/components/player/queue-list';
import { Lyrics } from '../src/components/player/lyrics';
import { activeLyricIndex } from '../src/lib/playback';

const { send, events } = vi.hoisted(() => ({ send: vi.fn(), events: new Map<string, (...args: any[]) => void>() }));
vi.mock('@/context/socket.context', () => ({
  useSocket: () => ({ send }),
  useSocketEvent: (name: string, callback: (...args: any[]) => void) => events.set(name, callback),
}));

const track: SerializedTrack = {
  id: 'track-a',
  title: 'A song',
  author: 'An artist',
  url: 'https://example.com/a',
  thumbnail: '',
  duration: '3:00',
  durationMS: 180000,
  live: false,
  requestedBy: { id: 'user-a', displayName: 'A Listener', displayAvatarURL: 'https://cdn.discordapp.com/avatar.png' },
};

beforeEach(() => {
  send.mockReset();
  events.clear();
});

describe('seeking', () => {
  it('debounces keyboard scrubbing and sends milliseconds with the playing track ID', async () => {
    vi.useFakeTimers();
    render(<TrackProgress trackId={track.id} total={180000} position={10000} disabled={false} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(send).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(send).toHaveBeenCalledExactlyOnceWith('seek', { trackId: track.id, positionMs: 12000 });
  });

  it('cancels a pending seek when playback changes to another track', async () => {
    vi.useFakeTimers();
    const view = render(<TrackProgress trackId="a" total={180000} position={10000} disabled={false} />);
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    view.rerender(<TrackProgress trackId="b" total={180000} position={0} disabled={false} />);
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(send).not.toHaveBeenCalled();
  });
});

it('renders independent effect toggles and sends only the changed effect', () => {
  const state = {
    track,
    connected: true,
    effects: ['8D'],
    effectPresets: [
      { name: '8D', label: '8D' },
      { name: 'bassboost', label: 'Bass boost' },
    ],
    equalizer: EqualizerConfigurationPreset.Flat,
    equalizerPreset: 'Flat',
  } as IStatistics;
  render(<Equalizer state={state} />);
  expect(screen.getByRole('switch', { name: '8D' }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('switch', { name: 'Bass boost' }));
  expect(send).toHaveBeenCalledWith('effect', { name: 'bassboost', enabled: true });
});

it('shows requester snapshots and moves by stable IDs with keyboard and remove controls', () => {
  render(<QueueList />);
  act(() => events.get('queue')?.([track, { ...track, id: 'track-b', title: 'Second song' }]));
  expect(screen.getAllByText('Queued by A Listener')).toHaveLength(2);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder Second song' }), { altKey: true, key: 'ArrowUp' });
  expect(send).toHaveBeenCalledWith('queueMove', { trackId: 'track-b', beforeId: 'track-a' });
  fireEvent.click(screen.getByRole('button', { name: 'Remove A song' }));
  expect(send).toHaveBeenCalledWith('queueRemove', { trackId: 'track-a' });
});

it('adds trimmed track queries through the queue form', () => {
  render(<QueueList />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Track URL or search query' }), {
    target: { value: '  new track  ' },
  });
  fireEvent.submit(screen.getByRole('combobox', { name: 'Track URL or search query' }).closest('form')!);
  expect(send).toHaveBeenCalledWith('play', 'new track');
  expect((screen.getByRole('combobox', { name: 'Track URL or search query' }) as HTMLInputElement).value).toBe('');
});

it('ignores stale lyric responses, highlights the source timeline and debounces line seeking', async () => {
  vi.useFakeTimers();
  render(<Lyrics track={track} position={1500} />);
  const requestId = send.mock.calls.find(([name]) => name === 'lyrics')![1].requestId;
  const lines = [
    { timestampMs: 1000, line: 'First line' },
    { timestampMs: 2000, line: 'Second line' },
  ];
  act(() => events.get('lyrics')?.({ trackId: 'old-track', status: 'ready', lines, plain: null }));
  expect(screen.queryByText('First line')).toBeNull();
  act(() => events.get('lyrics')?.({ trackId: track.id, requestId, status: 'ready', lines, plain: null }));
  expect(screen.getByText('First line').getAttribute('aria-current')).toBe('true');
  fireEvent.click(screen.getByText('Second line'));
  await act(() => vi.advanceTimersByTimeAsync(300));
  expect(send).toHaveBeenCalledWith('seek', { trackId: track.id, positionMs: 2000 });
});

it('indexes lyrics correctly before the first line and after backwards seeks', () => {
  const lines = [{ timestampMs: 1000 }, { timestampMs: 2000 }, { timestampMs: 5000 }];
  expect(activeLyricIndex(lines, 500)).toBe(-1);
  expect(activeLyricIndex(lines, 5000)).toBe(2);
  expect(activeLyricIndex(lines, 1500)).toBe(0);
});

it('selects a formerly invalid preset through the shadcn selector using valid band gains', async () => {
  const user = userEvent.setup();
  const state = {
    track,
    connected: true,
    effects: [],
    effectPresets: [],
    equalizer: EqualizerConfigurationPreset.Flat,
    equalizerPreset: 'Flat',
  } as unknown as IStatistics;
  render(<Equalizer state={state} />);
  await user.click(screen.getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: 'Full Bass' }));
  const payload = send.mock.calls.find(([name]) => name === 'equalizer')?.[1];
  expect(payload).toHaveLength(15);
  expect(payload.every((band: { gain: number }) => band.gain >= -0.25 && band.gain <= 1)).toBe(true);
});

it('sends the dragged track ID and drop target rather than a stale numeric position', () => {
  render(<QueueList />);
  act(() => events.get('queue')?.([track, { ...track, id: 'track-b', title: 'Second song' }]));
  const transfer = { effectAllowed: '', setData: vi.fn() };
  fireEvent.dragStart(screen.getByRole('button', { name: 'Reorder Second song' }), { dataTransfer: transfer });
  const target = screen.getByRole('button', { name: 'Reorder A song' }).closest('div.group')!;
  fireEvent.dragOver(target, { dataTransfer: transfer });
  fireEvent.drop(target, { dataTransfer: transfer });
  expect(send).toHaveBeenCalledWith('queueMove', { trackId: 'track-b', beforeId: 'track-a' });
});

it('provides queue operations from the right-click context menu', async () => {
  const user = userEvent.setup();
  render(<QueueList />);
  act(() => events.get('queue')?.([track, { ...track, id: 'track-b', title: 'Second song' }]));
  const row = screen.getByRole('button', { name: 'Reorder Second song' }).closest('div.group')!;
  fireEvent.contextMenu(row, { clientX: 20, clientY: 20 });
  await user.click(screen.getByRole('menuitem', { name: 'Play next' }));
  expect(send).toHaveBeenCalledWith('queueNext', { trackId: 'track-b' });
});

it('supports manual lyric searches and ignores a late automatic response', () => {
  render(<Lyrics track={track} position={0} />);
  const automatic = send.mock.calls.find(([name]) => name === 'lyrics')![1];
  fireEvent.change(screen.getByRole('textbox', { name: 'Search lyrics' }), { target: { value: 'Better song artist' } });
  fireEvent.submit(screen.getByRole('textbox', { name: 'Search lyrics' }).closest('form')!);
  const manual = send.mock.calls.at(-1)![1];
  expect(manual).toMatchObject({ trackId: track.id, query: 'Better song artist', resultIndex: 0 });
  act(() =>
    events.get('lyrics')!({
      trackId: track.id,
      requestId: automatic.requestId,
      status: 'ready',
      lines: [],
      plain: 'Old text',
    }),
  );
  expect(screen.queryByText('Old text')).toBeNull();
  act(() =>
    events.get('lyrics')!({
      trackId: track.id,
      requestId: manual.requestId,
      query: manual.query,
      status: 'ready',
      lines: [],
      plain: 'Correct text',
    }),
  );
  expect(screen.getByText('Correct text')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Use track details' }));
  expect(send.mock.calls.at(-1)![1].query).toBe('');
});

it('shows selectable suggestions below Up next and queues the selected URL', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockResolvedValue(Response.json([{ ...track, title: 'Suggested song' }]));
  vi.stubGlobal('fetch', fetch);
  try {
    render(<QueueList />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Track URL or search query' }), {
      target: { value: 'suggested' },
    });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(fetch.mock.calls[0][0]).toContain('/search?query=suggested');
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
    fireEvent.click(screen.getByRole('option', { name: /Suggested song/ }));
    expect(send).toHaveBeenCalledWith('play', track.url);
    expect((screen.getByRole('combobox', { name: 'Track URL or search query' }) as HTMLInputElement).value).toBe('');
  } finally {
    vi.unstubAllGlobals();
  }
});
