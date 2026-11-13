import { syncStatistics } from '@/web/statistics';
import type { EventHandler } from 'commandkit';
import { io } from '@/web/io';
import { socketInfo } from '@/web/socket';

const handler: EventHandler<'voiceStateUpdate'> = (_old, state) => {
  if (_old.channelId === state.channelId) return;
  const botChannel = state.guild.members.me?.voice.channelId;
  for (const [socketId, user] of socketInfo) {
    if (user.guildId !== state.guild.id) continue;
    const memberChannel = state.guild.members.cache.get(user.id)?.voice.channelId;
    if (!memberChannel || (botChannel && memberChannel !== botChannel)) io.in(socketId).disconnectSockets(true);
  }
  if (socketInfo.some((user) => user.guildId === state.guild.id)) syncStatistics({ guildId: state.guild.id });
};

export default handler;
