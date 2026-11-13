import type { GatewayDispatchPayload } from "discord.js";

// Discord.js emits this Gateway event but omits it from ClientEvents.
declare module "discord.js" {
  interface ClientEvents {
    raw: [packet: GatewayDispatchPayload, shardId: number];
  }
}
