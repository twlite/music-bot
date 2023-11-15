import { usePrisma } from '#bot/hooks/usePrisma';

export async function fetchPlayerOptions(guild: string) {
  const prisma = usePrisma();

  const guildOptions = await prisma.guild.findUnique({
    where: { id: guild },
  });

  if (!guildOptions) {
    return await prisma.guild.create({
      data: {
        id: guild,
      },
    });
  }

  return guildOptions;
}
