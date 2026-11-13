# Validation and release checklist

This is a development migration. Passing a build does not establish live Discord voice behavior.

Implemented boundaries:

- One v8 managed player for embedded and remote nodes; Remedia owns voice recovery and session lifecycle.
- Native source plugins for custom playlists, direct trusted HTTPS audio, YouTube and SoundCloud. Spotify/Apple catalogue tracks and Vimeo/ReverbNation public metadata bridge to a playable provider.
- No default v6 extractor or ytdl packages. No eager full-key Redis enumeration.
- Single-use Redis exchange with hashed keys, expiring HTTP-only cookie sessions, exact-origin CORS and socket validation.
- Shared per-guild state broadcasts with 15-second drift corrections, browser interpolation and listener cleanup.

Provider limitations: Spotify's public metadata library returns at most 100 catalogue entries. Apple song/album lookup is limited to 200 entries; Apple editorial playlists are not supported by that lookup. YouTube queues are capped at 1000 entries. Alternative playback selected from catalogue titles may use a different recording. SoundCloud availability depends on public access/client-ID discovery. None of these providers was certified against live Discord in this migration.

Executed locally: 35 unit tests; both builds, typechecks and lint; CommandKit discovery of 18 routes without Discord login; embedded initialization; FFmpeg filter loading and null-output crossfade promotion; authenticated remote probe, server restart and automatic client reconnect; disposable MongoDB/Redis schema/index and atomic-exchange checks. Both application Docker images built successfully. The bot image loaded native filters and initialized healthy embedded and remote nodes, selecting the correct mode from Compose DNS. The official Remedia Dockerfile built successfully from the pinned revision; its service, MongoDB and Redis passed health checks. The standalone dashboard returned HTTP 200 and stopped on SIGTERM. Both Compose profile configurations validated with a temporary current Compose binary. The installed Compose 2.15 could not parse them.

The remote smoke test uses an installed standalone server and a disposable local configuration. It checks authentication, native media probing and transport reconnect, without creating Discord voice sessions. Remote filter/crossfade playback and active-session recovery remain unverified.

Local validation commands:

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter music-bot exec node scripts/native-smoke.mjs
pnpm --filter music-bot exec node scripts/remote-smoke.mjs
```

The native smoke command uses generated WAV data, local HTTP and a null PCM output. It is separate from live Discord validation. The Docker build and registry/Compose checks are recorded in the delivery summary; do not treat the supplied configuration as integration-tested until it starts on a current Docker host.

Before deploying publicly, test with your own Discord application in **both** modes:

1. Play two tracks in two guilds concurrently; confirm independent volume, seek, skip, repeat, history and shuffle.
2. Toggle all effects and change each EQ band; confirm that combinations persist after a queue is recreated.
3. Enable crossfade, observe one transition at the end of the first track, and verify skip/seek/repeat during preparation do not double-advance.
4. Move the bot between voice channels. Interrupt voice networking and restore it. Restart/disconnect remote transport and verify session recovery or an actionable failure.
5. Leave voice empty and wait one minute. Confirm queue/session cleanup. Stop the processes with SIGTERM and confirm that no services remain running.
6. Open multiple dashboard tabs, disconnect them and confirm stable listener counts. Attempt expired/reused login codes, another guild's actions, malformed EQ/volume/loop payloads and a user who left voice.
7. Restore legacy playlists into a disposable database, play them, and compare the original documents byte-for-byte.
8. Start embedded Compose, stop it without deleting volumes, start the remote profile and confirm `Compose playback mode: remote`. Verify health checks, startup failures, persistence and shutdown.

The official `ghcr.io/twlite/remedia:0.2.1` registry tag returned `manifest unknown`, so the remote service builds the official upstream Dockerfile at a pinned revision using the published release binaries. Compose 2.15 on the host rejects optional dependencies; 2.20+ is required. These checks do not establish live Discord playback.
