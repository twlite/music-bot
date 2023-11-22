import { createServer } from 'node:http';
import { SocketUser, createSocketServer } from './socket.js';
import express from 'express';
import { serialize, useMainPlayer } from 'discord-player';
import { withAuthentication } from './middlewares/withAuthentication.js';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = await createSocketServer(server);

app.use(cors());

app.get('/search', withAuthentication, async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string')
    return res.status(400).json({
      error: 'Invalid query parameter',
    });

  const player = useMainPlayer();

  const user: SocketUser = (req as any).user;

  try {
    const result = await player.search(query, {
      requestedBy: user.id,
    });

    if (result.playlist) {
      return res.json([serialize(result.playlist)]);
    }

    return res.json(result.tracks.slice(0, 5).map((track) => serialize(track)));
  } catch {
    return res.json([]);
  }
});

export { server as app, io };
