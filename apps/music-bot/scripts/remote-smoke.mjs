import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { RemediaClient } from '@remedia/client';
const directory = await mkdtemp(join(tmpdir(), 'music-bot-remote-'));
const portServer = createServer();
portServer.listen(0, '127.0.0.1');
await once(portServer, 'listening');
const port = portServer.address().port;
await new Promise((resolve) => portServer.close(resolve));
const config = join(directory, 'remedia.json');
await writeFile(
  config,
  JSON.stringify({
    audio: { crossfade: { enabled: true } },
    listen: `127.0.0.1:${port}`,
    users: [{ username: 'test', password: 'local-smoke-only-password' }],
    media: { allowedFileRoots: [directory], allowHttp: false },
  }),
);
const wave = Buffer.alloc(44 + 9600);
wave.write('RIFF');
wave.writeUInt32LE(wave.length - 8, 4);
wave.write('WAVEfmt ', 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(48000, 24);
wave.writeUInt32LE(96000, 28);
wave.writeUInt16LE(2, 32);
wave.writeUInt16LE(16, 34);
wave.write('data', 36);
wave.writeUInt32LE(9600, 40);
const media = join(directory, 'tone.wav');
await writeFile(media, wave);
let server;
const start = () => {
  server = spawn('remedia', ['serve', '--config', config], { stdio: 'ignore' });
  return server;
};
let client;
const deadline = setTimeout(() => {
  server?.kill('SIGKILL');
  console.error('Remote smoke timed out');
  process.exit(1);
}, 20000).unref();
try {
  start();
  client = await RemediaClient.create({
    botUserId: '123456789012345678',
    send() {},
    nodes: [
      {
        id: 'remote',
        type: 'remote',
        url: `ws://127.0.0.1:${port}`,
        auth: { username: 'test', password: 'local-smoke-only-password' },
      },
    ],
  });
  client.on('error', () => {});
  if (client.nodes[0].status !== 'healthy') await once(client, 'nodeConnected');
  assert.equal(client.nodes[0].capabilities.crossfade.available, true);
  const info = await client.probe({ file: media });
  assert.ok(info.durationMs > 0);
  const disconnected = once(client, 'nodeDisconnected');
  const exited = once(server, 'exit');
  server.kill('SIGTERM');
  await Promise.all([disconnected, exited]);
  const reconnected = once(client, 'nodeConnected');
  start();
  await reconnected;
  assert.ok((await client.probe({ file: media })).durationMs > 0);
  console.log('Authenticated remote connection, native probe, server shutdown and automatic reconnect passed.');
} finally {
  await client?.close();
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    await exited;
  }
  clearTimeout(deadline);
  await rm(directory, { recursive: true, force: true });
}
