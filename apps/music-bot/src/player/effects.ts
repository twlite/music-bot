import type { GuildQueue } from "discord-player";
import { useDatabase } from "@/hooks/useDatabase";
import type { IGuildSchema } from "@/bootstrap/mongo/Guild.schema";

export const frequencies = [
  25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000,
  16000,
];

export function filterGraph(
  equalizer: number[],
  effects: string[],
): string | null {
  if (
    equalizer.length !== 15 ||
    equalizer.some((n) => !Number.isFinite(n) || n < -0.25 || n > 1)
  )
    throw new Error("Equalizer requires 15 gains between -0.25 and 1");
  const graphs = equalizer.flatMap((gain, band) =>
    gain === 0
      ? []
      : [
          `equalizer=f=${frequencies[band]}:t=o:w=1:g=${20 * Math.log10(1 + gain)}`,
        ],
  );
  if (effects.includes("8D")) graphs.push("apulsator=hz=0.09");
  if (effects.includes("bassboost")) graphs.push("bass=g=10");
  if (effects.includes("vocalboost"))
    graphs.push("equalizer=f=3000:t=o:w=2:g=4");
  return graphs.join(",") || null;
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

export async function toggleEffect(
  queue: GuildQueue,
  effect: string,
  enabled: boolean,
) {
  const db = useDatabase();
  const settings = await db.guild.findOne({ id: queue.guildId });
  const filters = new Set(settings?.filters ?? []);
  if (enabled) filters.add(effect);
  else filters.delete(effect);
  await queue.filters.setRaw(
    filterGraph(settings?.equalizer ?? Array(15).fill(0), [...filters]),
  );
  await db.guild.updateOne(
    { id: queue.guildId },
    { $set: { filters: [...filters] } },
    { upsert: true, runValidators: true },
  );
}
