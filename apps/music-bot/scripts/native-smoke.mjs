import { createServer } from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { Remedia, getFfmpegRuntime } from '@remedia/node';
const runtime = await getFfmpegRuntime();
console.log('FFmpeg runtime available:', Boolean(runtime));
function wav(seconds, frequency) {
  const samples = 48000 * seconds;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(48000, 24);
  buffer.writeUInt32LE(96000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    buffer.writeInt16LE(Math.round(Math.sin((i / 48000) * frequency * Math.PI * 2) * 1000), 44 + i * 2);
  return buffer;
}
const wave = wav(20, 440);
let response;
const server = createServer((_req, res) => {
  response = res;
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
    'Content-Length': wave.length,
  });
  res.write(wave.subarray(0, 512 * 1024));
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const engine = await Remedia.create();
try {
  const session = engine.createPlaybackSession();
  session.configureCrossfade({
    enabled: true,
    durationMs: 1000,
    prepareBeforeMs: 5000,
  });
  await session.filters.set('equalizer=f=25:t=o:w=1:g=3,bass=g=10,equalizer=f=3000:t=o:w=2:g=4,apulsator=hz=0.09');
  assert.ok(session.filters.graph.includes('apulsator'));
  const info = await session.play({
    url: `http://127.0.0.1:${server.address().port}/tone.wav`,
  });
  assert.ok(info);
  const stageReady = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Stage preparation timed out')), 10000);
    session.once('stageReady', (event) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
  const staged = await session.stageNext({ buffer: wav(8, 660) }, { entryId: 'next', queueRevision: 1 });
  assert.ok(['preparing', 'ready'].includes(staged.state));
  await stageReady;
  assert.equal(session.stagedSource.state, 'ready');

  const completed = once(session, 'playbackCompleted');
  response.end(wave.subarray(512 * 1024));
  const [event] = await completed;
  assert.equal(event.continuation?.type, 'promoted');
  await session.wait();
  await session.stop();
  await session.dispose();
  console.log('Embedded null-output playback, filters, crossfade promotion and cleanup passed.');
} finally {
  server.closeAllConnections();
  await engine.close();
  await new Promise((resolve) => server.close(resolve));
}
