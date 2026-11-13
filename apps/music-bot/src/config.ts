import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export const appConfigSchema = z.object({
  http: z.object({
    port: z.number().int().min(1).max(65535),
    dashboardUrl: z
      .url()
      .refine((value) => new URL(value).origin === value, 'Use an origin without a trailing slash or path'),
  }),
  database: z.object({ url: z.string().startsWith('mongodb') }),
  redis: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    socketAdapter: z.boolean(),
  }),
  remedia: z.object({
    mode: z.enum(['embedded', 'remote', 'compose']),
    url: z.url(),
    username: z.string().min(1),
  }),
  crossfade: z.object({
    enabled: z.boolean(),
    durationMs: z.number().int().min(1000).max(30000),
  }),
  mediaAllowedHosts: z.array(z.string().min(1)),
  sourcePluginHosts: z.array(
    z.object({
      hostId: z.string().min(1),
      url: z.url(),
      tokenEnvironmentVariable: z.string().min(1).optional(),
    }),
  ),
});
export type AppConfig = z.infer<typeof appConfigSchema>;
export const config = appConfigSchema.parse(JSON.parse(readFileSync(resolve('app.config.json'), 'utf8')));
