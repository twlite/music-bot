import { config } from '@/config';
import { Server } from 'socket.io';

const origin = config.http.dashboardUrl;

export const io = new Server({
  serveClient: false,
  maxHttpBufferSize: 8192,
  cors: { origin, credentials: true },
  allowRequest: (req, done) => done(null, req.headers.origin === origin),
});
