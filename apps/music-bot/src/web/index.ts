import { createServer } from 'node:http';
import express from 'express';
import { createSocketServer } from './socket.js';

const server = createServer();
const io = createSocketServer(server);

const app = express();

app.use;

export { app, io };
