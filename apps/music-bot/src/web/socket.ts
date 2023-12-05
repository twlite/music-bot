// TODO: Refactor this file
import { useRedisAsync } from '#bot/hooks/useRedis';
import { validateSession } from '#bot/player/session';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { PlayAction } from './actions/play.action.js';
import { Collection } from 'discord.js';
import { SearchAction } from './actions/search.action.js';
import { SkipAction } from './actions/skip.action.js';
import { VolumeAction } from './actions/volume.action.js';
import { PauseAction } from './actions/pause.action.js';
import { LoopAction } from './actions/loop.action.js';
import { PlayerMetadata } from '#bot/player/PlayerMetadata';
import { useQueue } from 'discord-player';
import {
  EqualizerAction,
  type EqualizerBand,
} from './actions/equalizer.action.js';
import { ShuffleAction } from './actions/shuffle.action.js';

export type SocketUser = Awaited<ReturnType<typeof validateSession>> & {};

export const socketInfo = new Collection<string, SocketUser>();

export async function createSocketServer(server: Server) {
  const redis = await useRedisAsync();
  const subClient = redis.duplicate();

  const io = new SocketServer(server, {
    adapter: createAdapter(redis, subClient),
    serveClient: false,
    cors: {
      origin: '*',
    },
  });

  io.on('connection', async (socket) => {
    const token = socket.handshake.auth.token as string;
    const user = await validateSession(token);

    if (!user) return socket.disconnect(true);

    console.log(`[Socket ${socket.id}] ${user.username} connected.`);

    socketInfo.set(socket.id, user);

    socket.join(user.guildId);

    socket.emit('ready', user);

    socket.on('play', (query: string) => PlayAction(user, socket, query));
    socket.on('search', (query: string) => SearchAction(user, socket, query));
    socket.on('skip', () => SkipAction(user, socket));
    socket.on('back', () => SkipAction(user, socket, true));
    socket.on('volume', (volume: number) => VolumeAction(user, socket, volume));
    socket.on('pause', (paused: boolean) => PauseAction(user, socket, paused));
    socket.on('loop', (mode: 0 | 1 | 2 | 3) => LoopAction(user, socket, mode));
    socket.on('equalizer', (eq: EqualizerBand[]) =>
      EqualizerAction(user, socket, eq)
    );
    socket.on('shuffle', (shuffle: boolean) =>
      ShuffleAction(user, socket, shuffle)
    );

    const handler = () => {
      const queue = useQueue<PlayerMetadata>(user.guildId);
      if (queue?.connection)
        socket.emit('statistics', {
          timestamp: queue.node.getTimestamp(),
          listeners:
            queue.channel?.members.filter((mem) => !mem.user.bot).size ?? 0,
          tracks: queue.tracks.size,
          volume: queue.node.volume,
          paused: queue.node.isPaused(),
          repeatMode: queue.repeatMode,
          track: queue.currentTrack?.serialize() ?? null,
          equalizer: queue.filters._lastFiltersCache.equalizer ?? [],
          shuffle: queue.isShuffling,
        });
    };

    const eventLoop = setInterval(handler, 1000).unref();

    handler();

    socket.once('disconnect', () => {
      clearInterval(eventLoop);
      socketInfo.delete(socket.id);
      socket.removeAllListeners();
    });
  });

  return io;
}
