import type { EventHandler } from 'commandkit';
import { syncStatistics } from '@/web/statistics';
import { socketInfo } from '@/web/socket';

const handler: EventHandler<'channelUpdate'> = (oldChannel, channel) => {
  if (!channel.isVoiceBased() || !oldChannel.isVoiceBased() || oldChannel.name === channel.name) return;
  if (channel.guild.members.me?.voice.channelId !== channel.id) return;
  if (socketInfo.some((user) => user.guildId === channel.guild.id)) syncStatistics({ guildId: channel.guild.id });
};

export default handler;
