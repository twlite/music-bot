import { Client } from 'discord.js';
import { HooksRegistry, Symbols } from '#bot/hooks/registry';
import {
  ClientIntents,
  CommandsPath,
  EventsPath,
  ValidationsPath,
} from '#bot/utils/constants';
import { CommandKit } from 'commandkit';

const client = new Client({
  intents: ClientIntents,
});

HooksRegistry.set(Symbols.kClient, client);

const commandkit = new CommandKit({
  client,
  bulkRegister: false,
  commandsPath: CommandsPath,
  eventsPath: EventsPath,
  skipBuiltInValidations: true,
  validationsPath: ValidationsPath,
});

export { client, commandkit };
