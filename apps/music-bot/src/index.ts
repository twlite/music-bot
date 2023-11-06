import 'dotenv/config';
import './bootstrap/web.js';
import './bootstrap/redis.js';
import './bootstrap/database.js';
import { client } from './bootstrap/client.js';
import { Player } from 'discord-player';
import { DiscordPlayerOptions } from './utils/constants.js';
import { registerPlayerEvents } from './player/registerEvents.js';

const player = new Player(client);

await registerPlayerEvents();

await player.extractors.loadDefault((ext) => {
  return DiscordPlayerOptions.disableSources.includes(ext);
}, DiscordPlayerOptions.extractorConfig);

await client.login();
