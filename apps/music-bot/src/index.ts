import { config } from "@/config";
import "dotenv/config";
import "./bootstrap/database.js";
import redis from "./bootstrap/redis.js";
import { client, commandkit } from "./bootstrap/client.js";
import { player } from "./player/runtime.js";
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

try {
  await commandkit.start(process.env.DISCORD_TOKEN);
  if (!stopping) app.listen(config.http.port, "0.0.0.0");
} catch {
  console.error(
    "Discord startup failed. Check DISCORD_TOKEN, network access and application permissions.",
  );
  process.exitCode = 1;
  await shutdown();
}
