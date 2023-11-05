import type { Client } from "discord.js";

export default (client: Client<true>) => {
    console.log(`Logged in as ${client.user.tag}`);
}