import { useDatabase } from '#bot/hooks/useDatabase';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
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
      title: 'Not playing',
      description: 'I am not playing anything right now',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const mode = interaction.options.getInteger('mode', false);

  if (mode != null) {
    queue.setRepeatMode(mode);

    const embed = EmbedGenerator.Success({
      title: 'Repeat mode changed',
      description: `I have successfully changed the repeat mode to \`${QueueRepeatMode[mode]}\``,
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
    title: 'Repeat mode',
    description: `The current repeat mode is \`${
      QueueRepeatMode[queue.repeatMode]
    }\`.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
