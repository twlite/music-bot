# Music Bot

A complete example of a discord music bot including database, web dashboard, and more powered by [discord.js](https://discord.js.org/#/) and [discord-player](https://discord-player.js.org).

## Setup

### Bot setup

- Run `pnpm install --frozen-lockfile` to install all dependencies
- Rename `.env.example` to `.env` and fill out the values
  - Put your bot token in `DISCORD_TOKEN`
  - Put postgresql database credentials in `DATABASE_URL` (You can get one for free from [https://neon.tech](https://neon.tech))
  - Put your redis config in `REDIS_*` (you can use memurai for windows or get a free instance from [https://app.redislabs.com](https://app.redislabs.com))
- Run `pnpm run bot dev` to start the bot in development mode

### Dashboard

- TODO
