import { data, run } from "../../commands/misc/ping.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run, false);
