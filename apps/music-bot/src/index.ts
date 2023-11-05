import 'dotenv/config';
import { client } from './bootstrap/client';
import { Player } from 'discord-player';
import { DiscordPlayerOptions } from './utils/constants';

const player = new Player(client);

await player.extractors.loadDefault((ext) => {
  return DiscordPlayerOptions.disableSources.includes(ext);
}, DiscordPlayerOptions.extractorConfig);

await client.login();
