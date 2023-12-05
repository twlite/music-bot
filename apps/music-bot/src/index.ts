import 'dotenv/config';
import './bootstrap/database.js';
import redis from './bootstrap/redis.js';
import './bootstrap/web.js';
import { client } from './bootstrap/client.js';
import { Player } from 'discord-player';
import { DiscordPlayerOptions } from './utils/constants.js';
import { registerPlayerEvents } from './player/registerEvents.js';
import { RedisQueryCache } from './player/QueryCache.js';
import { CustomPlaylistExtractor } from './player/CustomPlaylistExtractor.js';

const player = new Player(client, {
  skipFFmpeg: false,
  queryCache: new RedisQueryCache(redis),
  ytdlOptions: {
    requestOptions: {
      headers: {
        // this is optional, you can also ignore this part if you are not using youtube source
        cookie: process.env.YOUTUBE_COOKIE,
      },
    },
  },
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

await player.extractors.register(CustomPlaylistExtractor, {});

await client.login();

// prevent crash on unhandled promise rejection
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// prevent crash on uncaught exception
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
