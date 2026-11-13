import type { EventHandler } from "commandkit";

const handler: EventHandler<"clientReady"> = (client) => {
  console.log(`🤖 ${client.user.displayName} is online!`);
};

export default handler;
