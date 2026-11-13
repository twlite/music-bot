import { config } from "@/config";
import { publicTrack, publicPlaylist } from "@/player/public-media";
import { exchangeSession } from "@/player/session";
import { createServer } from "node:http";
import { SocketUser, createSocketServer } from "./socket.js";
import express from "express";
import { useMainPlayer } from "@/player/runtime";
import { withAuthentication } from "./middlewares/withAuthentication.js";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = await createSocketServer(server);

app.use(cors({ origin: config.http.dashboardUrl, credentials: true }));
app.use(express.json({ limit: "8kb" }));
app.get("/health", (_req, res) => {
  const ready = Boolean(useMainPlayer().getRemedia(false));
  res.status(ready ? 200 : 503).json({ ready });
});
app.post("/auth/exchange", async (req, res) => {
  if (req.headers.origin !== config.http.dashboardUrl)
    return void res.sendStatus(403);
  const token = await exchangeSession(req.body?.code ?? "");
  if (!token) return void res.sendStatus(401);
  const secure = config.http.dashboardUrl?.startsWith("https://")
    ? "; Secure"
    : "";
  res.setHeader(
    "Set-Cookie",
    `music_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure}`,
  );
  res.setHeader("Cache-Control", "no-store");
  res.sendStatus(204);
});

app.get("/search", withAuthentication, async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string" || query.length > 1000)
    return res.status(400).json({
      error: "Invalid query parameter",
    });

  const player = useMainPlayer();

  const user: SocketUser = (req as any).user;

  try {
    const result = await player.search(query, {
      requestedBy: user.id,
    });

    if (result.playlist) {
      return res.json([publicPlaylist(result.playlist)]);
    }

    return res.json(
      result.tracks.slice(0, 5).map((track) => publicTrack(track)),
    );
  } catch {
    return res.json([]);
  }
});

export { server as app, io };
