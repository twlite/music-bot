import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';

export const data: CommandData = {
  name: 'stop',
  description: 'Stop the player',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  queue.node.stop();

  const embed = EmbedGenerator.Success({
    title: 'Track stopped!',
    description: 'I have successfully stopped the track.',
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
