import { ApplicationCommandOptionType } from "discord.js";
import { commandHandler } from "#bot/commands/handler";
import { useQueue } from "#bot/player/runtime";
export const command = {
  name: "seek",
  description: "Seek to a position in seconds",
  options: [
    {
      name: "seconds",
      description: "Position on the track timeline",
      type: ApplicationCommandOptionType.Number,
      required: true,
      min_value: 0,
    },
  ],
};
export const chatInput = commandHandler(async ({ interaction }) => {
  const queue = useQueue(interaction.guildId!);
  if (!queue?.currentTrack) {
    await interaction.reply({ content: "Nothing is playing.", flags: 64 });
    return;
  }
  await interaction.deferReply();
  await queue.node.seek(interaction.options.getNumber("seconds", true) * 1000);
  await interaction.editReply("Playback position updated.");
});
