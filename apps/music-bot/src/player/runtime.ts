import { config } from "@/config";
import { DiscordPlayer, type GuildQueue } from "discord-player";
import { client } from "@/bootstrap/client";
import { directMedia } from "./direct-media.js";
import { customPlaylists } from "./custom-playlists.js";
import { createRemediaNodes } from "./config.js";

export const player = new DiscordPlayer({
  nodes: await createRemediaNodes(),
  crossfade: config.crossfade.enabled
    ? { enabled: true, durationMs: config.crossfade.durationMs }
    : false,
  plugins: [customPlaylists(), directMedia()],
  send(guildId, payload) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new Error("Voice guild is unavailable");
    guild.shard.send(payload);
  },
  async resolveVoiceChannelUsers(guildId, channelId) {
    const channel = client.guilds.cache
      .get(guildId)
      ?.channels.cache.get(channelId);
    return channel?.isVoiceBased()
      ? [...channel.members.filter((m) => !m.user.bot).keys()]
      : null;
  },
});
export const useMainPlayer = () => player;
export const useQueue = <T = unknown>(guildId: string) =>
  player.nodes.get(guildId) as GuildQueue<T> | undefined;
export const usePlayer = (guildId: string) => useQueue(guildId)?.node;
export const useTimeline = (guildId: string) => {
  const queue = useQueue(guildId);
  return queue
    ? {
        track: queue.currentTrack,
        timestamp: queue.node.getTimestamp(),
        paused: queue.node.isPaused(),
        pause: () => queue.node.pause(),
        resume: () => queue.node.resume(),
        setVolume: (volume: number) => queue.node.setVolume(volume),
        volume: queue.node.volume,
      }
    : null;
};

/** Register HTTP source hosts for embedded playback. */
export async function registerSourceHosts() {
  for (const host of config.sourcePluginHosts) {
    await player.plugins.registerHost({
      hostId: host.hostId,
      url: host.url,
      token: host.tokenEnvironmentVariable
        ? process.env[host.tokenEnvironmentVariable]
        : undefined,
    });
  }
}
