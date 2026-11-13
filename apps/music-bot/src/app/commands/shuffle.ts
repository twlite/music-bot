import { commandHandler } from "#bot/commands/handler";
import { useQueue } from "#bot/player/runtime";
export const command = {
  name: "shuffle",
  description: "Toggle dynamic queue shuffle",
};
export const chatInput = commandHandler(async ({ interaction }) => {
  const queue = useQueue(interaction.guildId!);
  if (!queue) {
    await interaction.reply({ content: "No queue exists.", flags: 64 });
    return;
  }
  const enabled = queue.toggleShuffle();
  await interaction.reply(`Shuffle ${enabled ? "enabled" : "disabled"}.`);
});
