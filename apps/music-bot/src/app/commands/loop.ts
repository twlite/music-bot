import { data, run } from "../../commands/music/loop.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run);
