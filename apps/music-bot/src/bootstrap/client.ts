import { Client } from 'discord.js';
import { HooksRegistry, Symbols } from '../hooks/registry';
import { ClientIntents, CommandsPath, EventsPath } from '../utils/constants';
import { CommandKit } from 'commandkit';

const client = new Client({
  intents: ClientIntents,
});

HooksRegistry.set(Symbols.kClient, client);

const commandkit = new CommandKit({
  client,
  bulkRegister: true,
  commandsPath: CommandsPath,
  eventsPath: EventsPath,
  skipBuiltInValidations: true,
});

export { client, commandkit };
