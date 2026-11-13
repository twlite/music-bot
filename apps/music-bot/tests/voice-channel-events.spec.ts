import { expect, it, vi } from 'vitest';
import renamed from '../src/app/events/channelUpdate/dashboard.js';

const mock = vi.hoisted(() => ({ sync: vi.fn() }));
vi.mock('../src/web/statistics.js', () => ({ syncStatistics: mock.sync }));
vi.mock('../src/web/socket.js', () => ({
  socketInfo: { some: (predicate: (value: { guildId: string }) => boolean) => predicate({ guildId: 'guild-a' }) },
}));

it('refreshes the header for renames of the connected voice channel only', () => {
  const oldChannel = { isVoiceBased: () => true, name: 'Old room' };
  const channel = {
    isVoiceBased: () => true,
    id: 'voice-a',
    name: 'New room',
    guild: { id: 'guild-a', members: { me: { voice: { channelId: 'voice-a' } } } },
  };
  renamed(oldChannel as never, channel as never);
  expect(mock.sync).toHaveBeenCalledExactlyOnceWith({ guildId: 'guild-a' });
  renamed(oldChannel as never, { ...channel, id: 'unrelated-voice' } as never);
  expect(mock.sync).toHaveBeenCalledTimes(1);
});
