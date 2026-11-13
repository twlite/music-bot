# Troubleshooting

## Bot does not log in / slash commands are missing

Check the token under Developer Portal → Bot. A client secret or application ID is not a bot token. After resetting it, update the bot environment and restart. Reinstall the application using `bot` and `applications.commands` scopes if commands do not appear. Global command registration can take time to reach Discord clients.

Ensure the bot can view the text channel, send embeds, connect to voice and speak. The user must join the bot's voice channel to control it. A firewall must permit Discord Gateway and outbound voice UDP.

## Missing FFmpeg shared libraries

Run `pnpm --filter music-bot exec node scripts/native-smoke.mjs`. If loading fails, install FFmpeg 9 with the Remedia installer under the same OS account that runs the bot. Required majors are avcodec 63, avformat 63, avutil 61, avfilter 12 and swresample 7. A static FFmpeg executable or older Homebrew package does not satisfy this requirement.

On Linux inspect `LD_LIBRARY_PATH` in the service environment. On Windows open a new terminal after installing DLLs. On macOS do not mix x64 Node with ARM64 libraries. See [manual installation](manual-hosting.md).

## Dashboard is inaccessible or says “Invalid session”

Open the dashboard on the hostname configured in `WEB_INTERFACE_URL`. `localhost` and `127.0.0.1` are different origins. The browser, not the bot, must be able to reach `NEXT_PUBLIC_BACKEND_URL`. In Docker those values must not be `http://bot:5000`.

Run `/web` again and open the link within one minute. It works once. Join the bot's voice channel before opening it. Sessions expire after one hour and are not valid after Redis is cleared. Make sure the proxy forwards Socket.IO WebSocket upgrades and credentials, and that dashboard/API names belong to the same site. A fresh dashboard build is required after changing public URL variables.

## Remote authentication or connection failure

Use the same username/password in the bot and server. The supplied Compose username is `media-bot`; the password comes from `.env` as `REMEDIA_PASSWORD` and reaches the server as `REMEDIA_RPC_PASSWORD`. The bot sends its Discord user ID automatically after READY. Do not use your Discord token as the Remedia password.

Check the server address from the bot host. Use `ws://` for a private, non-TLS listener or `wss://` behind TLS. Do not publish plain WebSocket authentication on the internet. Confirm the server supports client 0.2.1 and can reach the media URL. Inspect `remedia doctor --config ./remedia.config.json` on a manually installed server.

If Docker reports `manifest unknown` for `ghcr.io/twlite/remedia:0.2.1`, run `docker compose --profile remote up -d --build`. The remote service includes a build using the official upstream Dockerfile at a pinned commit. It downloads verified 0.2.1 release binaries and prebuilt FFmpeg; no compiler is required. If release downloads are unavailable, retry later or use embedded mode.

## Compose rejects `required` under `depends_on`

Upgrade Docker Compose to 2.20 or newer. `docker compose version` shows the installed plugin version. Optional dependencies are needed to select the remote profile without starting duplicate bot instances. Compose 2.15 on the validation host rejected this field.

## Provider search works but playback fails

Try a direct Discord audio attachment first. YouTube/SoundCloud can change API behavior or apply IP/region restrictions. YouTube uses YouTube.js with a bounded QuickJS decipher runtime; no legacy ytdl package is installed. Spotify and Apple Music provide catalogue metadata, with playback resolved from a playable alternative. Vimeo and ReverbNation public pages use title-based alternatives. These alternatives may differ from the requested recording.

For a remote server on a different IP, signed provider URLs may be bound to the bot host's IP. Place the source provider host near Remedia or run embedded playback. Expired Discord attachment URLs must be replaced with fresh URLs. Add only trusted direct-media hosts to `MEDIA_ALLOWED_HOSTS`; local files and arbitrary internal URLs are intentionally unavailable through the dashboard.

## Crossfade or effects do not take effect

Set `CROSSFADE_ENABLED=true`, use a duration from 1000 to 30000 milliseconds, then disconnect and recreate the queue. Crossfade is a session-creation option. The remote server must advertise crossfade support and allow it in its policy. Filters require PCM decoding and additional CPU; passthrough-only or restricted servers may reject them. The 15 EQ bands accept finite gains from -0.25 to 1; arbitrary filter strings are never accepted from dashboard clients.
