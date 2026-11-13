# Operations

## Public dashboard access

Keep MongoDB, Redis and Remedia on a private network. The example Compose file publishes only the bot/API and dashboard, on loopback. Put TLS in front of ports 3000 and 5000, e.g. `music.example.com` and `api.example.com`. The API proxy must forward WebSocket Upgrade/Connection headers for `/socket.io/`. Set the exact dashboard origin in `http.dashboardUrl` in `app.config.json`, and the public API origin in the dashboard build variables. Rebuild after changing any `NEXT_PUBLIC_*` value.

Session cookies use HTTP-only, SameSite=Strict and Secure when the dashboard URL is HTTPS. Keep both origins on the same site. A dashboard on an unrelated domain is unsupported by this cookie configuration. Existing reusable v6 tokens use a different Redis namespace and are not accepted. Do not log URL query strings at the reverse proxy; the initial `/web` link carries a one-time code.

One bot/API instance is the supported default. `redis.socketAdapter: true` in `app.config.json` only shares Socket.IO room broadcasts; it does not coordinate Discord queue ownership across independently running bots. Running multiple clients with the same bot token is not a supported scaling configuration.

## Backup with Docker

Create a private backup directory and archive the MongoDB database:

```sh
mkdir -p backups
chmod 700 backups
docker compose exec -T mongo mongodump --db music-bot --archive --gzip > backups/music-bot.archive.gz
```

Store copies off the host, with encryption and access controls. The archive includes custom playlists and guild settings. Also back up `.env` separately using your password manager or secret store. Do not commit it. Redis contains expiring dashboard sessions, not the authoritative playlist library; restoring Redis is unnecessary after a database restore.

For a consistent upgrade snapshot, stop the bot before dumping:

```sh
docker compose stop bot
docker compose exec -T mongo mongodump --db music-bot --archive --gzip > backups/pre-update.archive.gz
git pull --ff-only
pnpm --version # only needed for local/manual work
docker compose up -d --build
```

If using the remote profile, include `--profile remote` in both stop/start operations as needed. For manual hosting, stop systemd services, use `mongodump --uri='mongodb://127.0.0.1:27017/music-bot' --archive=backups/pre-update.archive.gz --gzip`, then run `pnpm install --frozen-lockfile`, `pnpm build` and restart the services. Keep database passwords out of shared shell history.

## Restore and rollback

First restore into a **new database** and inspect it. This keeps your current database untouched:

```sh
docker compose exec -T mongo mongorestore --archive --gzip --nsFrom='music-bot.*' --nsTo='music-bot-restore.*' < backups/music-bot.archive.gz
docker compose exec mongo mongosh music-bot-restore --eval 'db.playlists.countDocuments({})'
```

To use it, stop the bot, change its database URI to `music-bot-restore`, then restart. Edit `database.url` in `docker/app.config.json` when choosing the restored database; a nonempty secret `DATABASE_URL` overrides that address. Manual hosting changes `apps/music-bot/.env` or the systemd environment file.

For a release rollback, check out the previous application revision, reinstall its lockfile dependencies and rebuild. Point it at the matching restored database. This migration does not bulk-rewrite old playlists, so existing v6 data remains available for rollback. New v8 playlists may not be readable by the old application; retain the pre-upgrade archive.

Never run `docker compose down --volumes` unless you intend to delete persistent data. `docker compose down` by itself keeps the named volumes.

## Shutdown and diagnostics

```sh
docker compose logs --tail=100 bot
docker compose logs --tail=100 web
docker compose stop
```

SIGTERM stops native sessions, disconnects Discord, closes HTTP/Socket.IO and releases database connections. Compose allows 30 seconds before SIGKILL. Remedia's own image handles SIGTERM. Keep logs private: provider errors can include identifying information; avoid enabling verbose provider logs in production.
