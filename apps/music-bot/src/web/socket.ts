import { publicTrack } from "#bot/player/public-media";
import type { Server } from "node:http";
import { Server as SocketServer } from "socket.io";
import { Collection } from "discord.js";
import { z } from "zod";
import {
  validateSession,
  cookieToken,
  authorizeAction,
  sessionTTL,
} from "#bot/player/session";
import { useRedisAsync } from "#bot/hooks/useRedis";
import { createAdapter } from "@socket.io/redis-adapter";
import { player, useQueue } from "#bot/player/runtime";
import { client } from "#bot/bootstrap/client";
import { PlayAction } from "./actions/play.action.js";
import { SearchAction } from "./actions/search.action.js";
import { SkipAction } from "./actions/skip.action.js";
import { VolumeAction } from "./actions/volume.action.js";
import { PauseAction } from "./actions/pause.action.js";
import { LoopAction } from "./actions/loop.action.js";
import { EqualizerAction } from "./actions/equalizer.action.js";
import { ShuffleAction } from "./actions/shuffle.action.js";
import { fetchPlayerOptions } from "#bot/player/playerOptions";

export type SocketUser = NonNullable<
  Awaited<ReturnType<typeof validateSession>>
>;
export const socketInfo = new Collection<string, SocketUser>();

export async function createSocketServer(server: Server) {
  const origin = process.env.WEB_INTERFACE_URL;
  if (!origin) throw new Error("WEB_INTERFACE_URL is required");
  const io = new SocketServer(server, {
    serveClient: false,
    maxHttpBufferSize: 8192,
    cors: { origin, credentials: true },
    allowRequest: (req, done) => done(null, req.headers.origin === origin),
  });
  if (process.env.SOCKET_REDIS_ADAPTER === "true") {
    const redis = await useRedisAsync();
    const sub = redis.duplicate();
    io.adapter(createAdapter(redis, sub));
    server.once("close", () => {
      sub.disconnect();
    });
  }
  io.use(async (socket, next) => {
    try {
      const user = await validateSession(
        cookieToken(socket.handshake.headers.cookie),
      );
      if (!user || !(await authorizeAction(user)))
        return next(
          new Error("Session expired or voice access denied. Run /web again."),
        );
      socket.data.user = user;
      socket.data.ttl = await sessionTTL(
        cookieToken(socket.handshake.headers.cookie)!,
      );
      if (socket.data.ttl <= 0) return next(new Error("Session expired"));
      next();
    } catch {
      next(new Error("Authentication unavailable"));
    }
  });
  const broadcast = (guildId: string) => {
    const queue = useQueue(guildId);
    const channel = client.guilds.cache
      .get(guildId)
      ?.channels.cache.get(queue?.node.session?.channelId ?? "");
    io.to(guildId).emit("statistics", {
      timestamp: queue?.node.getTimestamp() ?? null,
      sentAt: Date.now(),
      listeners: channel?.isVoiceBased()
        ? channel.members.filter((m) => !m.user.bot).size
        : 0,
      tracks: queue?.tracks.size ?? 0,
      volume: queue?.node.volume ?? 50,
      paused: queue?.node.isPaused() ?? false,
      repeatMode: queue?.repeatMode ?? 0,
      track: queue?.currentTrack ? publicTrack(queue.currentTrack) : null,
      shuffle: queue?.isShuffling ?? false,
    });
  };
  const events = [
    "playerStart",
    "playerFinish",
    "playerPause",
    "playerResume",
    "playerSeek",
    "playerStop",
    "queueDelete",
    "audioTrackAdd",
    "audioTracksAdd",
    "volumeChange",
    "audioFiltersUpdate",
    "connection",
    "connectionDestroyed",
  ] as const;
  const update = (queue: { guildId: string }) => broadcast(queue.guildId);
  for (const event of events) player.events.on(event, update);
  // One drift correction per occupied guild, independent of connected client count.
  const drift = setInterval(() => {
    for (const guildId of new Set(
      [...socketInfo.values()].map((u) => u.guildId),
    ))
      broadcast(guildId);
  }, 15000).unref();
  server.once("close", () => {
    clearInterval(drift);
    for (const event of events) player.events.off(event, update);
  });
  const voiceAccess = (
    _old: import("discord.js").VoiceState,
    state: import("discord.js").VoiceState,
  ) => {
    if (_old.channelId === state.channelId) return;
    const botChannel = state.guild.members.me?.voice.channelId;
    for (const [socketId, user] of socketInfo) {
      if (user.guildId !== state.guild.id) continue;
      const memberChannel = state.guild.members.cache.get(user.id)?.voice
        .channelId;
      if (!memberChannel || (botChannel && memberChannel !== botChannel))
        io.in(socketId).disconnectSockets(true);
    }
  };
  client.on("voiceStateUpdate", voiceAccess);
  server.once("close", () => client.off("voiceStateUpdate", voiceAccess));
  io.on("connection", (socket) => {
    const user: SocketUser = socket.data.user;
    socketInfo.set(socket.id, user);
    const expiry = setTimeout(
      () => socket.disconnect(true),
      socket.data.ttl * 1000,
    ).unref();
    void socket.join(user.guildId);
    socket.emit("ready", user);
    broadcast(user.guildId);
    void fetchPlayerOptions(user.guildId).then((settings) =>
      socket.emit(
        "equalizer",
        settings.equalizer.map((gain, band) => ({ band, gain })),
      ),
    );
    let lastAction = 0;
    function action<T>(
      name: string,
      schema: z.ZodType<T>,
      handler: (value: T) => unknown,
    ) {
      socket.on(name, async (input: unknown) => {
        if (Date.now() - lastAction < 150) return;
        lastAction = Date.now();
        try {
          const parsed = schema.safeParse(input);
          if (!parsed.success)
            return void socket.emit("error", "Invalid action payload");
          if (
            !(await validateSession(
              cookieToken(socket.handshake.headers.cookie),
            )) ||
            !(await authorizeAction(user))
          )
            return void socket.disconnect(true);
          await handler(parsed.data);
          if (name === "equalizer")
            io.to(user.guildId).emit("equalizer", parsed.data);
          broadcast(user.guildId);
        } catch {
          socket.emit(
            "error",
            "Action failed. Check your voice channel and try again.",
          );
        }
      });
    }
    action("play", z.string().trim().min(1).max(1000), (q) =>
      PlayAction(user, socket, q),
    );
    action("search", z.string().trim().min(1).max(1000), (q) =>
      SearchAction(user, socket, q),
    );
    action("skip", z.undefined(), () => SkipAction(user, socket));
    action("back", z.undefined(), () => SkipAction(user, socket, true));
    action("volume", z.number().min(0).max(100), (v) =>
      VolumeAction(user, socket, v),
    );
    action("pause", z.boolean(), (v) => PauseAction(user, socket, v));
    action("shuffle", z.boolean(), (v) => ShuffleAction(user, socket, v));
    action(
      "loop",
      z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      (v) => LoopAction(user, socket, v),
    );
    action(
      "equalizer",
      z
        .array(
          z.object({
            band: z.number().int().min(0).max(14),
            gain: z.number().min(-0.25).max(1),
          }),
        )
        .length(15)
        .refine((eq) => new Set(eq.map((e) => e.band)).size === 15),
      (v) => EqualizerAction(user, socket, v),
    );
    socket.once("disconnect", () => {
      clearTimeout(expiry);
      socketInfo.delete(socket.id);
    });
  });
  return io;
}
