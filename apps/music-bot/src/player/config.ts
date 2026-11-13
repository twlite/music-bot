import type { DiscordPlayerNode } from "discord-player";

export function createRemediaNodes(
  env: NodeJS.ProcessEnv = process.env,
): DiscordPlayerNode[] {
  const mode = env.REMEDIA_MODE ?? "embedded";
  if (mode === "embedded") return [{ id: "local", type: "embedded" }];
  if (mode !== "remote")
    throw new Error("REMEDIA_MODE must be embedded or remote");
  if (!env.REMEDIA_URL || !env.REMEDIA_USERNAME || !env.REMEDIA_PASSWORD) {
    throw new Error(
      "Remote mode requires REMEDIA_URL, REMEDIA_USERNAME and REMEDIA_PASSWORD",
    );
  }
  return [
    {
      id: "remote",
      type: "remote",
      url: env.REMEDIA_URL,
      auth: { username: env.REMEDIA_USERNAME, password: env.REMEDIA_PASSWORD },
    },
  ];
}
