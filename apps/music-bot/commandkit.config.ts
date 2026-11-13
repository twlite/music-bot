import { defineConfig } from 'commandkit';
import { discordPlayer } from 'commandkit-plugin-discord-player';

export default defineConfig({
  plugins: [discordPlayer()],
  compilerOptions: { tsdown: { noExternal: ['@music-bot/shared'] } },
});
