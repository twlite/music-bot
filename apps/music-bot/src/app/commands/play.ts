import { data, run } from "../../commands/music/play.js";
import { commandHandler } from "#bot/commands/handler";
export const command = data;
export const chatInput = commandHandler(run);
import autocompleteHandler from "../../events/interactionCreate/play.js";
import type { AutocompleteCommand } from "commandkit";
export const autocomplete: AutocompleteCommand = ({ interaction }) =>
  autocompleteHandler(
    interaction as unknown as import("discord.js").Interaction,
  );
