import { publicTrack } from '@/player/public-media';
import type { ChatInputCommandContext } from './_types.js';
import { EmbedGenerator } from '@/utils/embed-generator.js';
import type { CommandData } from 'commandkit';
import { usePlayer, useTimeline } from '@/player/runtime';

export const command: CommandData = {
  name: 'nowplaying',
  description: 'View the currently playing song',
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const node = usePlayer()!;
  const timeline = useTimeline();

  // this will also verify if usePlayer's value is null
  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const { track, timestamp } = timeline;

  const embed = EmbedGenerator.Info({
    title: 'Now Playing',
    description: `[${track.title}](${track.url})`,
    fields: [{ name: 'Progress', value: node.createProgressBar()! }],
    thumbnail: { url: track.thumbnail },
    footer: {
      text: `Requested by ${publicTrack(track).requestedBy?.displayName ?? 'Autoplay'} • ${timestamp?.progress ?? 0}%`,
      iconURL: undefined,
    },
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
};
