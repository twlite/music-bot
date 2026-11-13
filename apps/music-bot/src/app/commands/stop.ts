import { data, run } from "../../commands/music/stop.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run);
