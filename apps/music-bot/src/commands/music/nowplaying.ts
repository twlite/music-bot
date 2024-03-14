import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { usePlayer, useTimeline } from 'discord-player';

export const data: CommandData = {
  name: 'nowplaying',
  description: 'View the currently playing song',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const node = usePlayer(interaction.guildId)!;
  const timeline = useTimeline(interaction.guildId);

  // this will also verify if usePlayer's value is null
  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'Sin reproducir',
      description: 'No estoy reproduciendo nada ahora mismo',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const { track, timestamp } = timeline;

  const embed = EmbedGenerator.Info({
    title: 'Reproduciendo',
    description: `[${track.title}](${track.url})`,
    fields: [{ name: 'Progreso', value: node.createProgressBar()! }],
    thumbnail: { url: track.thumbnail },
    footer: {
      text: `Pedida por ${track.requestedBy?.tag} • ${timestamp.progress}%`,
      iconURL: track.requestedBy?.displayAvatarURL(),
    },
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
