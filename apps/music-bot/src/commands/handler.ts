import type { ChatInputCommand } from "commandkit";
import type { ChatInputCommandContext } from "./types.js";

/** Apply the shared guild/voice policy to existing command handlers. */
export function commandHandler(
  run: (ctx: ChatInputCommandContext) => Promise<unknown>,
  voice = true,
): ChatInputCommand {
  return async (ctx) => {
    const interaction = ctx.interaction;
    if (!interaction.inCachedGuild()) return;
    const channel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me?.voice.channel;
    if (voice && (!channel || (botChannel && channel.id !== botChannel.id))) {
      await interaction.reply({
        content: "Join the bot voice channel first.",
        flags: 64,
      });
      return;
    }
    try {
      await run(ctx as unknown as ChatInputCommandContext);
    } catch {
      const message = {
        content:
          "The operation failed. Check your voice channel and try again.",
        allowedMentions: { parse: [] as never[] },
      };
      if (interaction.deferred || interaction.replied)
        await interaction.editReply(message);
      else await interaction.reply({ ...message, flags: 64 });
    }
  };
}
