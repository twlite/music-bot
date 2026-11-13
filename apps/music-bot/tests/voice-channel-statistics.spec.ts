import { beforeEach, expect, it, vi } from 'vitest';
import { syncStatistics } from '../src/web/statistics.js';

const mock = vi.hoisted(() => ({ emit: vi.fn(), channel: null as any, to: vi.fn() }));
vi.mock('../src/web/io.js', () => ({
  io: {
    to: (id: string) => {
      mock.to(id);
      return { emit: mock.emit };
    },
  },
}));
vi.mock('../src/player/runtime.js', () => ({ useQueue: () => null }));
vi.mock('../src/bootstrap/client.js', () => ({
  client: {
    guilds: {
      cache: {
        get: () => ({
          members: {
            me: {
              voice: {
                get channel() {
                  return mock.channel;
                },
              },
            },
          },
        }),
      },
    },
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mock.channel = null;
});

it('publishes the current Discord voice channel scoped to its guild, even without a playing track', () => {
  mock.channel = {
    id: 'voice-new',
    name: 'Music room',
    isVoiceBased: () => true,
    members: { filter: () => ({ size: 2 }) },
  };
  syncStatistics({ guildId: 'guild-a' });
  const data = mock.emit.mock.calls.find(([name]) => name === 'statistics')![1];
  expect(data).toMatchObject({
    guildId: 'guild-a',
    voiceChannel: { id: 'voice-new', name: 'Music room' },
    listeners: 2,
  });
  expect(mock.to).toHaveBeenCalledWith('guild-a');
});

it('clears the voice channel once Discord reports the bot disconnected', () => {
  syncStatistics({ guildId: 'guild-a' });
  expect(mock.emit.mock.calls.find(([name]) => name === 'statistics')![1].voiceChannel).toBeNull();
});
