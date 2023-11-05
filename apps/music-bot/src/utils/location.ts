import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const getFilename = (url: string) => fileURLToPath(url);
export const getDirname = (url: string) => dirname(fileURLToPath(url));
