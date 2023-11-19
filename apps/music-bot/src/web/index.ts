import { createServer } from 'node:http';
import { createSocketServer } from './socket.js';

const app = createServer();
const io = await createSocketServer(app);

export { app, io };
