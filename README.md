# Music Bot

A self-hosted Discord music bot with a browser dashboard. Slash commands and the dashboard control the same per-server Discord Player v8 queue. MongoDB keeps your volume, repeat mode, equalizer, effects and saved playlists. Redis holds expiring dashboard sessions.

Features include search and autocomplete, saved private or public playlists, previous/next track, pause/resume, repeat, shuffle, a 15-band equalizer, bass and vocal boost, 8D audio and optional crossfade. Playback uses Remedia, either embedded in the bot or on a separate server. The dashboard remains a Next.js Pages Router application.

![Dashboard](assets/image.png)

**Migration status:** this branch uses a development release of Discord Player. Local builds, tests and native playback checks are described in [validation](docs/validation.md). Live Discord/provider playback and the complete Compose stack have not been certified. The remote profile builds the official Remedia Dockerfile at a pinned source revision, using published 0.2.1 binaries. Embedded Docker provisions FFmpeg independently. Neither path compiles Remedia or FFmpeg.

## Before you start

- A Discord server where you can install applications.
- A Discord bot token. Open the [Developer Portal](https://discord.com/developers/applications), select **New Application**, give it a name, then open **Bot → Reset Token** and copy the token. Keep it private.
- Under **Installation**, enable Guild Install, select `bot` and `applications.commands` scopes, and grant **View Channels, Send Messages, Embed Links, Connect, Speak**. Open the generated install link and choose your server. No privileged Gateway intents are required.
- For Docker: Docker Engine/Desktop with **Compose 2.20 or later**, and internet access during the first build. Images target Linux x64 and ARM64.
- For manual hosting: **Node.js 24**, **pnpm 12.18.0**, MongoDB 8 and Redis 8 (or compatible external servers). Embedded playback also needs FFmpeg 9 shared libraries. See [manual installation](docs/manual-hosting.md).

The machine needs outbound HTTPS, Discord Gateway WebSockets and UDP voice access. MongoDB and Redis should be private services.

## Docker: embedded playback

```sh
git clone https://github.com/twlite/music-bot.git
cd music-bot
cp .env.example .env
```

Edit `.env`:

```dotenv
DISCORD_TOKEN=paste-the-bot-token-from-the-Developer-Portal
WEB_INTERFACE_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
REMEDIA_PASSWORD=replace-with-a-long-random-password
CROSSFADE_ENABLED=false
CROSSFADE_DURATION_MS=5000
MEDIA_ALLOWED_HOSTS=cdn.discordapp.com,media.discordapp.net
```

`DISCORD_TOKEN` is required to log in. `WEB_INTERFACE_URL` is the exact dashboard origin, without a trailing slash; it controls login links and CORS. `NEXT_PUBLIC_BACKEND_URL` is the API address **your browser** can reach; it is embedded when the dashboard builds. The two defaults work when opening the dashboard on the Docker host. `REMEDIA_PASSWORD` is a password you choose for the optional remote server; it is required by Compose interpolation even in embedded mode. Generate one with `openssl rand -hex 32` or a password manager.

`CROSSFADE_ENABLED=true` enables overlap for newly created voice sessions; leave it false for ordinary playback. `CROSSFADE_DURATION_MS` sets overlap duration (1000–30000 milliseconds). `MEDIA_ALLOWED_HOSTS` is a comma-separated list of trusted hosts for direct HTTPS audio. YouTube, SoundCloud and catalogue URLs have separate source plugins.

```sh
docker compose up -d --build
docker compose logs -f bot
```

The bot/API listens on host port 5000; the dashboard listens on 3000. Both ports bind to loopback. MongoDB, Redis and Remedia have no public port mappings. Persistent data goes into named Docker volumes. The bot installs prebuilt FFmpeg 9 libraries during its image build; you do not compile FFmpeg or Remedia.

For access from another computer, put an HTTPS reverse proxy in front of these loopback ports. Set `WEB_INTERFACE_URL=https://music.example.com` and `NEXT_PUBLIC_BACKEND_URL=https://api.example.com`, then rebuild. Forward WebSocket upgrades to port 5000. Use dashboard/API names on the same site so browser session cookies work. See [operations](docs/operations.md).

## Play your first song

Join a Discord voice channel. Run `/play query:<YouTube or SoundCloud URL>` or `/play query:<song name>`. You can also upload an audio attachment to Discord and use its HTTPS URL. Provider availability depends on your region and upstream anti-bot restrictions; direct media is useful for testing independently.

Use `/pause`, `/resume`, `/skip`, `/back`, `/seek`, `/shuffle`, `/volume`, `/loop`, `/stop` and `/leave`. `/playlist create` saves the current and upcoming tracks; `/playlist list` shows your IDs. Play one with `/play query:playlist:<id>`.

Run `/web` while in the bot's voice channel. Open the private link within **60 seconds**. The dashboard exchanges it once for an HTTP-only, one-hour cookie, then removes the code from the address bar. Do not share the link. Reloading uses the cookie; an expired session requires a new `/web` link. Every action rechecks your Discord membership and voice access.

## Remote playback

The optional profile starts `ghcr.io/twlite/remedia:0.2.1`, using the password from `.env`:

```sh
docker compose --profile remote up -d --build
```

Compose starts Remedia before the bot. The bot detects the profile's Remedia service through internal DNS and selects remote playback. With no remote service it selects embedded playback. Commands, playlists and dashboard behavior use the same player in both modes. Check `Compose playback mode: remote` in bot logs. When changing modes on an already running stack, stop it first so the bot rechecks the selected profile. Volumes are retained. Then run either startup command; for example, to return to embedded mode:

```sh
docker compose --profile remote down
docker compose up -d --build --force-recreate
```

Do not add `--volumes` to `down`. The pinned registry tag was unavailable during validation, so `--build` builds the official image from its pinned upstream Dockerfile. The first build downloads published binaries and FFmpeg libraries. See [manual remote setup and source hosts](docs/manual-hosting.md).

## Hosting without Docker

```sh
npm install --global pnpm@12.18.0
pnpm install --frozen-lockfile
cp apps/music-bot/.env.example apps/music-bot/.env
cp apps/web/.env.example apps/web/.env.local
```

Set the bot token and MongoDB/Redis addresses in `apps/music-bot/.env`. Install FFmpeg 9 for embedded mode using the [platform instructions](docs/manual-hosting.md). Then:

```sh
pnpm build
# Terminal/service 1
pnpm --filter music-bot start
# Terminal/service 2
pnpm --filter web start
```

For development, use `pnpm --filter music-bot dev` and `pnpm --filter web dev` in separate terminals. Bot development rebuilds before starting; restart it after source changes. Dashboard development supports hot reload. Production should use the built `start` commands and a process supervisor. [Manual hosting](docs/manual-hosting.md) covers Windows, macOS, Linux, external services, environment variables and systemd.

## Updating and backups

Back up MongoDB before updating. MongoDB volumes contain guild settings and playlists; Redis sessions can expire without losing playlists. Stop the bot, pull the new revision, rebuild and restart. Saved v6 playlists are read without rewriting their records; each URL is resolved using the current providers. Missing or unsafe tracks fail clearly and leave the original playlist intact.

See [backup, restore, upgrades and rollback](docs/operations.md), [saved playlist migration](docs/playlists.md), and [troubleshooting](docs/troubleshooting.md).

## Development checks

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter music-bot exec node scripts/native-smoke.mjs
```

The last command requires FFmpeg 9 and checks local native decoding with a null output, filters, crossfade preparation and controls. It does not connect to Discord. Provider limitations and the remaining live validation checklist are recorded in [validation](docs/validation.md).
