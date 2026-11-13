import type { ChatInputCommandContext } from "#bot/commands/types";
import { toggleEffect } from "#bot/player/effects";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { useQueue } from "#bot/player/runtime";
import { ApplicationCommandOptionType } from "discord.js";

export const data: CommandData = {
  name: "8d",
  description: "Toggle 8D filter",
  options: [
    {
      name: "state",
      description: "Whether to enable or disable the filter",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    },
  ],
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;
  const state = interaction.options.getBoolean("state", true);
  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await toggleEffect(queue, "8D", state);

  const embed = EmbedGenerator.Success({
    title: "Success",
    description: `I have successfully ${
      state ? "enabled" : "disabled"
    } the 8D filter.`,
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}
