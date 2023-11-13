import 'dotenv/config';
import './bootstrap/web.js';
import './bootstrap/database.js';
import redis from './bootstrap/redis.js';
import { client } from './bootstrap/client.js';
import { Player } from 'discord-player';
import { DiscordPlayerOptions } from './utils/constants.js';
import { registerPlayerEvents } from './player/registerEvents.js';
import { RedisQueryCache } from './player/QueryCache.js';

const player = new Player(client, {
  skipFFmpeg: false,
  queryCache: new RedisQueryCache(redis),
});

if (process.env.NODE_ENV !== 'production') {
  player.on('debug', (message) => console.log(`[Player] ${message}`));
  player.events.on('debug', (queue, message) =>
    console.log(`[${queue.guild.name}: ${queue.guild.id}] ${message}`)
  );
}

await registerPlayerEvents();

await player.extractors.loadDefault((ext) => {
  return !DiscordPlayerOptions.disableSources.includes(ext);
}, DiscordPlayerOptions.extractorConfig);

await client.login();
