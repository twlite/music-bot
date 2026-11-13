import { useDatabase } from '@/hooks/useDatabase';
export async function fetchPlayerOptions(guild: string) {
  return (await useDatabase().guild.findOneAndUpdate(
    { id: guild },
    { $setOnInsert: { id: guild } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  ))!;
}
