import type { EventHandler } from "commandkit";
import { io } from "@/web/index";
import { socketInfo } from "@/web/socket";

const handler: EventHandler<"voiceStateUpdate"> = (_old, state) => {
  if (_old.channelId === state.channelId) return;
  const botChannel = state.guild.members.me?.voice.channelId;
  for (const [socketId, user] of socketInfo) {
    if (user.guildId !== state.guild.id) continue;
    const memberChannel = state.guild.members.cache.get(user.id)?.voice
      .channelId;
    if (!memberChannel || (botChannel && memberChannel !== botChannel))
      io.in(socketId).disconnectSockets(true);
  }
};

export default handler;
