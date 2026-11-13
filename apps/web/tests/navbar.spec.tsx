import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { SocketUser } from '@music-bot/shared';
import { Navbar } from '../src/components/nav';

const mock = vi.hoisted(() => ({
  events: new Map<string, (...args: any[]) => void>(),
  listeners: new Map<string, () => void>(),
  socket: {
    on: (name: string, callback: () => void) => mock.listeners.set(name, callback),
    off: (name: string) => mock.listeners.delete(name),
    disconnect: vi.fn(() => mock.listeners.get('disconnect')?.()),
  },
}));
vi.mock('@/context/socket.context', () => ({
  useSocket: () => ({ socket: mock.socket, send: vi.fn() }),
  useSocketEvent: (name: string, callback: (...args: any[]) => void) => mock.events.set(name, callback),
}));
vi.mock('@/components/theme/toggle-theme', () => ({ ThemeToggle: () => <button>Theme</button> }));

const session: SocketUser = {
  id: 'user-a',
  username: 'twilight',
  displayName: 'Twilight',
  avatar: 'https://cdn.discordapp.com/avatar.png',
  guildId: '123456789012345678',
  guildName: 'Music server',
  guildIcon: 'https://cdn.discordapp.com/guild.png',
  guildAcronym: 'MS',
};
beforeEach(() => {
  mock.events.clear();
  mock.listeners.clear();
  mock.socket.disconnect.mockClear();
  sessionStorage.clear();
});

it('shows the live authenticated guild and profile when ready arrives after the header mounts', () => {
  sessionStorage.setItem(
    'session',
    JSON.stringify({ ...session, guildName: 'A different server', displayName: 'A stale user' }),
  );
  render(<Navbar />);
  expect(screen.getByText('Connecting…')).toBeTruthy();
  expect(screen.queryByText('A different server')).toBeNull();
  act(() => mock.events.get('ready')!(session));
  expect(screen.getByText('Controlling server')).toBeTruthy();
  expect(screen.getByText('Music server')).toBeTruthy();
  act(() =>
    mock.events.get('statistics')!({ guildId: session.guildId, voiceChannel: { id: 'voice-a', name: 'Lounge' } }),
  );
  expect(screen.getByLabelText('Voice channel: Lounge')).toBeTruthy();
  expect(screen.queryByText(/Server ID:/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Account: Twilight' })).toBeTruthy();
  expect(screen.getByText('@twilight')).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Search in current server' }).getAttribute('placeholder')).toBe(
    'Search in Music server…',
  );
});

it('updates guild identity from the socket, not a session from another browser tab', () => {
  render(<Navbar />);
  act(() => mock.events.get('ready')!(session));
  sessionStorage.setItem('session', JSON.stringify({ ...session, guildName: 'Another tab server' }));
  fireEvent(window, new Event('storage'));
  expect(screen.getByText('Music server')).toBeTruthy();
  expect(screen.queryByText('Another tab server')).toBeNull();
  act(() => mock.events.get('ready')!({ ...session, guildId: '987654321098765432', guildName: 'Second music server' }));
  expect(screen.getByText('Second music server')).toBeTruthy();
  expect(screen.queryByText('Music server')).toBeNull();
  expect(screen.getByText('Not connected to voice')).toBeTruthy();
});

it('clears the displayed account and guild on disconnect', () => {
  render(<Navbar />);
  act(() => mock.events.get('ready')!(session));
  act(() => mock.listeners.get('disconnect')!());
  expect(screen.queryByRole('button', { name: 'Account: Twilight' })).toBeNull();
  expect(screen.queryByText('Music server')).toBeNull();
  expect(screen.getByText('Connecting…')).toBeTruthy();
});

it('provides account actions and explains how to open a different guild', async () => {
  const user = userEvent.setup();
  render(<Navbar />);
  act(() => mock.events.get('ready')!(session));
  await user.click(screen.getByRole('button', { name: 'Account: Twilight' }));
  expect(screen.getByText('Signed in as Twilight')).toBeTruthy();
  expect(screen.getByText('Controlling Music server')).toBeTruthy();
  expect(screen.getByText('To control another server, open a /web link from that server.')).toBeTruthy();
  await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
  expect(mock.socket.disconnect).toHaveBeenCalledOnce();
});

it('updates the voice channel on a move and clears it on leave, ignoring another guild', () => {
  render(<Navbar />);
  act(() => mock.events.get('ready')!(session));
  act(() =>
    mock.events.get('statistics')!({ guildId: session.guildId, voiceChannel: { id: 'voice-a', name: 'Lounge' } }),
  );
  expect(screen.getByLabelText('Voice channel: Lounge')).toBeTruthy();
  act(() =>
    mock.events.get('statistics')!({ guildId: session.guildId, voiceChannel: { id: 'voice-b', name: 'Music room' } }),
  );
  expect(screen.getByLabelText('Voice channel: Music room')).toBeTruthy();
  act(() =>
    mock.events.get('statistics')!({
      guildId: 'another-guild',
      voiceChannel: { id: 'other-voice', name: 'Private room' },
    }),
  );
  expect(screen.queryByText('Private room')).toBeNull();
  expect(screen.getByLabelText('Voice channel: Music room')).toBeTruthy();
  act(() => mock.events.get('statistics')!({ guildId: session.guildId, voiceChannel: null }));
  expect(screen.getByText('Not connected to voice')).toBeTruthy();
});
