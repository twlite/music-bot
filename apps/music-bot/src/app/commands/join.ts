import type { CommandData } from 'commandkit';
import type { ChatInputCommandContext } from './_types.js';
import { player, useQueue } from '@/player/runtime';
import { fetchPlayerOptions } from '@/player/player-options';
import { queueDefaults, rememberEffects } from '@/player/effects';
import { PlayerMetadata } from '@/player/player-metadata';
import { syncStatistics } from '@/web/statistics';

export const command: CommandData = {
  name: 'join',
  description: 'Join your voice channel and create a queue',
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;
  const channel = interaction.member.voice.channel!;
  const existing = useQueue();
  if (existing?.node.session && interaction.guild.members.me?.voice.channelId === channel.id) {
    await interaction.reply({
      content: 'Already connected with a queue.',
      flags: 64,
    });
    return;
  }

  await interaction.deferReply();
  const settings = await fetchPlayerOptions(interaction.guildId);
  const queue =
    existing ??
    (await player.nodes.create(interaction.guildId, {
      metadata: PlayerMetadata.create(interaction),
      ...queueDefaults(settings),
    }));
  try {
    await queue.connect({ channelId: channel.id, selfDeaf: true });
    rememberEffects(queue, settings);
    syncStatistics(queue);
    await interaction.editReply(`Joined <#${channel.id}>. The queue is ready.`);
  } catch (error) {
    if (!existing) await queue.delete();
    throw error;
  }
};
