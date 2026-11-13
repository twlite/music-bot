import { DiscordPlayer, type GuildQueue } from "discord-player";
import { client } from "#bot/bootstrap/client";
import { catalogues } from "./catalogues.js";
import { mediaProviders } from "./providers.js";
import { directMedia } from "./direct-media.js";
import { customPlaylists } from "./custom-playlists.js";
import { createRemediaNodes } from "./config.js";

export const player = new DiscordPlayer({
  nodes: createRemediaNodes(),
  crossfade:
    process.env.CROSSFADE_ENABLED === "true"
      ? {
          enabled: true,
          durationMs: Number(process.env.CROSSFADE_DURATION_MS ?? 5000),
        }
      : false,
  plugins: [customPlaylists(), mediaProviders(), catalogues(), directMedia()],
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
client.on("raw", (packet) => player.receive(packet));
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

/** Register independently deployed Remedia-compatible source hosts. */
export async function registerSourceHosts() {
  const hosts = JSON.parse(process.env.SOURCE_PLUGIN_HOSTS ?? "[]");
  if (!Array.isArray(hosts))
    throw new Error("SOURCE_PLUGIN_HOSTS must be a JSON array");
  for (const host of hosts) await player.plugins.registerHost(host);
}
