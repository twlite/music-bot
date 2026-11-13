import { createSourcePluginHost } from "@discord-player/plugin-host";
import { AppleMusicExtractor } from "discord-player-applemusic";
import { SoundcloudExtractor } from "discord-player-soundcloud";
import { SpotifyExtractor } from "discord-player-spotify";
import { YoutubeExtractor } from "discord-player-youtubei";
import { z } from "zod";

const config = z
  .strictObject({
    name: z.string().min(1),
    hostId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/),
    hostname: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    publicUrl: z.url(),
  })
  .parse(await Bun.file("app.config.json").json());

const token = process.env.STREAM_PROVIDERS_TOKEN;

if (!token || token.length < 16 || token.length > 4096 || /\s/.test(token)) {
  throw new Error(
    "Set STREAM_PROVIDERS_TOKEN to a 16–4096 character secret without whitespace.",
  );
}

const host = createSourcePluginHost({
  name: config.name,
  hostId: config.hostId,
  publicUrl: config.publicUrl,
  token,
});

try {
  await host.extractors.loadMulti(
    [
      YoutubeExtractor,
      SpotifyExtractor,
      AppleMusicExtractor,
      SoundcloudExtractor,
    ],
    {},
  );
} catch (error) {
  await host.close();
  throw error;
}

const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  idleTimeout: 60,

  fetch(request, server) {
    const pathname = new URL(request.url).pathname;

    if (pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (pathname.startsWith("/remedia/v1/media/")) {
      server.timeout(request, 0);
    }

    return host.fetch(request);
  },
});

let stopping = false;

async function shutdown() {
  if (stopping) return;
  stopping = true;

  const deadline = setTimeout(() => process.exit(1), 15_000);
  deadline.unref();

  try {
    await server.stop(true);
    await host.close();
    clearTimeout(deadline);
    process.exit(0);
  } catch {
    console.error("Stream provider cleanup failed.");
    process.exit(1);
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log(`Stream providers listening at ${config.publicUrl}`);
