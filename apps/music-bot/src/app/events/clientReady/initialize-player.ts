import type { EventHandler } from "commandkit";
import { player, registerSourceHosts } from "@/player/runtime";

const handler: EventHandler<"clientReady"> = async (client) => {
  await player.initialize(client.user.id);
  await registerSourceHosts();
};

export default handler;
