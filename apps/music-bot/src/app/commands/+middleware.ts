import { stopMiddlewares, type MiddlewareContext } from 'commandkit';

export async function beforeExecute(ctx: MiddlewareContext) {
  const interaction = ctx.interaction;
  if (!interaction?.isChatInputCommand()) return;
  if (!interaction.inCachedGuild()) return stopMiddlewares();
  if (ctx.commandName !== 'ping') {
    const channel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me?.voice.channel;
    if (!channel || (botChannel && channel.id !== botChannel.id)) {
      await interaction.reply({
        content: 'Join the bot voice channel first.',
        flags: 64,
      });
      return stopMiddlewares();
    }
  }
}
