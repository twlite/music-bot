import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { createSocketServer, socketInfo } from '../src/web/socket.js';

const mocks = vi.hoisted(() => ({
  connection: undefined as ((socket: any) => void) | undefined,
  position: vi.fn(),
  io: {
    attach: vi.fn(),
    use: vi.fn(),
    on: (name: string, fn: (socket: any) => void) => {
      if (name === 'connection') mocks.connection = fn;
    },
  },
}));
vi.mock('../src/config.js', () => ({
  config: { http: { dashboardUrl: 'http://localhost:3000' }, redis: { socketAdapter: false } },
}));
vi.mock('../src/web/io.js', () => ({ io: mocks.io }));
vi.mock('../src/web/statistics.js', () => ({
  syncPosition: mocks.position,
  syncStatistics: vi.fn(),
  sendQueue: vi.fn(),
}));
vi.mock('../src/player/runtime.js', () => ({ useQueue: () => null, player: {} }));
vi.mock('../src/bootstrap/client.js', () => ({ client: {} }));
vi.mock('../src/player/player-options.js', () => ({
  fetchPlayerOptions: async () => ({ equalizer: Array(15).fill(0), filters: [] }),
}));
vi.mock('../src/player/session.js', () => ({
  validateSession: vi.fn(),
  cookieToken: vi.fn(),
  authorizeAction: vi.fn(),
  sessionTTL: vi.fn(),
}));

afterEach(() => {
  socketInfo.clear();
  vi.useRealTimers();
});

it('broadcasts one lightweight position per guild every five seconds and clears its timer', async () => {
  vi.useFakeTimers();
  mocks.position.mockClear();
  const server = new EventEmitter() as Server;
  await createSocketServer(server);
  const clients = ['a', 'b'].map((id) => {
    const disconnect = new Map<string, () => void>();
    const socket = {
      id,
      data: { user: { guildId: 'guild' }, ttl: 3600 },
      join: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      once: (name: string, callback: () => void) => disconnect.set(name, callback),
    };
    mocks.connection!(socket);
    return disconnect;
  });
  await vi.advanceTimersByTimeAsync(4999);
  expect(mocks.position).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(mocks.position).toHaveBeenCalledExactlyOnceWith('guild');
  for (const client of clients) client.get('disconnect')!();
  await vi.advanceTimersByTimeAsync(5000);
  expect(mocks.position).toHaveBeenCalledTimes(1);
  server.emit('close');
  expect(vi.getTimerCount()).toBe(0);
});
