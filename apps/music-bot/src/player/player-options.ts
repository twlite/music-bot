import { useDatabase } from "@/hooks/useDatabase";
export async function fetchPlayerOptions(guild: string) {
  return (await useDatabase().guild.findOneAndUpdate(
    { id: guild },
    { $setOnInsert: { id: guild } },
    { upsert: true, new: true, runValidators: true },
  ))!;
}
