import { lrclibPlugin } from '@discord-player/plugin-host';
import { config } from '@/config';
import { DiscordPlayer } from 'discord-player';
import { client } from '@/bootstrap/client';
import { directMedia } from './direct-media.js';
import { customPlaylists } from './custom-playlists.js';
import { createRemediaNodes } from './config.js';

export const player = new DiscordPlayer({
  nodes: await createRemediaNodes(),
  crossfade: config.crossfade.enabled
    ? {
        enabled: true,
        durationMs: config.crossfade.durationMs,
        curve: 'adaptive',
      }
    : false,
  plugins: [customPlaylists(), directMedia(), lrclibPlugin()],
  send(guildId, payload) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new Error('Voice guild is unavailable');
    guild.shard.send(payload);
  },
  async resolveVoiceChannelUsers(guildId, channelId) {
    const channel = client.guilds.cache.get(guildId)?.channels.cache.get(channelId);
    return channel?.isVoiceBased() ? [...channel.members.filter((m) => !m.user.bot).keys()] : null;
  },
});
export { useMainPlayer, useQueue, usePlayer, useTimeline } from 'discord-player';

/** Register HTTP source hosts for embedded playback. */
export async function registerSourceHosts() {
  for (const host of config.sourcePluginHosts) {
    await player.plugins.registerHost({
      hostId: host.hostId,
      url: host.url,
      token: host.tokenEnvironmentVariable ? process.env[host.tokenEnvironmentVariable] : undefined,
    });
  }
}
