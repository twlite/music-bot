import { Client } from 'discord.js';
import { HooksRegistry, Symbols } from '@/hooks/registry';
import { ClientIntents } from '@/utils/constants';
import { commandkit } from 'commandkit';

const client = new Client({
  intents: ClientIntents,
});

HooksRegistry.set(Symbols.kClient, client);

commandkit.setClient(client as unknown as Parameters<typeof commandkit.setClient>[0]);

export { client, commandkit };
