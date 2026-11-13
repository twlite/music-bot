import { AudioFilter as AudioFilters, AudioFilterPresets, type AudioFilterName, type GuildQueue } from 'discord-player';
import { EqualizerConfigurationPreset, type EqualizerBand } from '@music-bot/shared';
import { useDatabase } from '@/hooks/useDatabase';
import type { IGuildSchema } from '@/bootstrap/mongo/Guild.schema';

export const frequencies = [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000];

export function equalizerGraph(equalizer: number[]) {
  if (equalizer.length !== 15 || equalizer.some((n) => !Number.isFinite(n) || n < -0.25 || n > 1)) {
    throw new Error('Equalizer requires 15 gains between -0.25 and 1');
  }
  return (
    equalizer
      .flatMap((gain, band) =>
        gain === 0 ? [] : [`equalizer=f=${frequencies[band]}:t=o:w=1:g=${20 * Math.log10(1 + gain)}`],
      )
      .join(',') || null
  );
}

AudioFilters.defineBulk([
  { name: 'bassboost', value: 'bass=g=10' },
  ...Object.entries(EqualizerConfigurationPreset).map(([name, bands]) => ({
    name: `eq_${name}`,
    value: equalizerGraph(bands.map((b) => b.gain)) ?? 'anull',
  })),
  { name: 'vocalboost', value: 'equalizer=f=3000:t=o:w=2:g=4' },
]);

// These presets preserve the media timeline and are safe to combine interactively.
export const effectPresets = [
  'bassboost_low',
  'bassboost',
  '8D',
  'vocalboost',
  'nightcore',
  'vaporwave',
  'treble',
  'normalizer',
  'normalizer2',
  'phaser',
  'tremolo',
  'vibrato',
  'surrounding',
  'pulsator',
  'karaoke',
  'flanger',
  'gate',
  'haas',
  'mono',
  'compressor',
  'softlimiter',
  'chorus',
  'chorus2d',
  'chorus3d',
].map((name) => ({
  name,
  label:
    (
      {
        bassboost_low: 'Light bass',
        bassboost: 'Bass boost',
        vocalboost: 'Vocal boost',
        normalizer: 'Normalizer',
        normalizer2: 'Dynamic normalizer',
        surrounding: 'Surround',
        softlimiter: 'Soft limiter',
        chorus2d: 'Chorus 2D',
        chorus3d: 'Chorus 3D',
      } as Record<string, string>
    )[name] ?? name[0].toUpperCase() + name.slice(1),
}));

export type EffectState = { equalizer: number[]; equalizerPreset: string; filters: string[] };
const states = new WeakMap<GuildQueue, EffectState>();

export function matchingPreset(gains: number[]) {
  return (
    Object.entries(EqualizerConfigurationPreset).find(([, bands]) =>
      bands.every((b, i) => Math.abs(b.gain - gains[i]) < 1e-9),
    )?.[0] ?? 'custom'
  );
}

export function rememberEffects(
  queue: GuildQueue,
  settings: Pick<IGuildSchema, 'equalizer' | 'filters'>,
  replace = false,
) {
  const existing = states.get(queue);
  if (existing && !replace) return existing;
  const state = {
    equalizer: [...settings.equalizer],
    equalizerPreset: matchingPreset(settings.equalizer),
    filters: settings.filters.filter((name) => effectPresets.some((p) => p.name === name)),
  };
  states.set(queue, state);
  return state;
}

export function effectState(queue?: GuildQueue | null): EffectState {
  return (queue && states.get(queue)) || { equalizer: Array(15).fill(0), equalizerPreset: 'Flat', filters: [] };
}

export function filterGraph(equalizer: number[], effects: string[]): string | null {
  return (
    [
      equalizerGraph(equalizer),
      ...effects
        .filter((name) => effectPresets.some((p) => p.name === name))
        .map((name) => AudioFilterPresets[name as keyof typeof AudioFilterPresets]),
    ]
      .filter(Boolean)
      .join(',') || null
  );
}

export function queueDefaults(settings: IGuildSchema) {
  return {
    volume: settings.volume,
    repeatMode: settings.loopMode,
    filterGraph: filterGraph(settings.equalizer, settings.filters),
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 60000,
    leaveOnEnd: true,
    leaveOnEndCooldown: 60000,
    pauseOnEmpty: true,
    maxSize: 1000,
    maxHistorySize: 100,
  };
}

async function apply(queue: GuildQueue, gains: number[], filters: string[]) {
  const previous = states.get(queue);
  const state = rememberEffects(queue, { equalizer: gains, filters }, true);
  try {
    if (state.equalizerPreset === 'custom') {
      await queue.filters.setRaw(filterGraph(gains, filters));
    } else {
      const names = [...state.filters, ...(state.equalizerPreset === 'Flat' ? [] : [`eq_${state.equalizerPreset}`])];
      await queue.filters.set(names as AudioFilterName[]);
    }
  } catch (error) {
    if (previous) states.set(queue, previous);
    else states.delete(queue);
    throw error;
  }
  await useDatabase().guild.updateOne(
    { id: queue.guildId },
    { $set: { equalizer: gains, equalizerPreset: state.equalizerPreset, filters } },
    { upsert: true, runValidators: true },
  );
}

export async function setEqualizer(queue: GuildQueue, bands: EqualizerBand[]) {
  await using _settingsLock = await queue.tasks.acquire('music-bot.effects');
  const settings = await useDatabase().guild.findOne({ id: queue.guildId });
  await apply(
    queue,
    [...bands].sort((a, b) => a.band - b.band).map((b) => b.gain),
    settings?.filters ?? [],
  );
}

export async function toggleEffect(queue: GuildQueue, effect: string, enabled: boolean) {
  if (!effectPresets.some((p) => p.name === effect)) throw new Error('Unknown audio effect');
  await using _settingsLock = await queue.tasks.acquire('music-bot.effects');
  const settings = await useDatabase().guild.findOne({ id: queue.guildId });
  const filters = new Set(settings?.filters ?? []);
  if (enabled) filters.add(effect);
  else filters.delete(effect);
  await apply(queue, settings?.equalizer ?? Array(15).fill(0), [...filters]);
}
