import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useHistory } from 'discord-player';

export const data: CommandData = {
  name: 'back',
  description: 'Back to the previous track',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const history = useHistory(interaction.guildId);

  if (!history) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (history.isEmpty()) {
    const embed = EmbedGenerator.Error({
      title: 'No previous track',
      description: 'There is no previous track to go back to',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await history.back();

  const embed = EmbedGenerator.Success({
    title: 'Track skipped!',
    description: 'I have successfully skipped to the previous track.',
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
