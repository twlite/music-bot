import { io } from "./index.js";
import { useQueue } from "@/player/runtime";
import { client } from "@/bootstrap/client";
import { publicTrack } from "@/player/public-media";

export function syncStatistics({ guildId }: { guildId: string }) {
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
}
