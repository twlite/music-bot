import { useDatabase } from '#bot/hooks/useDatabase';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import { DeleteEmbedTime } from '#bot/utils/constants';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { QueueRepeatMode, useQueue } from 'discord-player';
import { ApplicationCommandOptionType } from 'discord.js';

export const data: CommandData = {
  name: 'loop',
  description: 'Get or manipulate the loop mode',
  options: [
    {
      name: 'mode',
      description: 'The loop mode to set',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: [
        { name: 'Autoplay Next Track', value: QueueRepeatMode.AUTOPLAY },
        { name: 'Repeat Current Track', value: QueueRepeatMode.TRACK },
        { name: 'Repeat Queue', value: QueueRepeatMode.QUEUE },
        { name: 'Repeat Off', value: QueueRepeatMode.OFF },
      ],
    },
  ],
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);
  const db = useDatabase();

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: 'No hay canción en reproducción',
      description: 'Pero si no estoy reproduciendo nada hombre :expressionless:',
    }).withAuthor(interaction.user);

    setTimeout(() => {
      interaction.deleteReply();
    }, DeleteEmbedTime);

    return interaction.editReply({ embeds: [embed] });
  }

  const mode = interaction.options.getInteger('mode', false);

  if (mode != null) {
    queue.setRepeatMode(mode);

    const embed = EmbedGenerator.Success({
      title: 'Modo bucle actualizado',
      description: `He cambiado el modo de bucle a \`${QueueRepeatMode[mode]}\``,
    }).withAuthor(interaction.user);

    await interaction.editReply({ embeds: [embed] });
    await db.guild
      .findOneAndUpdate(
        { id: interaction.guildId },
        {
          id: interaction.guildId,
          loopMode: mode,
        },
        {
          new: true,
          upsert: true,
        }
      )
      .catch(() => null);
    return;
  }

  const embed = EmbedGenerator.Success({
    title: 'Modo de repetición',
    description: `El modo de repetición es \`${
      QueueRepeatMode[queue.repeatMode]
    }\`.`,
  }).withAuthor(interaction.user);

  setTimeout(() => {
    interaction.deleteReply();
  }, DeleteEmbedTime);

  return interaction.editReply({ embeds: [embed] });
}
