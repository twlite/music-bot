# Stream providers

`apps/stream-providers` is a separate Bun server. It loads `discord-player-youtubei`, `discord-player-spotify`, `discord-player-applemusic` and `discord-player-soundcloud` through `@discord-player/plugin-host`. The bot uses the host's v8 source plugins for discovery; embedded or remote Remedia consumes the host's streams. Provider dependencies stay out of the bot application.

The source host runs TypeScript directly. It has no build step or test suite and does not load the embedded native playback binding. Spotify and Apple Music supply catalog metadata; their extractors bridge to an available matching stream. Provider restrictions can still prevent a track from playing.

## Docker

Set `STREAM_PROVIDERS_TOKEN` in the root `.env` to a random secret, generated with `openssl rand -hex 32`. Compose passes it to the bot, source host and remote Remedia. Keep it separate from `REMEDIA_PASSWORD` and your Discord token.

Both startup commands include the source host:

```sh
docker compose up -d --build
# Or, for remote playback:
docker compose --profile remote up -d --build
```

The service listens privately at `http://stream-providers:5678`. It has no host port mapping. Compose mounts `docker/stream-providers.config.json`; its `publicUrl` is the address Remedia uses for media downloads. `docker/app.config.json` registers the host in embedded mode. In remote mode, the bot discovers the host automatically through Remedia using the registration in `docker/remedia.config.json`.

Inspect startup with `docker compose logs stream-providers`. Health checks pass only after all four extractors have loaded. Initialization contacts YouTube, so the source host needs working outbound HTTPS before the bot can start.

## Manual hosting

Install Bun and dependencies from the repository root:

```sh
npm install --global bun@1.4.4
pnpm install --frozen-lockfile
cp apps/stream-providers/.env.example apps/stream-providers/.env
openssl rand -hex 32
```

Copy the generated value into `STREAM_PROVIDERS_TOKEN` in both `apps/stream-providers/.env` and `apps/music-bot/.env`. Bun loads its `.env` automatically when started in the package directory.

The defaults in `apps/stream-providers/app.config.json` are:

```json
{
  "name": "music-bot-stream-providers",
  "hostId": "stream-providers",
  "hostname": "127.0.0.1",
  "port": 5678,
  "publicUrl": "http://localhost:5678"
}
```

`hostname` is the listening interface. `publicUrl` is the source host origin reachable by **both the bot and Remedia**, including media downloads; it is not the dashboard address. `hostId` is the stable identity used in track references. Keep it identical in all configurations. Restart after changing settings.

Start the source host before the bot:

```sh
pnpm --filter stream-providers start
# During development, use this instead:
pnpm --filter stream-providers dev
```

In another terminal, check readiness and the four advertised providers:

```sh
curl --fail http://localhost:5678/health
curl --fail http://localhost:5678/.well-known/remedia
```

For embedded playback, the bot's default `sourcePluginHosts` entry already points to this address. Remote playback discovers providers through the Remedia server registration below; the bot does not register these HTTP hosts itself. For a separate source-host machine, change that URL and the source host's `publicUrl` to its reachable origin; set `hostname` to its private listening address. Use HTTPS when crossing an untrusted network. Discovery is public; execution requires the bearer token. Media grants are short-lived, single-use URLs issued by the host, so do not log or share them.

SIGINT and SIGTERM stop the listener, cancel streams and close the source host. See the [systemd example](manual-hosting.md#linux-systemd) to keep it running with the bot and dashboard.

## Remote Remedia

The remote server must know the source host as well as the bot. Add this top-level block to your standalone `remedia.config.json` when all processes run on the same machine:

```json
"pluginHosts": [
  {
    "id": "stream-providers",
    "url": "http://localhost:5678",
    "auth": {
      "type": "bearer",
      "token": "env('STREAM_PROVIDERS_TOKEN')"
    },
    "allowHttp": true,
    "operations": [
      { "pluginId": "discord-player.source", "operation": "metadata.execute", "replaySafe": true },
      { "pluginId": "discord-player.source", "operation": "source.search", "replaySafe": true },
      { "pluginId": "discord-player.source", "operation": "source.related", "replaySafe": true },
      { "pluginId": "discord-player.source", "operation": "source.stream", "replaySafe": false }
    ]
  }
]
```

Set `STREAM_PROVIDERS_TOKEN` in the Remedia server's environment to the same secret used by the source host and bot. On Linux/macOS:

```sh
export STREAM_PROVIDERS_TOKEN='paste-the-generated-secret'
export REMEDIA_RPC_PASSWORD='your-remedia-account-password'
remedia serve --config ./remedia.config.json
```

PowerShell uses `$env:STREAM_PROVIDERS_TOKEN = 'paste-the-generated-secret'`. If Remedia runs elsewhere, replace `localhost` with the source host's private hostname, and update the bot URL and source host `publicUrl` too. Do not use Docker service names for manual hosting. The `allowHttp` exception is for this trusted host; it does not enable arbitrary HTTP media inputs globally.

The host identity must remain `stream-providers` in the server registration and bot configuration. Incorrect tokens produce authorization errors even though discovery still works. If provider initialization fails, check outbound HTTPS and `docker compose logs stream-providers` or the manual process output before troubleshooting Discord voice.
