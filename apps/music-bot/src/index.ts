import "dotenv/config";
import "./bootstrap/database.js";
import redis from "./bootstrap/redis.js";
import { client, commandkit } from "./bootstrap/client.js";
import { player, registerSourceHosts } from "./player/runtime.js";
import { registerPlayerEvents } from "./player/registerEvents.js";
import { app, io } from "./web/index.js";
import mongoose from "mongoose";

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 15000).unref();
  await Promise.allSettled([
    player.destroy(),
    new Promise<void>((resolve) => io.close(() => resolve())),
  ]);
  client.destroy();
  await Promise.allSettled([mongoose.disconnect(), redis.quit()]);
  clearTimeout(deadline);
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

player.on("error", (error) => console.error("Player:", error.message));
await registerPlayerEvents();
player.events.on("error", () =>
  console.error("Queue or voice operation failed"),
);
player.events.on("playerError", () =>
  console.error("Track playback failed; use /skip or retry /play"),
);

client.once("clientReady", async (ready) => {
  try {
    await player.initialize(ready.user.id);
    await registerSourceHosts();
  } catch {
    console.error(
      "Playback initialization failed. Check the Remedia endpoint, credentials and FFmpeg runtime.",
    );
    process.exitCode = 1;
    await shutdown();
  }
});
try {
  await commandkit.start(process.env.DISCORD_TOKEN);
  if (!stopping) app.listen(Number(process.env.PORT ?? 5000), "0.0.0.0");
} catch {
  console.error(
    "Discord startup failed. Check DISCORD_TOKEN, network access and application permissions.",
  );
  process.exitCode = 1;
  await shutdown();
}
