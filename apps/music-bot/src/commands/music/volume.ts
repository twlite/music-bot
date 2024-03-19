import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useTimeline } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'volume',
  description: 'Get or manipulate the volume',
  options: [
    {
      name: 'value',
      description: 'The volume to set',
      min_value: 0,
      max_value: 100,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const timeline = useTimeline(interaction.guildId);

  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: 'No hay ninguna canción',
      description: 'No estoy reproduciendo nada ahora mismo :smiling_face_with_tear:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  const amount = interaction.options.getInteger('value', false);

  if (amount != null) {
    timeline.setVolume(amount);

    const embed = EmbedGenerator.Success({
      title: 'Volumen cambiado',
      description: `He cambiado el volumen a  ${amount}% :loud_sound:`,
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);


    return interaction.editReply({ embeds: [embed] });
  }

  const embed = EmbedGenerator.Success({
    title: 'Volumen',
    description: `El volumen actual es de \`${timeline.volume}%\`.`,
  }).withAuthor(interaction.user);

  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);


  return interaction.editReply({ embeds: [embed] });
}
