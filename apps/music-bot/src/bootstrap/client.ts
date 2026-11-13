import { Client } from "discord.js";
import { HooksRegistry, Symbols } from "#bot/hooks/registry";
import { ClientIntents } from "#bot/utils/constants";
import { commandkit } from "commandkit";

const client = new Client({
  intents: ClientIntents,
});

HooksRegistry.set(Symbols.kClient, client);

commandkit.setClient(
  client as unknown as Parameters<typeof commandkit.setClient>[0],
);

export { client, commandkit };
