# Saved playlists and v6 records

The MongoDB `playlists` collection and guild IDs are retained. There is no destructive migration on startup and no conversion to another database.

The v8 source plugin accepts `playlist:<uuid>`, checks the author for private playlists, reads each stored public URL, and asks the current registered sources to resolve it. It ignores old live extractor/engine state. Versioned v8 records are supported through their `data.url`; v6 records use the top-level `url`. File URLs, credential-bearing URLs and recursive playlist references are rejected. If any track fails to resolve, the request fails and the original record remains intact.

This means an old playlist does not require a bulk rewrite before use. Media that has been removed from a provider, records without URLs and unsupported legacy serialization formats need manual repair. No bot can recover media that no longer exists upstream.

Before upgrading:

1. Stop the old bot and make a MongoDB archive as described in [operations](operations.md).
2. Restore the archive into a separate staging database.
3. Point this branch at the staging database. Test one public playlist, one private playlist as its owner and the same private playlist as a different user.
4. Compare document counts and sample records before and after. Loading a playlist must not update its document.
5. After validation, use the original database with this version. Keep the archive and previous application revision.

To deliberately migrate an individual playlist, play it, verify its titles and recording choices, then use `/playlist create` with a new name. That writes a separate v8 playlist and preserves the original ID/document. Catalogue sources can select a different playable recording, so review those tracks before saving. Roll back by deleting only the new playlist and returning to the old ID.

Public autocomplete now resolves through the source plugin instead of copying the entire playlist collection into Redis. Private playlists are not placed into a shared public cache. MongoDB indexes cover author listing and public visibility; Redis exchange codes expire after 60 seconds and sessions after one hour.
