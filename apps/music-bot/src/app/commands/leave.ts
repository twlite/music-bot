import { data, run } from "../../commands/music/leave.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run);
