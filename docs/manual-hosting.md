# Manual hosting

Run the bot/API and dashboard as separate processes. Nothing requires Docker service names or container paths.

## Node, pnpm and Bun

Install Node.js 24 from nodejs.org (Windows/macOS installers or a Linux Node distribution). Verify `node --version` starts with `v24`. Install pnpm:

```sh
npm install --global pnpm@12.18.0 bun@1.4.4
pnpm --version
bun --version
pnpm install --frozen-lockfile
```

The repository pins pnpm 12.18.0. Run commands from the repository root unless a different directory is shown.

## MongoDB and Redis

Install MongoDB Community 8 using MongoDB's instructions for your OS, or create a MongoDB Atlas database. Create a database user with `readWrite` access only to `music-bot`. A local example is `mongodb://127.0.0.1:27017/music-bot`; an authenticated example is `mongodb://musicbot:PERCENT_ENCODED_PASSWORD@db.example.com:27017/music-bot?authSource=admin`. Atlas supplies an `mongodb+srv://...` URI under **Connect → Drivers**. Add the bot host to the Atlas network access list.

Redis 8 can run on Linux/macOS or on an existing private server. For local macOS installations with Homebrew:

```sh
brew tap mongodb/brew
brew install mongodb-community@8.0 redis
brew services start mongodb-community@8.0
brew services start redis
```

On Windows use MongoDB's Windows service installer and an external Redis server, WSL Redis or a Redis-compatible service such as Memurai. Bind local databases to loopback; use firewall rules, authentication and TLS for external deployments. Set `redis.host` and `redis.port` in `app.config.json`, and `REDIS_PASSWORD` in `.env`. For TLS, use a private tunnel to Redis or extend the Redis connection configuration; the current environment contract does not enable Redis TLS itself.

## FFmpeg 9 for embedded playback

An `ffmpeg` executable alone is insufficient: the native binding loads shared libraries. Required ABI majors: avcodec 63, avformat 63, avutil 61, avfilter 12 and swresample 7. The Remedia installer downloads prebuilt FFmpeg 9.0.2 libraries without replacing your system FFmpeg.

Linux/macOS:

```sh
curl -fsSL https://remedia.twlite.dev/install.sh -o /tmp/install-remedia.sh
# Review /tmp/install-remedia.sh, then:
sh /tmp/install-remedia.sh --ffmpeg-only
```

Windows PowerShell:

```powershell
$installer = Invoke-RestMethod https://remedia.twlite.dev/install.ps1
# Review $installer, then:
& ([scriptblock]::Create($installer)) -FFmpegOnly
```

The runtime is installed under the current user's `.remedia/ffmpeg9` directory and discovered by `@remedia/node`. Run the bot under that same user. For a custom Linux prefix, set `LD_LIBRARY_PATH=/opt/remedia/ffmpeg9/lib` in the service environment before Node starts. For a custom Windows runtime, add its DLL directory to the service's `PATH`; use a new shell after changing PATH. macOS uses the installed dylibs and their library paths. Do not point the loader at FFmpeg 7/8 libraries.

Verify with `pnpm --filter music-bot exec node scripts/native-smoke.mjs`. Linux native/server binaries require modern glibc; Ubuntu 24.04 or Debian 13 is recommended. Remote playback avoids loading native libraries in the bot and is useful on hosts without compatible native builds.

## Bot configuration and secrets

Edit `apps/music-bot/app.config.json` for manual hosting. Docker instead mounts `docker/app.config.json` at the same runtime filename. These files contain non-sensitive settings:

```json
{
  "http": {
    "port": 5000,
    "dashboardUrl": "http://localhost:3000"
  },
  "database": {
    "url": "mongodb://127.0.0.1:27017/music-bot"
  },
  "redis": {
    "host": "127.0.0.1",
    "port": 6379,
    "socketAdapter": false
  },
  "remedia": {
    "mode": "embedded",
    "url": "remedia://127.0.0.1:8787",
    "username": "media-bot"
  },
  "crossfade": {
    "enabled": false,
    "durationMs": 5000
  },
  "mediaAllowedHosts": ["cdn.discordapp.com", "media.discordapp.net"],
  "sourcePluginHosts": [
    {
      "hostId": "stream-providers",
      "url": "http://localhost:5678",
      "tokenEnvironmentVariable": "STREAM_PROVIDERS_TOKEN"
    }
  ]
}
```

`http.dashboardUrl` is the exact dashboard origin, without a trailing slash or path, and controls CORS and `/web` links. `http.port` is the bot API port. `database.url` is an unauthenticated MongoDB address; use the secret override below for credential-bearing URIs. `redis.host` and `redis.port` locate Redis; `redis.socketAdapter` enables Socket.IO fanout when needed. `remedia.mode` is `embedded` or `remote` for manual hosting; `compose` is reserved for Docker's automatic profile selection. `remedia.url` and `remedia.username` identify the remote server and account. `crossfade.enabled` defaults to false; `durationMs` must be between 1000 and 30000. `mediaAllowedHosts` lists exact trusted HTTPS media hosts. `sourcePluginHosts` connects the bot to the included Bun source host, described in [source-host setup](stream-providers.md).

Copy `apps/music-bot/.env.example` to `apps/music-bot/.env` and fill only secrets:

| Variable                 | Purpose                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`          | Developer Portal → application → Bot token                                                   |
| `DATABASE_URL`           | Optional credential-bearing MongoDB URI; overrides `database.url` when nonempty              |
| `REDIS_PASSWORD`         | Redis password; empty for a private local instance without authentication                    |
| `REMEDIA_PASSWORD`       | Password for the account named in `remedia.username`                                         |
| `STREAM_PROVIDERS_TOKEN` | Required shared bearer secret for the included source host; use the same value in its `.env` |

Keep passwords and tokens out of `app.config.json`. Restart the bot after changing configuration. Run it with `apps/music-bot` as its working directory; deployed Docker images use `/app` with their own mounted config. The build preserves this external configuration rather than baking it into JavaScript.

Copy `apps/stream-providers/.env.example` to `apps/stream-providers/.env`. Generate a secret with `openssl rand -hex 32` and put it in both the source host and bot environments as `STREAM_PROVIDERS_TOKEN`. The source host runs directly on Bun; [source-host setup](stream-providers.md) explains its configuration.

Copy `apps/web/.env.example` to `apps/web/.env.local`. Set **both** `NEXT_PUBLIC_GATEWAY_URL` and `NEXT_PUBLIC_BACKEND_URL` to the browser-accessible bot/API origin, e.g. `http://localhost:5000`. These public values are included in the build; never place secrets in `NEXT_PUBLIC_*`. Rebuild when changing them.

## Standalone remote server

Install the official published server and its FFmpeg libraries on the server host:

```sh
curl -fsSL https://remedia.twlite.dev/install.sh -o /tmp/install-remedia.sh
REMEDIA_VERSION=0.2.1 sh /tmp/install-remedia.sh
# Open a new terminal, then:
remedia --version
remedia --generate-config-file ./remedia.config.json
```

Edit the configuration so `users` contains `{"username":"media-bot","password":"env('REMEDIA_RPC_PASSWORD')"}`. Choose the listening address: `127.0.0.1:8787` on the same machine, or a private interface reachable by the bot. Set the password and start:

```sh
export REMEDIA_RPC_PASSWORD='your-long-random-password'
remedia serve --config ./remedia.config.json
```

PowerShell uses `$env:REMEDIA_RPC_PASSWORD = 'your-long-random-password'`. In the bot `app.config.json`, set `remedia.mode` to `remote`, `remedia.url` to `remedia://127.0.0.1:8787`, and `remedia.username` to `media-bot`. Put the same password in the bot `.env` as `REMEDIA_PASSWORD`. The client supplies the Discord bot identity after Gateway READY and manages reconnect/session recovery. The remote server must reach Discord voice and every selected media URL. Sources are resolved near the bot; IP-bound provider URLs may need a source host near Remedia instead.

The server's media/network policies must permit the chosen providers. Add `"audio": {"crossfade": {"enabled": true}}` to the server configuration to permit client-requested crossfade (the bot still defaults to disabled); unsupported nodes fall back to normal queue playback. Recreate sessions after changing crossfade settings.

For the included source host, add the `pluginHosts` block from [source-host setup](stream-providers.md#remote-remedia) to the server config and set `STREAM_PROVIDERS_TOKEN` in the server environment. Keep the host identity and token identical in the bot, source host and remote server. The source host must be reachable by both the bot and Remedia.

## Build and run

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter stream-providers start
```

After the provider server logs that it is listening, start the bot in another terminal:

```sh
pnpm --filter music-bot start
```

Start the dashboard in a third terminal:

```sh
pnpm --filter web start
```

Use `PORT=3001 pnpm --filter web start` on Unix to change the dashboard port; update `http.dashboardUrl` in the bot config accordingly. On Windows set `$env:PORT='3001'` before running the command.

## Linux systemd

Create a dedicated `musicbot` user and install the repository in `/srv/music-bot`, owned by that user. Install FFmpeg as that user or set the explicit library path. Build before starting the services. Put secrets in `/etc/music-bot/bot.env`, mode `0600`, readable by root. Use absolute binary paths from `command -v node` and `command -v pnpm` if yours differ.

`/etc/systemd/system/music-stream-providers.service` (put the shared token in `/etc/music-bot/providers.env`, mode `0600`; adjust the Bun path from `command -v bun`):

```ini
[Unit]
Description=Music source providers
After=network-online.target
Wants=network-online.target

[Service]
User=musicbot
WorkingDirectory=/srv/music-bot/apps/stream-providers
EnvironmentFile=/etc/music-bot/providers.env
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/bun src/index.ts
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=20
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/music-bot.service`:

```ini
[Unit]
Description=Discord music bot and API
After=network-online.target music-stream-providers.service
Wants=network-online.target music-stream-providers.service

[Service]
User=musicbot
WorkingDirectory=/srv/music-bot/apps/music-bot
EnvironmentFile=/etc/music-bot/bot.env
Environment=NODE_ENV=production
Environment=LD_LIBRARY_PATH=/home/musicbot/.remedia/ffmpeg9/lib
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/music-dashboard.service`:

```ini
[Unit]
Description=Music dashboard
After=network-online.target music-bot.service

[Service]
User=musicbot
WorkingDirectory=/srv/music-bot/apps/web
Environment=NODE_ENV=production
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now music-stream-providers music-bot music-dashboard
journalctl -u music-bot -f
sudo systemctl restart music-stream-providers music-bot music-dashboard
```

For local database services add their actual unit names to `After=`. External database hosts do not need local unit dependencies. On SIGTERM the bot releases Remedia sessions, destroys the Discord client, closes Socket.IO/HTTP and disconnects MongoDB/Redis. A stalled shutdown has a 15-second exit deadline. Use a separate supervised service for a standalone Remedia server, with its own user, working directory, environment file and `ExecStart=/path/to/remedia serve --config /path/to/remedia.config.json`.
