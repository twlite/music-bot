import { lookup } from 'node:dns/promises';
import type { DiscordPlayerNode } from 'discord-player';
import { config, type AppConfig } from '@/config';

export async function createRemediaNodes(
  settings: AppConfig['remedia'] = config.remedia,
  password = process.env.REMEDIA_PASSWORD,
): Promise<DiscordPlayerNode[]> {
  const mode =
    settings.mode === 'compose'
      ? await lookup('remedia').then(
          () => 'remote',
          () => 'embedded',
        )
      : settings.mode;
  if (mode === 'embedded') return [{ id: 'local', type: 'embedded' }];
  if (!password) throw new Error('Remote playback requires REMEDIA_PASSWORD');
  return [
    {
      id: 'remote',
      type: 'remote',
      url: settings.url,
      auth: { username: settings.username, password },
    },
  ];
}
