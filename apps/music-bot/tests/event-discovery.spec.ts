import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventsRouter } from 'commandkit';
import { it, expect } from 'vitest';

it('discovers namespace handlers independently and keeps same-name events separate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'music-events-'));
  try {
    for (const path of [
      '(discord-player)/playerStart',
      '(discord-player)/playerFinish',
      '(discord-player)/error',
      '(discord-player-main)/error',
    ]) {
      const directory = join(root, path);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'handler.js'), 'export default () => {};');
    }
    const events = Object.values(await new EventsRouter({ entrypoints: [root] }).scan());
    expect(events).toHaveLength(4);
    for (const event of events) {
      expect(event.listeners).toHaveLength(1);
      expect(event.listeners[0]).toContain(join(`(${event.namespace})`, event.event));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
