import { z } from 'zod';
import { effectPresets } from '@/player/effects';

const trackId = z.string().min(1).max(128);

export const equalizerSchema = z
  .array(
    z.object({
      band: z.number().int().min(0).max(14),
      gain: z.number().min(-0.25).max(1),
    }),
  )
  .length(15)
  .refine((eq) => new Set(eq.map((e) => e.band)).size === 15);

export const seekSchema = z.object({ trackId, positionMs: z.number().min(0) });
export const effectSchema = z.object({
  name: z.string().refine((name) => effectPresets.some((p) => p.name === name)),
  enabled: z.boolean(),
});
export const queueItemSchema = z.object({ trackId });
export const queueMoveSchema = z.object({ trackId, beforeId: trackId.nullable() });

export const lyricsSchema = z.object({
  trackId,
  query: z.string().trim().max(200).optional(),
  resultIndex: z.number().int().min(0).max(7).optional(),
  requestId: z.string().min(1).max(128).optional(),
});
