import type { ChatInputCommandContext } from "#bot/commands/types";
import { useDatabase } from "#bot/hooks/useDatabase";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { QueueRepeatMode } from "discord-player";
import { useQueue } from "#bot/player/runtime";
import { ApplicationCommandOptionType } from "discord.js";

export const data: CommandData = {
  name: "loop",
  description: "Get or manipulate the loop mode",
  options: [
    {
      name: "mode",
      description: "The loop mode to set",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: [
        { name: "Autoplay Next Track", value: QueueRepeatMode.AUTOPLAY },
        { name: "Repeat Current Track", value: QueueRepeatMode.TRACK },
        { name: "Repeat Queue", value: QueueRepeatMode.QUEUE },
        { name: "Repeat Off", value: QueueRepeatMode.OFF },
      ],
    },
  ],
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);
  const db = useDatabase();

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const mode = interaction.options.getInteger("mode", false);

  if (mode != null) {
    if (![0, 1, 2, 3].includes(mode)) return;
    queue.setRepeatMode(mode as 0 | 1 | 2 | 3);

    const embed = EmbedGenerator.Success({
      title: "Repeat mode changed",
      description: `I have successfully changed the repeat mode to \`${["OFF", "TRACK", "QUEUE", "AUTOPLAY"][mode]}\``,
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
        },
      )
      .catch(() => null);
    return;
  }

  const embed = EmbedGenerator.Success({
    title: "Repeat mode",
    description: `The current repeat mode is \`${
      ["OFF", "TRACK", "QUEUE", "AUTOPLAY"][queue.repeatMode]
    }\`.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
