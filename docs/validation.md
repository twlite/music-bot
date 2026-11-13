# Validation and release checklist

This is a development migration. Passing a build does not establish live Discord voice behavior.

Implemented boundaries:

- One v8 managed player for embedded and remote nodes; Remedia owns voice recovery and session lifecycle.
- Native source plugins for custom playlists and direct trusted HTTPS audio, plus support for configured source plugin hosts.
- Provider libraries are isolated in the Bun source host, using the v8 host's extractor compatibility API; none are imported by the bot. No eager full-key Redis enumeration.
- Single-use Redis exchange with hashed keys, expiring HTTP-only cookie sessions, exact-origin CORS and socket validation.
- Shared per-guild state broadcasts with 15-second drift corrections, browser interpolation and listener cleanup.

The bot includes no third-party provider libraries or catalogue scraping. The included `apps/stream-providers` Bun server registers YouTube, Spotify, Apple Music and SoundCloud through `host.extractors.loadMulti`. Bot and Remedia configuration point to this authenticated host by default. Saved playlists retain their original URLs; resolving them requires a source plugin that supports those URLs.

Executed locally: 35 unit tests; both builds, typechecks and lint; CommandKit discovery of 18 routes without Discord login; embedded initialization; FFmpeg filter loading and null-output crossfade promotion; authenticated remote probe, server restart and automatic client reconnect; disposable MongoDB/Redis schema/index and atomic-exchange checks. Both application Docker images built successfully. The bot image loaded native filters and initialized healthy embedded and remote nodes, selecting the correct mode from Compose DNS. The official Remedia Dockerfile built successfully from the pinned revision; its service, MongoDB and Redis passed health checks. The standalone dashboard returned HTTP 200 and stopped on SIGTERM. Both Compose profile configurations validated with a temporary current Compose binary. The installed Compose 2.15 could not parse them.

The Bun source host was started directly and from its production Docker image. It advertised all four providers, returned 401 for missing/incorrect execution tokens, and accepted authenticated metadata operations. A disposable Compose project started the source host and official Remedia service to healthy status. Separate v8 players initialized embedded and remote nodes, discovered all four source protocols, and executed authenticated metadata operations over HTTP and through remote Remedia. No provider audio was downloaded and no Discord voice session was created. The source host intentionally has no build script or tests.

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

## CommandKit integration

The bot uses `commandkit dev` and `commandkit build`. CommandKit rewrites the `@/*` TypeScript aliases; the package has no runtime `imports` map. Guild/voice checks run through `src/app/commands/+middleware.ts`.

`commandkit-plugin-discord-player` forwards queue events to `src/app/events/(discord-player)` and player events to `(discord-player-main)`. Version 1.0.0 targets older APIs, so the checked-in pnpm patch updates the v8 event enum, Discord.js `clientReady`, and guild-ID context. No custom filesystem event loader is used.

CommandKit 1.2.6 also has a namespace-router patch: each event gets its own listener list, and lookup keys include the namespace. A regression test covers sibling isolation and same-name events in different namespaces. Built-output verification emits a v8 track-start event through the plugin and checks that exactly one discovered announcement runs.

## Dashboard controls

The current dashboard adds seek debouncing, queue ID edits, requester snapshots, independent effect switches and synchronized/plain lyrics. EQ curves are shared with the server and registered as named Discord Player presets. Custom 15-band settings are retained. LRCLIB uses the official `@discord-player/plugin-host` plugin; no separate HTTP provider is implemented in this app.

Bot tests exercise every EQ preset payload, named/custom EQ composition, concurrent effect persistence, queue edits, stale seeks, public requester metadata, lyrics cancellation/coalescing and `/join` behavior. Dashboard DOM tests exercise keyboard scrubbing, seek cancellation on track changes, effect toggles, queue moves/removals, adding queries, lyric timing and late-client state hydration/listener cleanup. These checks do not establish live Discord playback, actual browser drag behavior or production LRCLIB availability.

The root `pnpm format` and `pnpm format:check` commands use the copied Discord Player oxfmt settings. Local environment files, local Remedia configuration and generated output are excluded. Command handlers use native context-aware Discord Player hooks; CommandKit supplies their guild ID. HTTP and Socket.IO handlers retain explicit guild IDs.

Executed for this dashboard update: 76 tests (65 bot, 11 dashboard DOM), root typecheck/lint/format checks, both application builds, and a compiled shared-preset import check. FFmpeg 9 native null-output playback passed for all 22 exposed effects individually and for combined custom EQ, bass boost, vocal boost and 8D. These native checks do not connect to Discord or validate remote audio output. The README labels its screenshot as the earlier layout.

## Lyrics lookup and playback reconciliation

Regression coverage now includes automatic release-label cleanup without changing queued metadata, manual lyrics queries and match selection, late automatic/manual response races, shared queue suggestions, output-clock selection, periodic five-second position broadcasts per guild, seek reconciliation and rounded/requester-aware embeds. Playback position packets do not serialize queues or query the database. These checks use mocked clocks, DOM interactions and native API contracts; this update has not been verified in live Discord voice playback.

The `/lyrics` command shares the dashboard's automatic lookup and supports explicit queries without a queue. Tests cover plaintext responses, synchronized-line fallback, missing tracks, provider failures and numbered embed splitting with no dropped text or broken surrogate pairs. Current checks pass: 117 tests (102 bot and 15 dashboard), root typecheck/lint/format checks and both builds. Live Discord delivery and voice synchronization still need user verification.

Lyric versions now expose album, stable LRCLIB record ID, nonempty line count and first/last line timestamps. DOM tests verify the selected version survives Queue/Lyrics tab switches, resets for a new track and cancels hidden-tab seeks. The header reports current Discord voice-channel metadata, with regression checks for guild scope, moves, renames and disconnection. Current checks pass: 130 tests, typecheck, lint, formatting and bot/dashboard builds. Live Discord/browser validation has not been performed for these changes.
