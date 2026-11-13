import { lookup } from 'node:dns/promises';
// The remote service exists in DNS only when Compose enables the remote profile.
if (process.env.REMEDIA_MODE === 'compose') {
  const remote = await lookup('remedia').then(() => true, () => false);
  process.env.REMEDIA_MODE = remote ? 'remote' : 'embedded';
  if (remote) process.env.REMEDIA_URL = 'ws://remedia:8787';
  console.log(`Compose playback mode: ${process.env.REMEDIA_MODE}`);
}
