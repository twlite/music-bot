import { useDatabase } from '#bot/hooks/useDatabase';

export async function fetchPlayerOptions(guild: string) {
  const mongoose = useDatabase();

  const guildOptions = await mongoose.guild.findOne({
    id: guild,
  });

  if (!guildOptions) {
    return await mongoose.guild.create({
      id: guild,
    });
  }

  return guildOptions;
}
