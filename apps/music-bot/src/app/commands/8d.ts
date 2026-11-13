import { data, run } from "../../commands/music/8d.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run);
